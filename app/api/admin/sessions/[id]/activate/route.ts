import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import { serializeAdminSession } from '@/lib/sessions/serialize';
import {
  badRequest,
  notFound,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

    const existing = await Session.findById(id);
    if (!existing) return notFound();
    if (existing.status === 'archived') {
      return badRequest('Cannot activate an archived session');
    }

    // Ensure only one landing-active session.
    await Session.updateMany(
      { _id: { $ne: existing._id }, isLandingActive: true },
      { $set: { isLandingActive: false, updatedBy: gate.admin.sub }, $inc: { version: 1 } }
    );

    existing.isLandingActive = true;
    existing.updatedBy = gate.admin.sub;
    existing.version = (existing.version ?? 1) + 1;
    await existing.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'session.activate',
      entity: 'session',
      entityId: id,
      meta: { title: existing.title },
    });

    return NextResponse.json({ session: serializeAdminSession(existing) });
  } catch (err) {
    console.error('[sessions activate]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
