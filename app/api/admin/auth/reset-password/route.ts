import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { Admin } from '@/models/Admin';
import { isAllowedOrigin } from '@/lib/auth/admin-session';
import {
  hashPassword,
  passwordStrengthOk,
  verifyAdminResetToken,
} from '@/lib/auth/admin-password-reset';
import { rateLimit, rateLimitKey } from '@/lib/public/rateLimit';
import { logAudit } from '@/lib/sessions/audit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  resetToken: z.string().min(20).max(2000),
  password: z.string().min(8).max(200),
  confirmPassword: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = await rateLimit(
      rateLimitKey('admin:reset-password', request),
      12,
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

    const { resetToken, password, confirmPassword } = parsed.data;
    if (!passwordStrengthOk(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password and confirmation do not match' },
        { status: 400 }
      );
    }

    const payload = await verifyAdminResetToken(resetToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Reset link expired. Start again from Forgot Password.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const admin = await Admin.findById(payload.sub);
    if (!admin || admin.email !== payload.email) {
      return NextResponse.json(
        { error: 'Reset link expired. Start again from Forgot Password.' },
        { status: 400 }
      );
    }

    admin.passwordHash = await hashPassword(password);
    admin.failedLoginCount = 0;
    admin.lockedUntil = null;
    await admin.save();

    await logAudit({
      adminId: String(admin._id),
      action: 'admin.password.reset',
      entity: 'admin',
      entityId: String(admin._id),
      meta: {},
    });

    return NextResponse.json({
      ok: true,
      message: 'Password updated. You can sign in now.',
    });
  } catch (err) {
    console.error(
      '[admin reset-password]',
      err instanceof Error ? err.message : 'error'
    );
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
