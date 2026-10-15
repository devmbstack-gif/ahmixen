import { publicOrderFieldsSchema } from '@/lib/public/schema';
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
import { createPublicOrder } from '@/lib/public/createPublicOrder';

export async function POST(request: Request) {
  try {
    if (!assertPublicOrigin(request)) {
      return publicError('forbidden', 'Forbidden', 403);
    }

    const ipRule = PUBLIC_RATE_LIMITS.ordersIp;
    const rlIp = await rateLimit(
      rateLimitKey('public:orders', request),
      ipRule.limit,
      ipRule.windowSeconds
    );
    if (!rlIp.ok) return publicRateLimited(rlIp.retryAfterSeconds);

    const body = await request.json().catch(() => null);
    const parsed = publicOrderFieldsSchema.safeParse(body);
    if (!parsed.success) {
      return publicError(
        'invalid_input',
        parsed.error.issues[0]?.message || 'Invalid input',
        400
      );
    }

    const data = parsed.data;
    if (data.website && data.website.trim()) {
      return publicOk({
        publicToken: 'honeypot',
        orderNumber: 'AX-000000',
        status: 'awaiting_payment',
        amounts: {
          basePrice: 0,
          discountAmount: 0,
          finalPrice: 0,
          installmentsCount: 1,
          totalAmount: 0,
          currency: 'PKR',
        },
        holdExpiresAt: null,
        alreadyExisted: false,
      });
    }

    const emailRule = PUBLIC_RATE_LIMITS.ordersEmail;
    const rlEmail = await rateLimit(
      rateLimitIdentityKey('public:orders:email', data.email),
      emailRule.limit,
      emailRule.windowSeconds
    );
    if (!rlEmail.ok) return publicRateLimited(rlEmail.retryAfterSeconds);

    const result = await createPublicOrder({
      planId: data.planId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      profession: data.profession,
      sourceKind: data.sourceKind,
      programId: data.programId,
      programTitle: data.programTitle,
      city: data.city,
      skillLevel: data.skillLevel,
      learningGoals: data.learningGoals,
      utm: data.utm,
    });

    if (!result.ok) {
      return publicError(result.code, result.message, result.status);
    }

    return publicOk({
      publicToken: result.publicToken,
      orderNumber: result.orderNumber,
      status: result.status,
      amounts: result.amounts,
      holdExpiresAt: result.holdExpiresAt,
      alreadyExisted: result.alreadyExisted,
    });
  } catch (err) {
    console.error('[public orders]', err instanceof Error ? err.name : 'error');
    return publicError('server_error', 'Something went wrong', 500);
  }
}
