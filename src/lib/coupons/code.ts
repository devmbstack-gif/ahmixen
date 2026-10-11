/** Always store and look up coupon codes as trimmed UPPERCASE. */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Random 8-character admin-friendly code (no ambiguous 0/O/1/I). */
export function generateCouponCode(length = 8): string {
  let out = '';
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
  }
  return out;
}

export const COUPON_CODE_REGEX = /^[A-Z0-9_-]{3,20}$/;
