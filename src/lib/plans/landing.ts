import { Plan } from '@/models/Plan';

export type PlanLean = {
  _id: { toString(): string };
  name: string;
  shortDescription?: string | null;
  type: string;
  currency: string;
  price: number;
  originalPrice?: number | null;
  features?: string[] | null;
  sessionId?: string | null;
  validUntil?: Date | null;
  status: string;
  isLandingPlan?: boolean | null;
  sortOrder?: number | null;
  createdAt?: Date | null;
};

function planStillValid(
  validUntil: Date | null | undefined,
  now: Date
): boolean {
  if (!validUntil) return true;
  const t =
    validUntil instanceof Date
      ? validUntil.getTime()
      : new Date(validUntil).getTime();
  if (Number.isNaN(t)) return true;
  return t >= now.getTime();
}

/**
 * Eligible for public “the plan” selection for a given landing session (or any).
 * Landing-flagged plans skip the session binding check so a stale sessionId
 * cannot hide the chosen landing plan from the site.
 */
export function isPlanPublicEligible(
  plan: PlanLean,
  activeSessionId: string | null,
  now: Date
): boolean {
  if (plan.status !== 'active') return false;
  if (plan.type !== 'one_time') return false;
  if (!planStillValid(plan.validUntil ?? null, now)) return false;
  if (plan.isLandingPlan) return true;
  const sid = (plan.sessionId || '').trim();
  if (activeSessionId && sid && sid !== activeSessionId) return false;
  return true;
}

/**
 * Landing plan when flagged + eligible; else cheapest active one-time eligible;
 * else null.
 */
export async function selectLandingPlan(
  activeSessionId: string | null,
  now = new Date()
): Promise<PlanLean | null> {
  // Prefer the explicit landing flag even if its sessionId is stale/mismatched.
  const flagged = (await Plan.findOne({
    isLandingPlan: true,
    status: 'active',
    type: 'one_time',
  }).lean()) as unknown as PlanLean | null;

  if (
    flagged &&
    isPlanPublicEligible(flagged, activeSessionId, now)
  ) {
    return flagged;
  }

  const filter: Record<string, unknown> = {
    status: 'active',
    type: 'one_time',
  };
  if (activeSessionId) {
    filter.$or = [
      { sessionId: '' },
      { sessionId: activeSessionId },
      { sessionId: { $exists: false } },
    ];
  }

  const candidates = (await Plan.find(filter)
    .sort({ price: 1, sortOrder: 1, createdAt: 1 })
    .lean()) as unknown as PlanLean[];

  const eligible = candidates.filter((p) =>
    isPlanPublicEligible(p, activeSessionId, now)
  );
  return eligible[0] ?? null;
}

export type LandingSiteIssue =
  | 'not_active'
  | 'not_one_time'
  | 'expired'
  | 'wrong_session'
  | null;

export function landingPlanSiteIssue(
  plan: {
    status: string;
    type: string;
    validUntil?: Date | string | null;
    sessionId?: string | null;
    isLandingPlan?: boolean | null;
  },
  _activeLandingSessionId: string | null,
  now = new Date()
): LandingSiteIssue {
  if (!plan.isLandingPlan) return null;
  if (plan.status !== 'active') return 'not_active';
  if (plan.type !== 'one_time') return 'not_one_time';
  const vu = plan.validUntil
    ? plan.validUntil instanceof Date
      ? plan.validUntil
      : new Date(plan.validUntil)
    : null;
  if (vu && !Number.isNaN(vu.getTime()) && vu.getTime() < now.getTime()) {
    return 'expired';
  }
  // Session mismatch no longer blocks the landing flag — selectLandingPlan
  // ignores stale sessionId for isLandingPlan. Keep wrong_session unused for
  // the public “not showing” pill so admins are not misled.
  return null;
}

export function landingSiteIssueMessage(issue: LandingSiteIssue): string {
  switch (issue) {
    case 'not_active':
      return 'This plan is not active, so the site will not show it';
    case 'not_one_time':
      return 'Only one-time plans can appear on the landing page';
    case 'expired':
      return 'This plan’s end date has passed, so the site will not show it';
    case 'wrong_session':
      return 'This plan is tied to a different session than the one on the landing page';
    default:
      return '';
  }
}
