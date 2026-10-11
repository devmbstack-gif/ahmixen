import type { SessionDocument } from '@/models/Session';
import { getSeatSummary } from './seats';
import { formatSessionDisplay, sessionTimezone, splitUtcToLocalParts } from './datetime';

export function serializeAdminSession(doc: SessionDocument, now = new Date()) {
  const timezone = sessionTimezone(doc.timezone);
  const seats = getSeatSummary(doc, now);
  const display = formatSessionDisplay(doc.startsAt, timezone);
  const local = splitUtcToLocalParts(doc.startsAt, timezone);

  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description ?? '',
    startsAt: doc.startsAt.toISOString(),
    localDate: local.date,
    localTime: local.time,
    durationMinutes: doc.durationMinutes,
    timezone,
    status: doc.status,
    seatsTotal: doc.seatsTotal,
    seatsConfirmed: doc.seatsConfirmed,
    holdHours: doc.holdHours,
    showLimitedSeatsBadge: doc.showLimitedSeatsBadge,
    meetingLink: doc.meetingLink ?? '',
    recordingUrl: doc.recordingUrl ?? '',
    isLandingActive: Boolean(doc.isLandingActive),
    version: doc.version ?? 1,
    seats,
    display,
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : null,
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : null,
  };
}

export type AdminSessionDTO = ReturnType<typeof serializeAdminSession>;
