import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { connectToDatabase } from '@/lib/db';
import { expireStaleOrders } from '@/lib/orders/expire';
import { holdStillActive } from '@/lib/orders/seats';
import { sessionTimezone } from '@/lib/sessions/datetime';
import { maskEmail } from '@/lib/public/mask';
import {
  publicError,
  publicOk,
  publicRateLimited,
} from '@/lib/public/response';
import { rateLimit, rateLimitKey } from '@/lib/public/rateLimit';
import { PUBLIC_RATE_LIMITS } from '@/lib/public/rateLimitConfig';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const rule = PUBLIC_RATE_LIMITS.orderStatus;
    const rl = await rateLimit(
      rateLimitKey('public:order-status', request),
      rule.limit,
      rule.windowSeconds
    );
    if (!rl.ok) return publicRateLimited(rl.retryAfterSeconds);

    const { token } = await ctx.params;
    if (!token || token.length < 32) {
      return publicError('not_found', 'Booking not found', 404);
    }

    await connectToDatabase();
    await expireStaleOrders();

    const doc = await Order.findOne({ publicToken: token }).lean();
    if (!doc) {
      return publicError('not_found', 'Booking not found', 404);
    }

    const session = await Session.findById(doc.sessionId)
      .select({ startsAt: 1, durationMinutes: 1, timezone: 1, holds: 1 })
      .lean();

    let holdExpiresAt: string | null = null;
    if (doc.status === 'awaiting_payment' && session?.holds) {
      const hold = (
        session.holds as Array<{ orderId?: string; expiresAt: Date }>
      ).find((h) => h.orderId === String(doc._id));
      if (hold?.expiresAt) {
        holdExpiresAt = new Date(hold.expiresAt).toISOString();
      }
    }

    const uploadCount = doc.proof?.uploadCount ?? 0;
    const canReplaceProof =
      (doc.status === 'awaiting_payment' ||
        doc.status === 'pending_verification') &&
      uploadCount < 3;

    return publicOk({
      orderNumber: doc.orderNumber,
      status: doc.status,
      planName: doc.planSnapshot.name,
      currency: doc.planSnapshot.currency,
      amounts: {
        basePrice: doc.amounts.basePrice,
        discountAmount: doc.amounts.discountAmount,
        finalPrice: doc.amounts.finalPrice,
        installmentsCount: doc.amounts.installmentsCount,
        totalAmount: doc.amounts.totalAmount,
      },
      couponCode: doc.coupon?.code ?? null,
      session: session
        ? {
            startsAt: new Date(session.startsAt).toISOString(),
            durationMinutes: session.durationMinutes,
            timezone: sessionTimezone(session.timezone),
          }
        : null,
      holdExpiresAt,
      proofUploaded: Boolean(doc.proof?.fileId),
      canReplaceProof,
      rejectionReason: doc.rejectionReason || null,
      maskedEmail: maskEmail(doc.customer.email),
      serverNow: new Date().toISOString(),
      seatHoldExpired:
        (doc.status === 'pending_verification' ||
          doc.status === 'awaiting_payment') &&
        !holdStillActive(
          session?.holds as Array<{ orderId?: string; expiresAt: Date | string }>,
          String(doc._id)
        ),
    });
  } catch (err) {
    console.error(
      '[public order status]',
      err instanceof Error ? err.name : 'error'
    );
    return publicError('server_error', 'Something went wrong', 500);
  }
}
