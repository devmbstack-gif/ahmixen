import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Coupon } from '@/models/Coupon';
import { Plan } from '@/models/Plan';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';
import { couponStatusSchema } from '@/lib/coupons/schema';
import { serializeAdminCoupon } from '@/lib/coupons/serialize';
import { countRedemptionsForCoupon } from '@/lib/coupons/redemptions';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const body = await request.json().catch(() => null);
    const parsed = couponStatusSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid status');

    const doc = await Coupon.findById(id);
    if (!doc) return notFound();
    if (doc.status === 'archived') {
      return badRequest('Archived coupons cannot be paused or resumed');
    }
    if (parsed.data.version !== doc.version) {
      return conflict('This coupon was changed elsewhere, reload');
    }

    doc.status = parsed.data.status;
    if (parsed.data.status !== 'active') {
      doc.isPopupCoupon = false;
    }
    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'coupon.status',
      entity: 'coupon',
      entityId: String(doc._id),
      meta: { code: doc.code, status: doc.status },
    });

    const planName = doc.planId
      ? (await Plan.findById(doc.planId).select({ name: 1 }).lean())?.name ?? null
      : null;
    const usedCount = await countRedemptionsForCoupon(id);

    return NextResponse.json({
      coupon: serializeAdminCoupon(doc, usedCount, planName),
    });
  } catch (err) {
    console.error('[coupons status]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
