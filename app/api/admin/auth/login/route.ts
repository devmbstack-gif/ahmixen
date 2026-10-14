import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { Admin } from '@/models/Admin';
import {
  applyAdminSessionCookie,
  isAllowedOrigin,
  signAdminToken,
} from '@/lib/auth/admin-session';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

const GENERIC_ERROR = 'Invalid email or password';
const LOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!process.env.AUTH_SECRET) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing AUTH_SECRET' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    await connectToDatabase();

    const admin = await Admin.findOne({ email })
      .select({
        email: 1,
        name: 1,
        role: 1,
        passwordHash: 1,
        failedLoginCount: 1,
        lockedUntil: 1,
      })
      .lean();

    if (!admin) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (admin.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now()) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      const nextCount = (admin.failedLoginCount ?? 0) + 1;
      const lock =
        nextCount >= MAX_FAILURES
          ? { lockedUntil: new Date(Date.now() + LOCK_MS), failedLoginCount: 0 }
          : { failedLoginCount: nextCount };
      await Admin.updateOne({ _id: admin._id }, { $set: lock });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Sign cookie + stamp last login in parallel (updateOne is cheaper than save()).
    const [token] = await Promise.all([
      signAdminToken({
        sub: String(admin._id),
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }),
      Admin.updateOne(
        { _id: admin._id },
        {
          $set: {
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        }
      ),
    ]);

    const response = NextResponse.json({
      ok: true,
      admin: { name: admin.name, email: admin.email, role: admin.role },
    });
    applyAdminSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[admin login]', err instanceof Error ? err.name : 'error');
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
