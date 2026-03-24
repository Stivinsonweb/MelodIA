import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getAuthDb, type AuthAuditRecord } from './auth-db';
import { randomId } from './crypto';
import { getAuthConfig } from './config';

type AuditInput = Omit<AuthAuditRecord, 'id' | 'at'> & { at?: string };

export async function recordAudit(input: AuditInput) {
  const at = input.at ?? new Date().toISOString();
  const record: AuthAuditRecord = { id: randomId(16), at, ...input };

  const db = await getAuthDb();
  db.data!.audit.push(record);
  if (db.data!.audit.length > 5000) db.data!.audit.splice(0, db.data!.audit.length - 5000);
  await db.write();

  const dataDir = join(process.cwd(), 'data');
  await mkdir(dataDir, { recursive: true });
  await appendFile(join(dataDir, 'auth-audit.log'), `${JSON.stringify(record)}\n`, 'utf8');

  if (!record.ok) {
    await maybeNotifySuspicious(record);
  }

  return record;
}

async function maybeNotifySuspicious(record: AuthAuditRecord) {
  const cfg = getAuthConfig();
  if (!cfg.securityWebhookUrl) return;

  const ip = record.ip;
  if (!ip) return;

  const windowMs = 10 * 60 * 1000;
  const threshold = 5;
  const cutoff = Date.now() - windowMs;

  const db = await getAuthDb();
  const recentFails = db.data!.audit.filter((a) => {
    if (a.ok) return false;
    if (!a.ip || a.ip !== ip) return false;
    const t = Date.parse(a.at);
    return Number.isFinite(t) && t >= cutoff;
  });

  if (recentFails.length < threshold) return;

  const payload = {
    type: 'suspicious_activity',
    at: new Date().toISOString(),
    ip,
    failCount: recentFails.length,
    windowSeconds: Math.floor(windowMs / 1000),
    lastEvent: record.event,
    reason: record.reason,
    userId: record.userId,
    email: record.email
  };

  try {
    await fetch(cfg.securityWebhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    return;
  }
}

