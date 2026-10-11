import { Lead } from '@/models/Lead';
import { Coupon } from '@/models/Coupon';
import { Plan } from '@/models/Plan';
import { Session } from '@/models/Session';
import { connectToDatabase } from '@/lib/db';
import { leadFieldsSchema } from '@/lib/public/schema';
import {
  assertPublicOrigin,
  publicError,
  publicOk,
  publicRateLimited,
} from '@/lib/public/response';
import {
  rateLimit,
  rateLimitIdentityKey,
  rateLimitKey,
} from '@/lib/public/rateLimit';
import { PUBLIC_RATE_LIMITS } from '@/lib/public/rateLimitConfig';
import { loadCouponForPricing } from '@/lib/public/couponLoad';
import { validateCoupon, computeTotals } from '@/lib/coupons/pricing';
import { discountLabelFor } from '@/lib/coupons/serialize';
import { ALLOW_INSTALLMENTS } from '@/lib/public/checkoutConfig';

function isDupKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}

async function cheapestActivePlan() {
  const session = await Session.findOne({
    isLandingActive: true,
    status: 'open',
  }).lean();
  if (!session) return null;
  const sessionId = String(session._id);
  const filter: Record<string, unknown> = {
    status: 'active',
    $or: [{ sessionId: '' }, { sessionId }],
  };
  if (!ALLOW_INSTALLMENTS) filter.type = 'one_time';
  const plans = await Plan.find(filter).sort({ price: 1 }).limit(8).lean();
  const now = new Date();
  return (
    plans.find(
      (p) => !p.validUntil || new Date(p.validUntil).getTime() >= now.getTime()
    ) ?? null
  );
}

async function popupCouponForEmail(email: string) {
  const popup = await Coupon.findOne({
    isPopupCoupon: true,
    status: 'active',
  }).lean();
  if (!popup) return null;

  const plan = await cheapestActivePlan();
  if (!plan) return null;

  const coupon = await loadCouponForPricing(String(popup.code), email);
  if (!coupon) return null;

  const planInput = {
    id: String(plan._id),
    type: plan.type as 'one_time' | 'installment',
    currency: plan.currency as 'PKR' | 'USD',
    price: plan.price,
    installmentsCount: plan.installmentsCount ?? null,
  };

  const check = validateCoupon({
    coupon,
    planId: planInput.id,
    plan: planInput,
    email,
  });
  if (!check.ok) return null;

  computeTotals(planInput, check.coupon);

  return {
    code: check.coupon.code,
    label: discountLabelFor(
      check.coupon.discountType,
      check.coupon.discountValue,
      check.coupon.currency || 'PKR'
    ),
  };
}

export async function POST(request: Request) {
  try {
    if (!assertPublicOrigin(request)) {
      return publicError('forbidden', 'Forbidden', 403);
    }

    const ipRule = PUBLIC_RATE_LIMITS.leadsIp;
    const rlIp = await rateLimit(
      rateLimitKey('public:leads', request),
      ipRule.limit,
      ipRule.windowSeconds
    );
    if (!rlIp.ok) return publicRateLimited(rlIp.retryAfterSeconds);

    const body = await request.json().catch(() => null);
    const parsed = leadFieldsSchema.safeParse(body);
    if (!parsed.success) {
      return publicError(
        'invalid_input',
        parsed.error.issues[0]?.message || 'Invalid input',
        400
      );
    }

    const data = parsed.data;

    if (data.website && data.website.trim()) {
      return publicOk({ popupCoupon: null });
    }

    const emailRule = PUBLIC_RATE_LIMITS.leadsEmail;
    const rlEmail = await rateLimit(
      rateLimitIdentityKey('public:leads:email', data.email),
      emailRule.limit,
      emailRule.windowSeconds
    );
    if (!rlEmail.ok) return publicRateLimited(rlEmail.retryAfterSeconds);

    await connectToDatabase();
    const now = new Date();
    const emailNormalized = data.email;

    const fields = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      profession: data.profession || '',
      message: data.message || '',
      utm: data.utm,
      referrer: data.referrer || '',
      lastSeenAt: now,
    };

    const existing = await Lead.findOne({ emailNormalized });
    if (existing) {
      Object.assign(existing, fields);
      existing.submissionsCount = (existing.submissionsCount || 1) + 1;
      await existing.save();
    } else {
      try {
        await Lead.create({
          ...fields,
          emailNormalized,
          status: 'new',
          convertedOrderId: '',
          submissionsCount: 1,
          firstSeenAt: now,
        });
      } catch (err) {
        if (!isDupKey(err)) throw err;
        // Parallel create race — retry once as update
        await Lead.updateOne(
          { emailNormalized },
          {
            $set: fields,
            $inc: { submissionsCount: 1 },
          }
        );
      }
    }

    const popupCoupon = await popupCouponForEmail(emailNormalized);
    return publicOk({ popupCoupon });
  } catch (err) {
    console.error('[public leads]', err instanceof Error ? err.name : 'error');
    return publicError('server_error', 'Something went wrong', 500);
  }
}
