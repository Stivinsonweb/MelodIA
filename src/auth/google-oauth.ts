import type { Express, Request, Response } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { getAuthConfig } from './config';
import { getAuthDb } from './auth-db';
import { decryptString, encryptString, randomId, sha256Base64Url } from './crypto';
import { clearCookie, getRequestIp, parseCookies, sanitizeReturnTo, setCookie } from './http-utils';
import { recordAudit } from './audit';

type OAuthTxn = {
  createdAt: number;
  codeVerifier: string;
  nonce: string;
  returnTo: string;
  remember: boolean;
  ip?: string;
  userAgent?: string;
};

const oauthTxns = new Map<string, OAuthTxn>();
const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const SID_COOKIE = 'melodia_sid';
const OAUTH_MAX_AGE_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 30;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const FAIL_WINDOW_MS = 10 * 60 * 1000;
const FAIL_MAX = 5;
const LOCK_MS = 10 * 60 * 1000;
const failBuckets = new Map<string, { count: number; resetAt: number; lockedUntil?: number }>();

function isSecureRequest(req: Request) {
  if (req.secure) return true;
  const xfp = req.headers['x-forwarded-proto'];
  return typeof xfp === 'string' && xfp.toLowerCase() === 'https';
}

function getOrigin(req: Request) {
  const cfg = getAuthConfig();
  if (cfg.appOrigin) return cfg.appOrigin;
  return `${req.protocol}://${req.get('host')}`;
}

async function pruneExpiredSessions() {
  const db = await getAuthDb();
  const now = Date.now();
  db.data!.sessions = db.data!.sessions.filter((s) => Date.parse(s.expiresAt) > now);
  await db.write();
}

async function refreshAccessTokenIfNeeded(sessionId: string) {
  const cfg = getAuthConfig();
  const db = await getAuthDb();
  const session = db.data!.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const expiresAt = session.accessTokenExpiresAt ? Date.parse(session.accessTokenExpiresAt) : NaN;
  if (!Number.isFinite(expiresAt)) return session;
  if (expiresAt - Date.now() > 60_000) return session;

  if (!session.encryptedRefreshToken) return session;
  const refreshToken = decryptString(session.encryptedRefreshToken, cfg.sessionSecret);

  const body = new URLSearchParams();
  body.set('client_id', cfg.googleClientId);
  body.set('client_secret', cfg.googleClientSecret);
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', refreshToken);

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });

  const payload = await resp.json().catch(() => null);
  if (!resp.ok || !payload || typeof payload.access_token !== 'string') return session;

  session.encryptedAccessToken = encryptString(payload.access_token, cfg.sessionSecret);
  session.accessTokenExpiresAt =
    typeof payload.expires_in === 'number' && payload.expires_in > 0
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : undefined;
  await db.write();

  return session;
}

async function getSession(req: Request) {
  await pruneExpiredSessions();
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[SID_COOKIE];
  if (!sid) return null;
  const db = await getAuthDb();
  const session = await refreshAccessTokenIfNeeded(sid);
  if (!session) return null;
  if (Date.parse(session.expiresAt) <= Date.now()) return null;
  return session;
}

async function destroySession(res: Response, sessionId: string) {
  const db = await getAuthDb();
  db.data!.sessions = db.data!.sessions.filter((s) => s.id !== sessionId);
  await db.write();
  clearCookie(res, SID_COOKIE);
}

async function createSession(
  req: Request,
  res: Response,
  userId: string,
  remember: boolean,
  tokens?: {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
},
) {
  const cfg = getAuthConfig();
  const now = new Date();
  const ttlMs = remember ? cfg.sessionTtlDays * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
  const sessionId = randomId(32);
  const csrfToken = randomId(24);

  const encryptedAccessToken = tokens?.accessToken
    ? encryptString(tokens.accessToken, cfg.sessionSecret)
    : undefined;
  const encryptedRefreshToken = tokens?.refreshToken
    ? encryptString(tokens.refreshToken, cfg.sessionSecret)
    : undefined;

  const db = await getAuthDb();
  db.data!.sessions.push({
    id: sessionId,
    userId,
    createdAt: now.toISOString(),
    expiresAt,
    csrfToken,
    encryptedAccessToken,
    encryptedRefreshToken,
    accessTokenExpiresAt: tokens?.accessTokenExpiresAt,
    lastIp: getRequestIp(req),
    lastUserAgent: req.headers['user-agent']
  });
  await db.write();

  setCookie(res, SID_COOKIE, sessionId, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'Lax',
    path: '/',
    maxAgeSeconds: remember ? Math.floor(ttlMs / 1000) : undefined
  });

  return { sessionId, csrfToken };
}

function pruneOAuthTxns() {
  const cutoff = Date.now() - OAUTH_MAX_AGE_MS;
  for (const [state, txn] of oauthTxns.entries()) {
    if (txn.createdAt < cutoff) oauthTxns.delete(state);
  }
}

function rateLimit(ip: string | undefined) {
  if (!ip) return false;
  const now = Date.now();
  const prev = rateBuckets.get(ip);
  if (!prev || prev.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  prev.count += 1;
  return prev.count > RATE_MAX;
}

function isLocked(ip: string | undefined) {
  if (!ip) return false;
  const now = Date.now();
  const b = failBuckets.get(ip);
  if (!b) return false;
  return typeof b.lockedUntil === 'number' && b.lockedUntil > now;
}

function recordFailure(ip: string | undefined) {
  if (!ip) return;
  const now = Date.now();
  const prev = failBuckets.get(ip);
  if (!prev || prev.resetAt <= now) {
    failBuckets.set(ip, { count: 1, resetAt: now + FAIL_WINDOW_MS });
    return;
  }
  prev.count += 1;
  if (prev.count >= FAIL_MAX) {
    prev.lockedUntil = now + LOCK_MS;
  }
}

function clearFailures(ip: string | undefined) {
  if (!ip) return;
  failBuckets.delete(ip);
}

async function exchangeCodeForTokens(req: Request, code: string, codeVerifier: string) {
  const cfg = getAuthConfig();
  const origin = getOrigin(req);
  const redirectUri = `${origin}/auth/google/callback`;

  const body = new URLSearchParams();
  body.set('code', code);
  body.set('client_id', cfg.googleClientId);
  body.set('client_secret', cfg.googleClientSecret);
  body.set('redirect_uri', redirectUri);
  body.set('grant_type', 'authorization_code');
  body.set('code_verifier', codeVerifier);

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });

  const payload = await resp.json().catch(() => null);
  if (!resp.ok || !payload) {
    const reason = typeof payload?.error === 'string' ? payload.error : `token_exchange_${resp.status}`;
    throw new Error(reason);
  }

  return payload as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    id_token?: string;
    scope?: string;
  };
}

async function revokeToken(token: string) {
  const body = new URLSearchParams();
  body.set('token', token);
  await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  }).catch(() => null);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isAllowedEmail(email: string, allowedDomains: string[]) {
  const at = email.lastIndexOf('@');
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return allowedDomains.includes(domain);
}

async function upsertUser(providerUserId: string, name: string, email: string) {
  const db = await getAuthDb();
  const now = new Date().toISOString();
  const existing = db.data!.users.find((u) => u.provider === 'google' && u.providerUserId === providerUserId);
  if (existing) {
    existing.name = name;
    existing.email = email;
    existing.lastLoginAt = now;
    await db.write();
    return existing;
  }
  const user = {
    id: randomId(16),
    provider: 'google' as const,
    providerUserId,
    name,
    email,
    createdAt: now,
    lastLoginAt: now
  };
  db.data!.users.push(user);
  await db.write();
  return user;
}

export function registerGoogleAuth(app: Express) {
  app.get('/auth/google', async (req, res) => {
    const cfg = getAuthConfig();
    const returnTo = sanitizeReturnTo(req.query['returnTo']);
    const remember = req.query['remember'] === '1';
    const ip = getRequestIp(req);
    const userAgent = req.headers['user-agent'];

    if (isLocked(ip)) {
      await recordAudit({
        event: 'auth.google.start',
        ip,
        userAgent,
        ok: false,
        reason: 'locked'
      });
      res.status(429).send('Too Many Requests');
      return;
    }

    if (rateLimit(ip)) {
      await recordAudit({
        event: 'auth.google.start',
        ip,
        userAgent,
        ok: false,
        reason: 'rate_limited'
      });
      res.status(429).send('Too Many Requests');
      return;
    }

    pruneOAuthTxns();

    const state = randomId(24);
    const nonce = randomId(24);
    const codeVerifier = randomId(48);
    const codeChallenge = sha256Base64Url(codeVerifier);

    oauthTxns.set(state, {
      createdAt: Date.now(),
      codeVerifier,
      nonce,
      returnTo,
      remember,
      ip,
      userAgent
    });

    const origin = getOrigin(req);
    const redirectUri = `${origin}/auth/google/callback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', cfg.googleClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('include_granted_scopes', 'true');

    await recordAudit({
      event: 'auth.google.start',
      ip,
      userAgent,
      ok: true,
      metadata: { returnTo }
    });

    res.redirect(authUrl.toString());
  });

  app.get('/auth/google/callback', async (req, res) => {
    const cfg = getAuthConfig();
    const ip = getRequestIp(req);
    const userAgent = req.headers['user-agent'];

    if (isLocked(ip)) {
      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: false,
        reason: 'locked'
      });
      res.status(429).send('Too Many Requests');
      return;
    }

    if (rateLimit(ip)) {
      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: false,
        reason: 'rate_limited'
      });
      res.status(429).send('Too Many Requests');
      return;
    }

    const error = typeof req.query['error'] === 'string' ? req.query['error'] : undefined;
    const state = typeof req.query['state'] === 'string' ? req.query['state'] : undefined;
    const code = typeof req.query['code'] === 'string' ? req.query['code'] : undefined;

    if (error) {
      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: false,
        reason: error
      });
      recordFailure(ip);
      res.redirect(`/login?authError=google&returnTo=${encodeURIComponent('/')}`);
      return;
    }

    if (!state || !code) {
      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: false,
        reason: 'missing_state_or_code'
      });
      recordFailure(ip);
      res.redirect(`/login?authError=google&returnTo=${encodeURIComponent('/')}`);
      return;
    }

    const txn = oauthTxns.get(state);
    oauthTxns.delete(state);
    if (!txn) {
      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: false,
        reason: 'invalid_state'
      });
      recordFailure(ip);
      res.redirect(`/login?authError=google&returnTo=${encodeURIComponent('/')}`);
      return;
    }

    if (Date.now() - txn.createdAt > OAUTH_MAX_AGE_MS) {
      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: false,
        reason: 'state_expired'
      });
      recordFailure(ip);
      res.redirect(`/login?authError=google&returnTo=${encodeURIComponent('/')}`);
      return;
    }

    if (txn.userAgent && userAgent && txn.userAgent !== userAgent) {
      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: false,
        reason: 'user_agent_mismatch'
      });
      recordFailure(ip);
      res.redirect(`/login?authError=google&returnTo=${encodeURIComponent('/')}`);
      return;
    }

    try {
      const tokens = await exchangeCodeForTokens(req, code, txn.codeVerifier);
      const idToken = tokens.id_token;
      if (!idToken) throw new Error('missing_id_token');

      const { payload } = await jwtVerify(idToken, jwks, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: cfg.googleClientId
      });

      const nonce = typeof payload['nonce'] === 'string' ? payload['nonce'] : '';
      if (!nonce || nonce !== txn.nonce) throw new Error('nonce_mismatch');

      const sub = typeof payload['sub'] === 'string' ? payload['sub'] : '';
      const name = typeof payload['name'] === 'string' ? payload['name'] : '';
      const email = typeof payload['email'] === 'string' ? normalizeEmail(payload['email']) : '';
      const emailVerified = payload['email_verified'] === true;

      if (!sub || !email || !name) throw new Error('missing_profile');
      if (!emailVerified) throw new Error('email_not_verified');
      if (!isAllowedEmail(email, cfg.allowedEmailDomains)) throw new Error('email_domain_not_allowed');

      const user = await upsertUser(sub, name, email);
      const accessTokenExpiresAt =
        typeof tokens.expires_in === 'number' && tokens.expires_in > 0
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : undefined;

      await createSession(req, res, user.id, txn.remember, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt
      });

      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: true,
        userId: user.id,
        email: user.email
      });

      clearFailures(ip);
      res.redirect(txn.returnTo || '/');
    } catch (e) {
      await recordAudit({
        event: 'auth.google.callback',
        ip,
        userAgent,
        ok: false,
        reason: e instanceof Error ? e.message : 'unknown'
      });
      recordFailure(ip);
      res.redirect(`/login?authError=google&returnTo=${encodeURIComponent(txn.returnTo || '/')}`);
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    const ip = getRequestIp(req);
    const userAgent = req.headers['user-agent'];
    try {
      const session = await getSession(req);
      if (!session) {
        res.status(401).json({ ok: false });
        return;
      }
      const db = await getAuthDb();
      const user = db.data!.users.find((u) => u.id === session.userId);
      if (!user) {
        await destroySession(res, session.id);
        res.status(401).json({ ok: false });
        return;
      }

      if (session.lastIp && ip && session.lastIp !== ip) {
        await recordAudit({
          event: 'auth.session.ip_changed',
          ip,
          userAgent,
          ok: false,
          userId: session.userId,
          reason: 'ip_changed',
          metadata: { previousIp: session.lastIp }
        });
      }

      session.lastIp = ip;
      session.lastUserAgent = userAgent;
      await db.write();

      res.json({
        ok: true,
        user: { id: user.id, name: user.name, email: user.email },
        csrfToken: session.csrfToken
      });
    } catch (e) {
      await recordAudit({
        event: 'auth.me',
        ip,
        userAgent,
        ok: false,
        reason: e instanceof Error ? e.message : 'unknown'
      });
      res.status(500).json({ ok: false });
    }
  });

  app.post('/auth/logout', async (req, res) => {
    const ip = getRequestIp(req);
    const userAgent = req.headers['user-agent'];
    try {
      const session = await getSession(req);
      if (!session) {
        res.status(204).end();
        return;
      }

      const csrf = req.headers['x-csrf-token'];
      if (typeof csrf !== 'string' || csrf !== session.csrfToken) {
        await recordAudit({
          event: 'auth.logout',
          ip,
          userAgent,
          ok: false,
          userId: session.userId,
          reason: 'csrf_mismatch'
        });
        res.status(403).json({ ok: false });
        return;
      }

      const cfg = getAuthConfig();
      const refreshToken = session.encryptedRefreshToken
        ? decryptString(session.encryptedRefreshToken, cfg.sessionSecret)
        : undefined;
      const accessToken = session.encryptedAccessToken
        ? decryptString(session.encryptedAccessToken, cfg.sessionSecret)
        : undefined;

      if (refreshToken) await revokeToken(refreshToken);
      else if (accessToken) await revokeToken(accessToken);

      await destroySession(res, session.id);
      await recordAudit({ event: 'auth.logout', ip, userAgent, ok: true, userId: session.userId });
      res.status(204).end();
    } catch (e) {
      await recordAudit({
        event: 'auth.logout',
        ip,
        userAgent,
        ok: false,
        reason: e instanceof Error ? e.message : 'unknown'
      });
      res.status(500).json({ ok: false });
    }
  });
}
