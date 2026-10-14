export type EmailMode = 'log' | 'smtp';

export function getEmailMode(): EmailMode {
  const raw = (process.env.EMAIL_MODE || '').trim().toLowerCase();
  if (raw === 'smtp' || raw === 'log') return raw;
  return process.env.NODE_ENV === 'production' ? 'smtp' : 'log';
}

export function getSiteUrl(): string {
  return (process.env.SITE_URL || '').trim().replace(/\/$/, '');
}

export function getEmailFrom(): string {
  return (process.env.EMAIL_FROM || '').trim();
}

export function getEmailReplyTo(): string {
  return (process.env.EMAIL_REPLY_TO || '').trim();
}

export function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const portRaw = (process.env.SMTP_PORT || '').trim();
  const port = portRaw ? Number(portRaw) : NaN;
  const secure =
    String(process.env.SMTP_SECURE || '')
      .trim()
      .toLowerCase() === 'true';
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  return { host, port, secure, user, pass };
}

export function getEmailAllowlist(): string[] {
  const raw = (process.env.EMAIL_ALLOWLIST || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getEmailDailyLimit(): number {
  const n = Number(process.env.EMAIL_DAILY_LIMIT || '400');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 400;
}

/** Parse address from "Name <addr@host>" or bare email. */
export function parseEmailAddress(from: string): string {
  const m = from.match(/<([^>]+)>/);
  if (m?.[1]) return m[1].trim().toLowerCase();
  return from.trim().toLowerCase();
}

export function isSmtpConfigured(): boolean {
  const { host, port, user, pass } = getSmtpConfig();
  const from = getEmailFrom();
  const site = getSiteUrl();
  return Boolean(
    host &&
      Number.isFinite(port) &&
      port > 0 &&
      user &&
      pass &&
      from &&
      site
  );
}

export function fromAddressMismatch(): boolean {
  const from = parseEmailAddress(getEmailFrom());
  const user = getSmtpConfig().user.toLowerCase();
  if (!from || !user) return false;
  return from !== user;
}

export function maskEmail(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.indexOf('@');
  if (at <= 0) return '***';
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
