import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';
import { logAudit } from '@/lib/sessions/audit';
import {
  emailStatusLabel,
  queueAndSendConfirmationEmail,
} from '@/lib/email/outbox';
import { ensureEmailJobIndexes } from '@/lib/email/syncIndexes';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    await ensureEmailJobIndexes();
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const result = await queueAndSendConfirmationEmail(id);
    if (!result.ok) {
      if (result.error?.includes('at most 3')) {
        return conflict(result.error);
      }
      return badRequest(result.error || 'Could not send confirmation email');
    }

    await logAudit({
      adminId: gate.admin.sub,
      action: 'order.email_resend',
      entity: 'order',
      entityId: id,
      meta: {
        emailStatus: result.status,
      },
    });

    return NextResponse.json({
      emailStatus: result.status,
      emailStatusLabel: emailStatusLabel(result.status),
      reason: result.reason || '',
    });
  } catch (err) {
    console.error(
      '[orders resend-email]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}
