import type { Request, Response } from 'express';
import { getAuthDb } from './auth-db';
import { parseCookies, sanitizeReturnTo } from './http-utils';

const SID_COOKIE = 'melodia_sid';

export type AuthCheckResult =
  | { ok: true; sessionId: string; userId: string }
  | { ok: false };

export async function checkAuth(req: Request): Promise<AuthCheckResult> {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[SID_COOKIE];
  if (!sid) return { ok: false };

  const db = await getAuthDb();
  const session = db.data!.sessions.find((s) => s.id === sid);
  if (!session) return { ok: false };
  if (Date.parse(session.expiresAt) <= Date.now()) return { ok: false };
  return { ok: true, sessionId: session.id, userId: session.userId };
}

function isHtmlRequest(req: Request) {
  if (req.method !== 'GET') return false;
  const accept = req.headers['accept'];
  if (typeof accept !== 'string') return false;
  return accept.includes('text/html');
}

function isPublicPath(pathname: string) {
  if (pathname === '/login') return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname === '/api/auth/me') return true;
  if (pathname === '/auth/logout') return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname.startsWith('/assets/')) return true;
  return false;
}

export function buildLoginRedirect(req: Request) {
  const returnTo = sanitizeReturnTo(`${req.path}${req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`);
  const qp = new URLSearchParams();
  qp.set('returnTo', returnTo);
  return `/login?${qp.toString()}`;
}

export function requireAuthForHtml() {
  return async (req: Request, res: Response, next: () => void) => {
    if (!isHtmlRequest(req) || isPublicPath(req.path)) {
      next();
      return;
    }

    const auth = await checkAuth(req);
    if (!auth.ok) {
      res.redirect(buildLoginRedirect(req));
      return;
    }

    next();
  };
}

export function requireAuthForApi() {
  return async (req: Request, res: Response, next: () => void) => {
    if (req.path === '/auth/me') {
      next();
      return;
    }
    const auth = await checkAuth(req);
    if (!auth.ok) {
      res.status(401).json({ ok: false });
      return;
    }
    next();
  };
}

