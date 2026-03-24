import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import express from 'express';
import http from 'node:http';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireAuthForApi, requireAuthForHtml } from './require-auth';

function start(app: express.Express) {
  return new Promise<{ server: http.Server; baseUrl: string }>((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function stop(server: http.Server) {
  return new Promise<void>((resolve) => server.close(() => resolve()));
}

describe('requireAuth middleware', () => {
  const originalCwd = process.cwd();
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'melodia-auth-'));
    process.chdir(cwd);
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('redirects HTML requests to /login when unauthenticated', async () => {
    const app = express();
    app.use(requireAuthForHtml());
    app.get('/', (_req, res) => res.status(200).send('OK'));

    const { server, baseUrl } = await start(app);
    try {
      const resp = await fetch(`${baseUrl}/`, {
        redirect: 'manual',
        headers: { accept: 'text/html' }
      });
      expect(resp.status).toBe(302);
      expect(resp.headers.get('location')?.startsWith('/login?')).toBe(true);
    } finally {
      await stop(server);
    }
  });

  it('allows HTML requests when a valid session exists', async () => {
    const sid = 'testsid';
    const now = Date.now();
    const db = {
      users: [
        {
          id: 'u1',
          provider: 'google',
          providerUserId: 'g1',
          name: 'Test User',
          email: 'test@gmail.com',
          createdAt: new Date(now).toISOString(),
          lastLoginAt: new Date(now).toISOString()
        }
      ],
      sessions: [
        {
          id: sid,
          userId: 'u1',
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(now + 60_000).toISOString(),
          csrfToken: 'csrf'
        }
      ],
      audit: []
    };
    await mkdir(join(cwd, 'data'), { recursive: true });
    await writeFile(join(cwd, 'data', 'auth-db.json'), JSON.stringify(db), { encoding: 'utf8' });

    const app = express();
    app.use(requireAuthForHtml());
    app.get('/', (_req, res) => res.status(200).send('OK'));

    const { server, baseUrl } = await start(app);
    try {
      const resp = await fetch(`${baseUrl}/`, {
        redirect: 'manual',
        headers: { accept: 'text/html', cookie: `melodia_sid=${sid}` }
      });
      expect(resp.status).toBe(200);
      expect(await resp.text()).toBe('OK');
    } finally {
      await stop(server);
    }
  });

  it('blocks /api/* when unauthenticated', async () => {
    const app = express();
    app.use('/api', requireAuthForApi());
    app.get('/api/protected', (_req, res) => res.json({ ok: true }));

    const { server, baseUrl } = await start(app);
    try {
      const resp = await fetch(`${baseUrl}/api/protected`, { redirect: 'manual' });
      expect(resp.status).toBe(401);
    } finally {
      await stop(server);
    }
  });
});
