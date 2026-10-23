import { createHash } from 'node:crypto';
import { RateLimit } from '@/models/RateLimit';
import { connectToDatabase } from '@/lib/db';

function salt(): string {
  const fromEnv = (
    process.env.RATE_LIMIT_SALT ||
    process.env.AUTH_SECRET ||
    ''
  ).trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    // Never use a shared weak constant in production — hashes would be forgeable.
    console.error(
      '[rateLimit] Set RATE_LIMIT_SALT or AUTH_SECRET in production'
    );
    return createHash('sha256')
      .update(`ahmixen-missing-salt:${process.pid}:${Date.now()}`)
      .digest('hex');
  }

  return 'dev-salt';
}

/** First x-forwarded-for value, hashed — never store raw IPs. */
export function clientIpHash(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for') || '';
  const first = fwd.split(',')[0]?.trim() || 'unknown';
  return createHash('sha256').update(`${salt()}:${first}`).digest('hex').slice(0, 32);
}

/** Hash identity values (email, token, …) — never store raw PII in rateLimits. */
export function identityHash(value: string): string {
  const normalized = value.trim().toLowerCase();
  return createHash('sha256')
    .update(`${salt()}:id:${normalized}`)
    .digest('hex')
    .slice(0, 32);
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Atomic Mongo rate limit (serverless-safe).
 * key should already include a route namespace + hashed IP (and token when needed).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  await connectToDatabase();
  const now = new Date();
  const windowMs = Math.max(1, windowSeconds) * 1000;

  const existing = await RateLimit.findOne({ key }).lean();
  if (
    !existing ||
    now.getTime() - new Date(existing.windowStart).getTime() >= windowMs
  ) {
    const expireAt = new Date(now.getTime() + windowMs);
    await RateLimit.findOneAndUpdate(
      { key },
      {
        $set: {
          count: 1,
          windowStart: now,
          expireAt,
        },
      },
      { upsert: true }
    );
    return { ok: true };
  }

  const updated = await RateLimit.findOneAndUpdate(
    { key, count: { $lt: limit } },
    {
      $inc: { count: 1 },
    },
    { new: true }
  );

  if (updated) return { ok: true };

  const windowStart = new Date(existing.windowStart).getTime();
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStart + windowMs - now.getTime()) / 1000)
  );
  return { ok: false, retryAfterSeconds };
}

export function rateLimitKey(scope: string, request: Request, extra = ''): string {
  const ip = clientIpHash(request);
  return extra ? `${scope}:${ip}:${extra}` : `${scope}:${ip}`;
}

/** Per-identity key (hashed). Independent of IP so campus NAT does not collide. */
export function rateLimitIdentityKey(scope: string, identity: string): string {
  return `${scope}:${identityHash(identity)}`;
}
