import { localDateTimeToUtc } from '@/lib/sessions/datetime';

/** Start of local calendar day in PKT. */
export function parsePktDayStart(
  localDate: string | null | undefined
): Date | null {
  if (!localDate) return null;
  return localDateTimeToUtc(localDate, '00:00', 'Asia/Karachi');
}

/** End of local calendar day in PKT. */
export function parsePktDayEnd(
  localDate: string | null | undefined
): Date | null {
  if (!localDate) return null;
  return localDateTimeToUtc(localDate, '23:59', 'Asia/Karachi');
}

/** @deprecated Use parsePktDayStart */
export const parseCouponStart = parsePktDayStart;
/** @deprecated Use parsePktDayEnd */
export const parseCouponEnd = parsePktDayEnd;

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
