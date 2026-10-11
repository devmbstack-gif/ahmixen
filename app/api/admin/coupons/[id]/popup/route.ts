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
import { couponPopupSchema } from '@/lib/coupons/schema';
import { serializeAdminCoupon } from '@/lib/coupons/serialize';
import { countRedemptionsForCoupon } from '@/lib/coupons/redemptions';
import {
  duplicateKeyField,
  isMongoDuplicateKey,
} from '@/lib/coupons/business';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const body = await request.json().catch(() => null);
    const parsed = couponPopupSchema.safeParse(body ?? {});
    if (!parsed.success) return badRequest('Invalid request');

    const existing = await Coupon.findById(id);
    if (!existing) return notFound();
    if (existing.status === 'archived') {
      return badRequest('Archived coupons cannot be the popup coupon');
    }
    if (existing.status !== 'active') {
      return badRequest('Only an active coupon can be the popup coupon');
    }
    if (parsed.data.version !== existing.version) {
      return conflict('This coupon was changed elsewhere, reload');
    }

    // Unset the previous popup coupon first (partial unique index on true).
    await Coupon.updateMany(
      { _id: { $ne: existing._id }, isPopupCoupon: true },
      {
        $set: { isPopupCoupon: false, updatedBy: gate.admin.sub },
        $inc: { version: 1 },
      }
    );

    existing.isPopupCoupon = true;
    existing.updatedBy = gate.admin.sub;
    existing.version = (existing.version ?? 1) + 1;
    await existing.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'coupon.popup',
      entity: 'coupon',
      entityId: id,
      meta: { code: existing.code, isPopupCoupon: true },
    });

    const planName = existing.planId
      ? (
          await Plan.findById(existing.planId).select({ name: 1 }).lean()
        )?.name ?? null
      : null;
    const usedCount = await countRedemptionsForCoupon(id);

    return NextResponse.json({
      coupon: serializeAdminCoupon(existing, usedCount, planName),
    });
  } catch (err) {
    if (isMongoDuplicateKey(err)) {
      const field = duplicateKeyField(err);
      if (field === 'isPopupCoupon' || !field) {
        return badRequest(
          'Another coupon is already set as the popup coupon. Try again.'
        );
      }
    }
    console.error('[coupons popup]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
