import crypto from 'node:crypto';

export function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

export function randomId(bytes = 32) {
  return base64UrlEncode(crypto.randomBytes(bytes));
}

export function sha256Base64Url(input: string) {
  const hash = crypto.createHash('sha256').update(input).digest();
  return base64UrlEncode(hash);
}

function deriveKey(secret: string) {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

export function encryptString(plaintext: string, secret: string) {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return base64UrlEncode(Buffer.concat([iv, tag, ciphertext]));
}

export function decryptString(payload: string, secret: string) {
  const raw = base64UrlDecode(payload);
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

