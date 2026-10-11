import { WORKSHOP_CONFIG } from '@/data/workshopData';
import { formatInTimezone, sessionTimezone } from './datetime';

/** Safe fields only — never expose admin/private session data. */
export type PublicSession = {
  startsAt: string;
  durationMinutes: number;
  timezone: string;
  seatsAvailable: number;
  showLimitedSeatsBadge: boolean;
};

export type PublicSessionDisplay = PublicSession & {
  dateShort: string;
  dateLong: string;
  timeLabel: string;
  durationLabel: string;
};

function parseDurationMinutesFromConfig(): number {
  const label = WORKSHOP_CONFIG.durationLabel || '';
  const match = label.match(/([\d.]+)/);
  if (match) {
    const hours = Number(match[1]);
    if (!Number.isNaN(hours) && hours > 0) return Math.round(hours * 60);
  }
  return 150;
}

/** Public duration wording: "2.5 Hours", "1 Hour", "2 Hours 19 Min". */
export function formatPublicDurationLabel(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m % 60 === 0) {
    const h = m / 60;
    return h === 1 ? '1 Hour' : `${h} Hours`;
  }
  if (m % 60 === 30) {
    const h = Math.floor(m / 60);
    if (h === 0) return '30 Min';
    return `${h}.5 Hours`;
  }
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h === 0) return `${mins} Min`;
  const hourPart = h === 1 ? '1 Hour' : `${h} Hours`;
  return `${hourPart} ${mins} Min`;
}

export function fallbackPublicSession(): PublicSession {
  return {
    startsAt: WORKSHOP_CONFIG.startsAt,
    durationMinutes: parseDurationMinutesFromConfig(),
    timezone: 'Asia/Karachi',
    seatsAvailable: WORKSHOP_CONFIG.seatsRemaining,
    showLimitedSeatsBadge: true,
  };
}

export function toPublicSessionDisplay(session: PublicSession): PublicSessionDisplay {
  const tz = sessionTimezone(session.timezone);
  const startsAt = new Date(session.startsAt);
  const valid = !Number.isNaN(startsAt.getTime());

  const dateShort = valid
    ? formatInTimezone(startsAt, tz, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : WORKSHOP_CONFIG.dateShort;

  const dateLong = valid
    ? formatInTimezone(startsAt, tz, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : WORKSHOP_CONFIG.date;

  const timeCore = valid
    ? formatInTimezone(startsAt, tz, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : WORKSHOP_CONFIG.time.replace(/\s*PKT\s*$/i, '').trim();

  return {
    ...session,
    dateShort,
    dateLong,
    timeLabel: `${timeCore} PKT`,
    durationLabel: formatPublicDurationLabel(session.durationMinutes),
  };
}
