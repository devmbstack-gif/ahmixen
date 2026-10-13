import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Lead } from '@/models/Lead';
import { logAudit } from '@/lib/sessions/audit';
import { leadPatchSchema } from '@/lib/leads/schema';
import { serializeAdminLead } from '@/lib/leads/serialize';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const doc = await Lead.findById(id);
    if (!doc) return notFound();
    return NextResponse.json({ lead: serializeAdminLead(doc) });
  } catch (err) {
    console.error('[leads GET id]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const body = await request.json().catch(() => null);
    const parsed = leadPatchSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Invalid input';
      return badRequest(msg);
    }

    const doc = await Lead.findById(id);
    if (!doc) return notFound();

    const data = parsed.data;
    if (data.version !== (doc.version ?? 1)) {
      return conflict('This lead was changed elsewhere — reload and try again');
    }

    if (data.status !== undefined) {
      if (doc.status === 'converted') {
        return badRequest('Converted status is set automatically and cannot be changed');
      }
      doc.status = data.status;
    }

    if (data.adminNote !== undefined) {
      doc.adminNote = data.adminNote;
    }

    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'lead.update',
      entity: 'lead',
      entityId: id,
      meta: {
        fields: Object.keys(data).filter((k) => k !== 'version'),
      },
    });

    return NextResponse.json({ lead: serializeAdminLead(doc) });
  } catch (err) {
    console.error('[leads PATCH]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const deleted = await Lead.findByIdAndDelete(id);
    if (!deleted) return notFound();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'lead.delete',
      entity: 'lead',
      entityId: id,
      meta: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[leads DELETE]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
