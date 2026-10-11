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
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      const nextCount = (admin.failedLoginCount ?? 0) + 1;
      admin.failedLoginCount = nextCount;
      if (nextCount >= MAX_FAILURES) {
        admin.lockedUntil = new Date(Date.now() + LOCK_MS);
        admin.failedLoginCount = 0;
      }
      await admin.save();
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    admin.failedLoginCount = 0;
    admin.lockedUntil = null;
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = await signAdminToken({
      sub: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      ok: true,
      admin: { name: admin.name, email: admin.email, role: admin.role },
    });
    applyAdminSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[admin login]', err instanceof Error ? err.message : 'error');
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
