import type { Request, Response } from 'express';

export function getRequestIp(req: Request) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0]?.trim();
  }
  return req.ip;
}

export function parseCookies(cookieHeader: string | undefined) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
  maxAgeSeconds?: number;
};

export function setCookie(res: Response, name: string, value: string, options: CookieOptions) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? '/'}`);
  if (options.maxAgeSeconds !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAgeSeconds)}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  const headerValue = parts.join('; ');

  const prev = res.getHeader('Set-Cookie');
  if (typeof prev === 'string') {
    res.setHeader('Set-Cookie', [prev, headerValue]);
  } else if (Array.isArray(prev)) {
    res.setHeader('Set-Cookie', [...prev, headerValue]);
  } else {
    res.setHeader('Set-Cookie', headerValue);
  }
}

export function clearCookie(res: Response, name: string) {
  setCookie(res, name, '', { path: '/', maxAgeSeconds: 0 });
}

export function sanitizeReturnTo(input: unknown) {
  if (typeof input !== 'string') return '/';
  const v = input.trim();
  if (!v.startsWith('/')) return '/';
  if (v.startsWith('//')) return '/';
  if (v.includes('://')) return '/';
  if (v.includes('\\')) return '/';
  return v;
}

