import { NextResponse } from 'next/server';
import { Plan } from '@/models/Plan';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { planPatchSchema, planWriteSchema } from '@/lib/plans/schema';
import { serializeAdminPlan } from '@/lib/plans/serialize';
import { parseValidUntil } from '@/lib/plans/validate';

type Ctx = { params: Promise<{ id: string }> };

function validUntilLocalFromDoc(validUntil: Date | null | undefined): string | null {
  if (!validUntil) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(validUntil);
}

async function loadTitle(sessionId: string) {
  if (!sessionId) return null;
  const s = await Session.findById(sessionId).select({ title: 1 }).lean();
  return s?.title ?? null;
}

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    const doc = await Plan.findById(id);
    if (!doc) return notFound();
    return NextResponse.json({
      plan: serializeAdminPlan(doc, await loadTitle(doc.sessionId || '')),
    });
  } catch (err) {
    console.error('[plans GET id]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = planPatchSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Invalid input';
      return badRequest(msg);
    }

    const doc = await Plan.findById(id);
    if (!doc) return notFound();

    const data = parsed.data;
    if (data.version !== doc.version) {
      return conflict('This plan was changed elsewhere, reload');
    }

    const { version: _version, ...patchFields } = data;
    const mergedInput = {
      name: patchFields.name ?? doc.name,
      shortDescription:
        patchFields.shortDescription !== undefined
          ? patchFields.shortDescription
          : (doc.shortDescription ?? ''),
      type: patchFields.type ?? doc.type,
      currency: patchFields.currency ?? doc.currency,
      price: patchFields.price ?? doc.price,
      originalPrice:
        patchFields.originalPrice !== undefined
          ? patchFields.originalPrice
          : doc.originalPrice ?? null,
      installmentsCount:
        (patchFields.type ?? doc.type) === 'one_time'
          ? null
          : patchFields.installmentsCount !== undefined
            ? patchFields.installmentsCount
            : doc.installmentsCount ?? null,
      features:
        patchFields.features !== undefined
          ? patchFields.features
          : Array.isArray(doc.features)
            ? doc.features.map(String)
            : [],
      sessionId:
        patchFields.sessionId !== undefined
          ? patchFields.sessionId
          : (doc.sessionId ?? ''),
      validUntil:
        patchFields.validUntil !== undefined
          ? patchFields.validUntil
          : validUntilLocalFromDoc(doc.validUntil),
      status:
        patchFields.status !== undefined && patchFields.status !== 'archived'
          ? patchFields.status
          : doc.status === 'archived'
            ? 'hidden'
            : doc.status,
      sortOrder: patchFields.sortOrder ?? doc.sortOrder ?? 0,
    };

    const merged = planWriteSchema.safeParse(mergedInput);
    if (!merged.success) {
      const msg = merged.error.issues[0]?.message || 'Invalid input';
      return badRequest(msg);
    }

    const next = merged.data;

    if (next.sessionId) {
      const session = await Session.findById(next.sessionId).select({ _id: 1 }).lean();
      if (!session) return badRequest('Choose a valid session or All sessions');
    }

    doc.name = next.name;
    doc.shortDescription = next.shortDescription ?? '';
    doc.type = next.type;
    doc.currency = next.currency;
    doc.price = next.price;
    doc.originalPrice = next.originalPrice ?? null;
    doc.installmentsCount =
      next.type === 'one_time' ? null : (next.installmentsCount ?? null);
    doc.features = (next.features ?? []).map((f) => f.trim()).filter(Boolean).slice(0, 8);
    doc.sessionId = next.sessionId ?? '';
    doc.validUntil = parseValidUntil(next.validUntil);
    if (next.status && next.status !== 'archived') {
      doc.status = next.status;
    }
    doc.sortOrder = next.sortOrder ?? 0;
    if (doc.status !== 'active' || doc.type !== 'one_time') {
      doc.isLandingPlan = false;
    }

    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'plan.update',
      entity: 'plan',
      entityId: String(doc._id),
      meta: { name: doc.name, status: doc.status },
    });

    return NextResponse.json({
      plan: serializeAdminPlan(doc, await loadTitle(doc.sessionId || '')),
    });
  } catch (err) {
    console.error('[plans PATCH]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

/** Soft-delete = archive */
export async function DELETE(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    const doc = await Plan.findById(id);
    if (!doc) return notFound();
    if (doc.status === 'archived') {
      return badRequest('This plan is already archived');
    }

    doc.status = 'archived';
    doc.isLandingPlan = false;
    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'plan.archive',
      entity: 'plan',
      entityId: String(doc._id),
      meta: { name: doc.name },
    });

    return NextResponse.json({
      plan: serializeAdminPlan(doc, await loadTitle(doc.sessionId || '')),
    });
  } catch (err) {
    console.error('[plans DELETE]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
