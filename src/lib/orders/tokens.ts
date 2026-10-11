import { randomBytes } from 'node:crypto';
import { Counter } from '@/models/Counter';

/** Human-readable order number, e.g. AX-000123. */
export async function nextOrderNumber(
  session?: import('mongoose').ClientSession | null
): Promise<string> {
  const doc = await Counter.findByIdAndUpdate(
    'orders',
    { $inc: { seq: 1 } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      ...(session ? { session } : {}),
    }
  );
  const seq = doc?.seq ?? 1;
  return `AX-${String(seq).padStart(6, '0')}`;
}

/** URL-safe public token (≥32 chars) for a future customer status link. */
export function createPublicToken(): string {
  return randomBytes(24).toString('base64url');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Digits only for WhatsApp / wa.me links. */
export function digitsOnlyPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
