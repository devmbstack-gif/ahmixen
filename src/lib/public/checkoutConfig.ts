import { connectToDatabase } from '@/lib/db';
import { Session } from '@/models/Session';
import { Plan } from '@/models/Plan';
import { Coupon } from '@/models/Coupon';
import { getSeatSummary } from '@/lib/sessions/seats';
import { sessionTimezone } from '@/lib/sessions/datetime';
import { savingsPercent } from '@/lib/plans/money';
import { discountLabelFor } from '@/lib/coupons/serialize';
import { localDateTimeToUtc } from '@/lib/sessions/datetime';
import { getCheckoutHoldMinutes } from '@/lib/orders/holdMinutes';
import {
  isPlanPublicEligible,
  selectLandingPlan,
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
  landingPlanId: string | null;
  session: {
    startsAt: string;
    durationMinutes: number;
    timezone: string;
    seatsAvailable: number;
    soldOut: boolean;
    showLimitedSeatsBadge: boolean;
  } | null;
  plans: PublicCheckoutPlan[];
  popupCoupon: { label: string } | null;
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
      session: null,
      plans: [],
      popupCoupon: null,
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

  const ordered: PlanLean[] = [];
  if (landing) {
    ordered.push(landing);
  }
  for (const p of eligible) {
    if (landing && String(p._id) === String(landing._id)) continue;
    ordered.push(p);
  }

  const plans = ordered.map(mapPlan);

  const popup = await Coupon.findOne({
    isPopupCoupon: true,
    status: 'active',
  }).lean();

  let popupCoupon: { label: string } | null = null;
  if (popup) {
    const startsOk =
      !popup.startsAt || new Date(popup.startsAt).getTime() <= now.getTime();
    const endsOk =
      !popup.endsAt || new Date(popup.endsAt).getTime() >= now.getTime();
    if (startsOk && endsOk) {
      popupCoupon = {
        label: discountLabelFor(
          popup.discountType as 'percent' | 'fixed',
          Number(popup.discountValue),
          popup.currency || 'PKR'
        ),
      };
    }
  }

  return {
    reservationsOpen: true,
    holdMinutes,
    landingPlanId,
    session: {
      startsAt: new Date(sessionDoc.startsAt).toISOString(),
      durationMinutes: sessionDoc.durationMinutes,
      timezone: sessionTimezone(sessionDoc.timezone),
      seatsAvailable: seats.available,
      soldOut: seats.available <= 0,
      showLimitedSeatsBadge: Boolean(sessionDoc.showLimitedSeatsBadge),
    },
    plans,
    popupCoupon,
  };
}

/** End-of-day PKT helper for plan validity checks elsewhere if needed. */
export function endOfDayPkt(localDate: string): Date {
  return localDateTimeToUtc(localDate, '23:59', 'Asia/Karachi');
}
