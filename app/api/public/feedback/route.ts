import { Testimonial } from '@/models/Testimonial';
import { connectToDatabase } from '@/lib/db';
import { publicFeedbackSchema } from '@/lib/public/feedbackSchema';
import {
  assertPublicOrigin,
  publicError,
  publicOk,
  publicRateLimited,
} from '@/lib/public/response';
import { rateLimit, rateLimitKey } from '@/lib/public/rateLimit';
import { PUBLIC_RATE_LIMITS } from '@/lib/public/rateLimitConfig';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!assertPublicOrigin(request)) {
      return publicError('forbidden', 'Forbidden', 403);
    }

    const ipRule = PUBLIC_RATE_LIMITS.feedbackIp;
    const rlIp = await rateLimit(
      rateLimitKey('public:feedback', request),
      ipRule.limit,
      ipRule.windowSeconds
    );
    if (!rlIp.ok) return publicRateLimited(rlIp.retryAfterSeconds);

    const body = await request.json().catch(() => null);
    const parsed = publicFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return publicError(
        'invalid_input',
        parsed.error.issues[0]?.message || 'Invalid input',
        400
      );
    }

    const data = parsed.data;
    if (data.website && data.website.trim()) {
      // Honeypot: pretend success
      return publicOk({ ok: true });
    }

    await connectToDatabase();

    const maxOrder = await Testimonial.findOne()
      .sort({ sortOrder: -1 })
      .select({ sortOrder: 1 })
      .lean();
    const sortOrder = (maxOrder?.sortOrder ?? -1) + 1;

    await Testimonial.create({
      name: data.name,
      role: data.role || '',
      quote: data.quote,
      rating: data.rating,
      avatarAssetId: null,
      visible: false,
      source: 'feedback',
      sortOrder,
      version: 1,
      createdBy: 'public-feedback',
      updatedBy: 'public-feedback',
    });

    return publicOk({
      ok: true,
      message:
        'Thank you! Your feedback was submitted. It will appear on the website after we review it.',
    });
  } catch (err) {
    console.error(
      '[public feedback]',
      err instanceof Error ? err.message : 'error'
    );
    return publicError('server_error', 'Something went wrong', 500);
  }
}
