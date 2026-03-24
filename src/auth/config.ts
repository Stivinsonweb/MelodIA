export type AuthConfig = {
  googleClientId: string;
  googleClientSecret: string;
  appOrigin?: string;
  sessionSecret: string;
  allowedEmailDomains: string[];
  securityWebhookUrl?: string;
  sessionTtlDays: number;
};

export function getAuthConfig(): AuthConfig {
  const googleClientId = process.env['GOOGLE_CLIENT_ID']?.trim() || '';
  const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET']?.trim() || '';
  const sessionSecret = process.env['SESSION_SECRET']?.trim() || '';

  if (!googleClientId) throw new Error('Missing env GOOGLE_CLIENT_ID');
  if (!googleClientSecret) throw new Error('Missing env GOOGLE_CLIENT_SECRET');
  if (!sessionSecret) throw new Error('Missing env SESSION_SECRET');

  const domainsRaw = process.env['ALLOWED_GOOGLE_DOMAINS']?.trim();
  const allowedEmailDomains = domainsRaw
    ? domainsRaw
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean)
    : ['gmail.com', 'googlemail.com'];

  const sessionTtlDaysRaw = process.env['SESSION_TTL_DAYS']?.trim();
  const sessionTtlDays = sessionTtlDaysRaw ? Number(sessionTtlDaysRaw) : 30;

  return {
    googleClientId,
    googleClientSecret,
    appOrigin: process.env['APP_ORIGIN']?.trim(),
    sessionSecret,
    allowedEmailDomains,
    securityWebhookUrl: process.env['SECURITY_WEBHOOK_URL']?.trim(),
    sessionTtlDays: Number.isFinite(sessionTtlDays) && sessionTtlDays > 0 ? sessionTtlDays : 30
  };
}

