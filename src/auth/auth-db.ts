import { join } from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

export type AuthUserRecord = {
  id: string;
  provider: 'google';
  providerUserId: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string;
};

export type AuthSessionRecord = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  csrfToken: string;
  encryptedAccessToken?: string;
  encryptedRefreshToken?: string;
  accessTokenExpiresAt?: string;
  lastIp?: string;
  lastUserAgent?: string;
};

export type AuthAuditRecord = {
  id: string;
  at: string;
  event: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  ok: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export type AuthDbSchema = {
  users: AuthUserRecord[];
  sessions: AuthSessionRecord[];
  audit: AuthAuditRecord[];
};

let db: Low<AuthDbSchema> | null = null;

async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getAuthDb() {
  if (db) return db;

  const dataDir = join(process.cwd(), 'data');
  const filePath = join(dataDir, 'auth-db.json');
  await mkdir(dataDir, { recursive: true });

  const adapter = new JSONFile<AuthDbSchema>(filePath);
  db = new Low<AuthDbSchema>(adapter, { users: [], sessions: [], audit: [] });

  if (await fileExists(filePath)) {
    await db.read();
    db.data ||= { users: [], sessions: [], audit: [] };
  } else {
    await db.write();
  }

  return db;
}

