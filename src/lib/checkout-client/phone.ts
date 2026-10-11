/** Client hint only — mirrors server normalizePhone. Server remains authority. */

export const PHONE_HINT =
  'With country code, e.g. +92 300 1234567';

export function formatPhoneHint(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  try {
    let s = raw.replace(/[^\d+]/g, '');
    if (s.startsWith('00')) s = `+${s.slice(2)}`;
    if (s.startsWith('+')) {
      const digits = s.slice(1).replace(/\D/g, '');
      if (digits.length < 9 || digits.length > 15) return null;
      return `+${digits}`;
    }
    const digits = s.replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('0') && digits.length >= 10) {
      const rest = digits.slice(1);
      if (rest.length < 9 || rest.length > 14) return null;
      return `+92${rest}`;
    }
    if (digits.startsWith('92') && digits.length === 12) return `+${digits}`;
    if (digits.length >= 9 && digits.length <= 15) return `+${digits}`;
    return null;
  } catch {
    return null;
  }
}
