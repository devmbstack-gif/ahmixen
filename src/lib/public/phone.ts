/**
 * Normalize WhatsApp phone numbers.
 * Keeps digits and a leading "+". Failure message is fixed for the UI.
 */
export const PHONE_ERROR =
  'Enter your WhatsApp number with country code, for example +92 300 1234567';

export function normalizePhone(input: string): string {
  const raw = (input || '').trim();
  if (!raw) throw new Error(PHONE_ERROR);

  let s = raw.replace(/[^\d+]/g, '');
  if (s.startsWith('00')) {
    s = `+${s.slice(2)}`;
  }

  if (s.startsWith('+')) {
    const digits = s.slice(1).replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) throw new Error(PHONE_ERROR);
    return `+${digits}`;
  }

  const digits = s.replace(/\D/g, '');
  if (!digits) throw new Error(PHONE_ERROR);

  if (digits.startsWith('0') && digits.length >= 10) {
    const rest = digits.slice(1);
    if (rest.length < 9 || rest.length > 14) throw new Error(PHONE_ERROR);
    return `+92${rest}`;
  }

  if (digits.startsWith('92') && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length >= 9 && digits.length <= 15) {
    return `+${digits}`;
  }

  throw new Error(PHONE_ERROR);
}
