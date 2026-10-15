import { connectToDatabase } from '@/lib/db';
import { Session } from '@/models/Session';
import { Plan } from '@/models/Plan';
import { getSeatSummary } from '@/lib/sessions/seats';
import { sessionTimezone } from '@/lib/sessions/datetime';
import { savingsPercent } from '@/lib/plans/money';
import { localDateTimeToUtc } from '@/lib/sessions/datetime';
import { getCheckoutHoldMinutes } from '@/lib/orders/holdMinutes';
import {
  isPlanPublicEligible,
  selectLandingPlan,
  selectWorkshopPlan,
  type PlanLean,
} from '@/lib/plans/landing';
import { ensurePlanIndexes } from '@/lib/plans/syncIndexes';

/** Flip to true when installment checkout is ready. */
export const ALLOW_INSTALLMENTS = false;

export type PublicCheckoutPlan = {
  id: string;
  name: string;
  shortDescription: string;
  type: 'one_time' | 'installment';
  currency: 'PKR' | 'USD';
  price: number;
  originalPrice: number | null;
  savingsPercent: number | null;
  features: string[];
};

export type PublicCheckoutConfig = {
  reservationsOpen: boolean;
  holdMinutes: number;
  /** Mentorship ENROLL / fees card (isLandingPlan). */
  landingPlanId: string | null;
  mentorshipPlanId: string | null;
  /** Workshop Nav / Hero / Programs → /reserve (isWorkshopPlan). */
  workshopPlanId: string | null;
  session: {
    startsAt: string;
    durationMinutes: number;
    timezone: string;
    seatsAvailable: number;
    soldOut: boolean;
    showLimitedSeatsBadge: boolean;
  } | null;
  plans: PublicCheckoutPlan[];
};

function mapPlan(p: PlanLean): PublicCheckoutPlan {
  return {
    id: String(p._id),
    name: p.name,
    shortDescription: String(p.shortDescription || ''),
    type: p.type as 'one_time' | 'installment',
    currency: p.currency as 'PKR' | 'USD',
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    savingsPercent: savingsPercent(p.price, p.originalPrice ?? null),
    features: Array.isArray(p.features) ? p.features.map(String) : [],
  };
}

export async function getPublicCheckoutConfig(): Promise<PublicCheckoutConfig> {
  await connectToDatabase();
  await ensurePlanIndexes();
  const now = new Date();
  const holdMinutes = getCheckoutHoldMinutes();

  const sessionDoc = await Session.findOne({
    isLandingActive: true,
    status: 'open',
  }).lean();

  if (!sessionDoc) {
    return {
      reservationsOpen: false,
      holdMinutes,
      landingPlanId: null,
      mentorshipPlanId: null,
      workshopPlanId: null,
      session: null,
      plans: [],
    };
  }

  const seats = getSeatSummary({
    seatsTotal: sessionDoc.seatsTotal,
    seatsConfirmed: sessionDoc.seatsConfirmed ?? 0,
    holds: sessionDoc.holds ?? [],
  });
  const sessionId = String(sessionDoc._id);

  const planFilter: Record<string, unknown> = {
    status: 'active',
    $or: [
      { sessionId: '' },
      { sessionId },
      { sessionId: { $exists: false } },
      { isLandingPlan: true },
    ],
  };
  if (!ALLOW_INSTALLMENTS) {
    planFilter.type = 'one_time';
  }

  const planDocs = (await Plan.find(planFilter)
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean()) as unknown as PlanLean[];

  const eligible = planDocs.filter((p) =>
    isPlanPublicEligible(p, sessionId, now)
  );

  const landing = await selectLandingPlan(sessionId, now);
  const landingPlanId = landing ? String(landing._id) : null;
  const mentorshipPlanId = landingPlanId;
  const workshop = await selectWorkshopPlan(sessionId, mentorshipPlanId, now);
  const workshopPlanId = workshop ? String(workshop._id) : null;

  const ordered: PlanLean[] = [];
  const seen = new Set<string>();
  for (const p of [workshop, landing, ...eligible]) {
    if (!p) continue;
    const id = String(p._id);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(p);
  }

  const plans = ordered.map(mapPlan);

  return {
    reservationsOpen: true,
    holdMinutes,
    landingPlanId,
    mentorshipPlanId,
    workshopPlanId,
    session: {
      startsAt: new Date(sessionDoc.startsAt).toISOString(),
      durationMinutes: sessionDoc.durationMinutes,
      timezone: sessionTimezone(sessionDoc.timezone),
      seatsAvailable: seats.available,
      soldOut: seats.available <= 0,
      showLimitedSeatsBadge: Boolean(sessionDoc.showLimitedSeatsBadge),
    },
    plans,
  };
}

/** End-of-day PKT helper for plan validity checks elsewhere if needed. */
export function endOfDayPkt(localDate: string): Date {
  return localDateTimeToUtc(localDate, '23:59', 'Asia/Karachi');
}
