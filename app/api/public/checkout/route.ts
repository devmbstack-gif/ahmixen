import { getPublicCheckoutConfig } from '@/lib/public/checkoutConfig';
import {
  publicError,
  publicOk,
  publicRateLimited,
} from '@/lib/public/response';
import { rateLimit, rateLimitKey } from '@/lib/public/rateLimit';
import { PUBLIC_RATE_LIMITS } from '@/lib/public/rateLimitConfig';

export async function GET(request: Request) {
  try {
    const rule = PUBLIC_RATE_LIMITS.checkout;
    const rl = await rateLimit(
      rateLimitKey('public:checkout', request),
      rule.limit,
      rule.windowSeconds
    );
    if (!rl.ok) return publicRateLimited(rl.retryAfterSeconds);

    const data = await getPublicCheckoutConfig();
    return publicOk(data);
  } catch (err) {
    console.error('[public checkout]', err instanceof Error ? err.name : 'error');
    return publicError('server_error', 'Something went wrong', 500);
  }
}
