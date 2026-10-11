import { connectToDatabase } from '@/lib/db';
import { Session } from '@/models/Session';
import { getSeatSummary } from './seats';
import { sessionTimezone } from './datetime';
import {
  fallbackPublicSession,
  toPublicSessionDisplay,
  type PublicSessionDisplay,
} from './publicShared';

export type { PublicSession, PublicSessionDisplay } from './publicShared';
export {
  formatPublicDurationLabel,
  fallbackPublicSession,
  toPublicSessionDisplay,
} from './publicShared';

/**
 * Landing-active + open session from DB, safe fields only.
 * Falls back to static WORKSHOP_CONFIG if missing or DB fails.
 */
export async function getPublicSession(): Promise<PublicSessionDisplay> {
  try {
    await connectToDatabase();
    const doc = await Session.findOne({
      isLandingActive: true,
      status: 'open',
    }).lean();

    if (!doc) {
      return toPublicSessionDisplay(fallbackPublicSession());
    }

    const seats = getSeatSummary({
      seatsTotal: doc.seatsTotal,
      seatsConfirmed: doc.seatsConfirmed ?? 0,
      holds: doc.holds ?? [],
    });

    return toPublicSessionDisplay({
      startsAt: new Date(doc.startsAt).toISOString(),
      durationMinutes: doc.durationMinutes,
      timezone: sessionTimezone(doc.timezone),
      seatsAvailable: seats.available,
      showLimitedSeatsBadge: Boolean(doc.showLimitedSeatsBadge),
    });
  } catch (err) {
    console.error(
      '[getPublicSession]',
      err instanceof Error ? err.message : 'unreachable'
    );
    return toPublicSessionDisplay(fallbackPublicSession());
  }
}
