import { Order } from '@/models/Order';
import { Setting } from '@/models/Setting';
import { connectToDatabase } from '@/lib/db';
import { serializePaymentSettings } from '@/lib/settings/serialize';
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
    const rule = PUBLIC_RATE_LIMITS.paymentInfo;
    const rl = await rateLimit(
      rateLimitKey('public:payment-info', request),
      rule.limit,
      rule.windowSeconds
    );
    if (!rl.ok) return publicRateLimited(rl.retryAfterSeconds);

    const { token } = await ctx.params;
    if (!token || token.length < 32) {
      return publicError(
        'unavailable',
        'Payment details are not available right now',
        400
      );
    }

    await connectToDatabase();
    const doc = await Order.findOne({ publicToken: token }).lean();
    if (
      !doc ||
      (doc.status !== 'awaiting_payment' &&
        doc.status !== 'pending_verification')
    ) {
      return publicError(
        'unavailable',
        'Payment details are not available right now',
        400
      );
    }

    const settingsDoc = await Setting.findOne({ key: 'payment' }).lean();
    const settings = serializePaymentSettings(
      settingsDoc as Parameters<typeof serializePaymentSettings>[0]
    );
    if (!settings.bankTransferEnabled) {
      return publicError(
        'unavailable',
        'Payment details are not available right now',
        400
      );
    }

    return publicOk({
      bankName: settings.bankName,
      accountTitle: settings.accountTitle,
      accountNumber: settings.accountNumber,
      iban: settings.iban,
      paymentInstructions: settings.paymentInstructions,
      amountToPay: doc.amounts.finalPrice,
      currency: doc.planSnapshot.currency,
    });
  } catch (err) {
    console.error(
      '[public payment-info]',
      err instanceof Error ? err.name : 'error'
    );
    return publicError('server_error', 'Something went wrong', 500);
  }
}
