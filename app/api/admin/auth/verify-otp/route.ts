import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { AdminPasswordReset } from '@/models/AdminPasswordReset';
import { isAllowedOrigin } from '@/lib/auth/admin-session';
import {
  MAX_OTP_ATTEMPTS,
  signAdminResetToken,
  verifyOtpHash,
} from '@/lib/auth/admin-password-reset';
import { rateLimit, rateLimitKey } from '@/lib/public/rateLimit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = await rateLimit(
      rateLimitKey('admin:verify-otp', request),
      20,
      3600
    );
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const otp = parsed.data.otp.trim();

    await connectToDatabase();

    const challenge = await AdminPasswordReset.findOne({
      email,
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Code expired or not found. Request a new one.' },
        { status: 400 }
      );
    }

    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Code expired. Request a new one.' },
        { status: 400 }
      );
    }

    if ((challenge.attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Request a new code.' },
        { status: 400 }
      );
    }

    const match = await verifyOtpHash(otp, challenge.otpHash);
    if (!match) {
      challenge.attempts = (challenge.attempts ?? 0) + 1;
      await challenge.save();
      return NextResponse.json(
        { error: 'Incorrect verification code' },
        { status: 400 }
      );
    }

    challenge.consumedAt = new Date();
    await challenge.save();

    const resetToken = await signAdminResetToken({
      sub: challenge.adminId,
      email: challenge.email,
    });

    return NextResponse.json({
      ok: true,
      resetToken,
      email: challenge.email,
    });
  } catch (err) {
    console.error(
      '[admin verify-otp]',
      err instanceof Error ? err.message : 'error'
    );
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
