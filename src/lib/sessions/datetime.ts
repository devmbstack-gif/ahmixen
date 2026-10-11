const DEFAULT_TZ = 'Asia/Karachi';

/** Pakistan Standard Time is UTC+5 (no DST). */
const TZ_OFFSET: Record<string, string> = {
  'Asia/Karachi': '+05:00',
};

export function sessionTimezone(tz?: string | null): string {
  return tz && tz.trim() ? tz.trim() : DEFAULT_TZ;
}

/** Convert local date (YYYY-MM-DD) + time (HH:mm) in session TZ → UTC Date. */
export function localDateTimeToUtc(
  date: string,
  time: string,
  timezone: string = DEFAULT_TZ
): Date {
  const offset = TZ_OFFSET[timezone] ?? '+05:00';
  const iso = `${date}T${time}:00${offset}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date or time');
  }
  return d;
}

export function formatInTimezone(
  date: Date,
  timezone: string = DEFAULT_TZ,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, ...options }).format(date);
}

export function splitUtcToLocalParts(
  date: Date,
  timezone: string = DEFAULT_TZ
): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  let hour = get('hour');
  if (hour === '24') hour = '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour.padStart(2, '0')}:${get('minute').padStart(2, '0')}`,
  };
}

export function formatSessionDisplay(startsAt: Date, timezone: string = DEFAULT_TZ) {
  const dateLabel = formatInTimezone(startsAt, timezone, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = formatInTimezone(startsAt, timezone, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return {
    dateLabel,
    timeLabel: `${timeLabel} PKT`,
    combined: `${dateLabel} · ${timeLabel} PKT`,
  };
}

export function durationLabelFromMinutes(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} Hours`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}.${String(Math.round((m / 60) * 10))} Hours`.replace('.5 Hours', '.5 Hours');
}
