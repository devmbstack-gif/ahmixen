/**
 * Public contact channels (footer, WhatsApp float, emails).
 * Prefer NEXT_PUBLIC_* so client components can read them after build.
 * Server-only CONTACT_EMAIL / WHATSAPP_NUMBER also work for Node scripts/email.
 *
 * Set these on Vercel / .env.local — do not rely on legacy fallbacks long-term.
 */

const LEGACY_CONTACT_EMAIL = 'ahmadalihafiz@icloud.com';
const LEGACY_WHATSAPP_DIGITS = '923390212102';

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const v = (process.env[key] || '').trim();
    if (v) return v;
  }
  return '';
}

export function getContactEmail(): string {
  return (
    firstEnv('NEXT_PUBLIC_CONTACT_EMAIL', 'CONTACT_EMAIL') ||
    LEGACY_CONTACT_EMAIL
  );
}

/** Digits only (country code + number), suitable for wa.me links. */
export function getWhatsAppNumber(): string {
  const raw =
    firstEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', 'WHATSAPP_NUMBER') ||
    LEGACY_WHATSAPP_DIGITS;
  return raw.replace(/\D/g, '');
}
