import { localDateTimeToUtc } from '@/lib/sessions/datetime';

/** validUntil YYYY-MM-DD end of day PKT must be in the future when plan is active. */
export function assertActiveValidUntil(
  status: string,
  validUntilLocal: string | null | undefined
): string | null {
  if (status !== 'active') return null;
  if (!validUntilLocal) return null;
  try {
    const end = localDateTimeToUtc(validUntilLocal, '23:59', 'Asia/Karachi');
    if (end.getTime() <= Date.now()) {
      return 'Offer end date must be in the future for an active plan';
    }
  } catch {
    return 'Enter a valid offer end date';
  }
  return null;
}

export function parseValidUntil(
  validUntilLocal: string | null | undefined
): Date | null {
  if (!validUntilLocal) return null;
  return localDateTimeToUtc(validUntilLocal, '23:59', 'Asia/Karachi');
}
