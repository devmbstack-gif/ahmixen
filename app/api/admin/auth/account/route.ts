import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Admin } from '@/models/Admin';
import {
  applyAdminSessionCookie,
  isAllowedOrigin,
  signAdminToken,
} from '@/lib/auth/admin-session';
import { hashPassword, passwordStrengthOk } from '@/lib/auth/admin-password-reset';
import {
  badRequest,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { logAudit } from '@/lib/sessions/audit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newEmail: z.union([
    z.literal(''),
    z.string().trim().email('Enter a valid new email').max(254),
  ]),
  newPassword: z.string().max(200),
  confirmNewPassword: z.string().max(200),
});

export async function GET() {
  const gate = await withAdminRead();
  if (gate.error || !gate.admin) return gate.error!;

  return NextResponse.json({
    admin: {
      email: gate.admin.email,
      name: gate.admin.name,
      role: gate.admin.role,
    },
  });
}

export async function PATCH(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const currentPassword = parsed.data.currentPassword;
    const newEmailRaw = (parsed.data.newEmail || '').trim().toLowerCase();
    const newPassword = parsed.data.newPassword || '';
    const confirmNewPassword = parsed.data.confirmNewPassword || '';

    const changingEmail = Boolean(newEmailRaw);
    const changingPassword = Boolean(newPassword);

    if (!changingEmail && !changingPassword) {
      return badRequest('Enter a new email and/or a new password');
    }

    if (changingPassword) {
      if (!passwordStrengthOk(newPassword)) {
        return badRequest('New password must be at least 8 characters');
      }
      if (newPassword !== confirmNewPassword) {
        return badRequest('New password and confirmation do not match');
      }
    }

    const admin = await Admin.findById(gate.admin.sub).select({
      email: 1,
      name: 1,
      role: 1,
      passwordHash: 1,
    });
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!passwordOk) {
      return badRequest('Current password is incorrect');
    }

    if (changingEmail) {
      if (newEmailRaw === admin.email) {
        return badRequest('New email is the same as your current email');
      }
      const taken = await Admin.findOne({
        email: newEmailRaw,
        _id: { $ne: admin._id },
      })
        .select({ _id: 1 })
        .lean();
      if (taken) {
        return badRequest('That email is already in use');
      }
      admin.email = newEmailRaw;
    }

    if (changingPassword) {
      admin.passwordHash = await hashPassword(newPassword);
    }

    await admin.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'admin.account.update',
      entity: 'admin',
      entityId: gate.admin.sub,
      meta: {
        emailChanged: changingEmail,
        passwordChanged: changingPassword,
      },
    });

    const token = await signAdminToken({
      sub: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      ok: true,
      admin: { name: admin.name, email: admin.email, role: admin.role },
      message: changingPassword
        ? changingEmail
          ? 'Email and password updated'
          : 'Password updated'
        : 'Email updated',
    });
    applyAdminSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error(
      '[admin account PATCH]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}
