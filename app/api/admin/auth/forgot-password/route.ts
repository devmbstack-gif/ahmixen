import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { Admin } from '@/models/Admin';
import { isAllowedOrigin } from '@/lib/auth/admin-session';
import {
  OTP_TTL_MS,
  createPasswordResetChallenge,
  generateOtpCode,
} from '@/lib/auth/admin-password-reset';
import { sendOutboundEmail } from '@/lib/email/sender';
import { adminPasswordOtpEmail } from '@/lib/email/templates/adminPasswordOtp';
import { rateLimit, rateLimitKey } from '@/lib/public/rateLimit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
});

const GENERIC_OK = {
  ok: true,
  message:
    'If that email is registered, we sent a 6-digit verification code. Check your inbox.',
};

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = await rateLimit(
      rateLimitKey('admin:forgot-password', request),
      8,
      3600
    );
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: `Too many requests. Try again in ${rl.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      // Same response shape — do not leak validation nuance for email enum.
      return NextResponse.json(GENERIC_OK);
    }

    const email = parsed.data.email.trim().toLowerCase();
    await connectToDatabase();

    const admin = await Admin.findOne({ email })
      .select({ _id: 1, email: 1, name: 1 })
      .lean();

    if (!admin) {
      return NextResponse.json(GENERIC_OK);
    }

    const otp = generateOtpCode();
    await createPasswordResetChallenge({
      email: admin.email,
      adminId: String(admin._id),
      otpCode: otp,
    });

    const mail = adminPasswordOtpEmail({
      name: admin.name || 'Admin',
      otp,
      expiresMinutes: Math.round(OTP_TTL_MS / 60000),
    });

    const sent = await sendOutboundEmail({
      to: admin.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    if (!sent.ok) {
      console.error('[admin forgot-password] email failed', sent.reason);
      return NextResponse.json(
        {
          error:
            'Could not send the verification email. Check email settings and try again.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(GENERIC_OK);
  } catch (err) {
    console.error(
      '[admin forgot-password]',
      err instanceof Error ? err.message : 'error'
    );
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
