import { localDateTimeToUtc } from '@/lib/sessions/datetime';

/** Start of local calendar day in PKT. */
export function parseCouponStart(localDate: string | null | undefined): Date | null {
  if (!localDate) return null;
  return localDateTimeToUtc(localDate, '00:00', 'Asia/Karachi');
}

/** End of local calendar day in PKT. */
export function parseCouponEnd(localDate: string | null | undefined): Date | null {
  if (!localDate) return null;
  return localDateTimeToUtc(localDate, '23:59', 'Asia/Karachi');
}

export function toLocalDateString(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function formatCouponDay(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    month: 'short',
    day: 'numeric',
  }).format(d);
}
