import { Lead } from '@/models/Lead';
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

function isDupKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
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
      return publicOk({ ok: true });
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
        await Lead.updateOne(
          { emailNormalized },
          {
            $set: fields,
            $inc: { submissionsCount: 1 },
          }
        );
      }
    }

    return publicOk({ ok: true });
  } catch (err) {
    console.error('[public leads]', err instanceof Error ? err.name : 'error');
    return publicError('server_error', 'Something went wrong', 500);
  }
}
