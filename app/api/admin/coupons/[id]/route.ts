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
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { couponPatchSchema, couponWriteSchema } from '@/lib/coupons/schema';
import { serializeAdminCoupon } from '@/lib/coupons/serialize';
import {
  parseCouponEnd,
  parseCouponStart,
  toLocalDateString,
} from '@/lib/coupons/dates';
import { normalizeCouponCode } from '@/lib/coupons/code';
import {
  assertCouponBusinessRules,
  duplicateKeyField,
  isMongoDuplicateKey,
} from '@/lib/coupons/business';
import { countRedemptionsForCoupon } from '@/lib/coupons/redemptions';

type Ctx = { params: Promise<{ id: string }> };

async function loadPlanName(planId: string) {
  if (!planId) return null;
  const p = await Plan.findById(planId).select({ name: 1 }).lean();
  return p?.name ?? null;
}

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const doc = await Coupon.findById(id);
    if (!doc) return notFound();
    const usedCount = await countRedemptionsForCoupon(id);
    return NextResponse.json({
      coupon: serializeAdminCoupon(doc, usedCount, await loadPlanName(doc.planId || '')),
    });
  } catch (err) {
    console.error('[coupons GET id]', err instanceof Error ? err.message : 'error');
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
    const parsed = couponPatchSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Invalid input';
      return badRequest(msg);
    }

    const doc = await Coupon.findById(id);
    if (!doc) return notFound();

    const data = parsed.data;
    if (data.version !== doc.version) {
      return conflict('This coupon was changed elsewhere, reload');
    }

    const usedCount = await countRedemptionsForCoupon(id);
    const { version: _version, ...patchFields } = data;

    const nextCode =
      patchFields.code !== undefined
        ? normalizeCouponCode(patchFields.code)
        : normalizeCouponCode(doc.code);

    if (usedCount > 0 && nextCode !== normalizeCouponCode(doc.code)) {
      return badRequest(
        'The coupon code cannot be changed after it has been used'
      );
    }

    const mergedInput = {
      code: nextCode,
      note:
        patchFields.note !== undefined ? patchFields.note : (doc.note ?? ''),
      discountType: patchFields.discountType ?? doc.discountType,
      discountValue: patchFields.discountValue ?? doc.discountValue,
      currency:
        patchFields.currency !== undefined
          ? patchFields.currency
          : ((doc.currency || '') as 'PKR' | 'USD' | ''),
      planId:
        patchFields.planId !== undefined ? patchFields.planId : (doc.planId ?? ''),
      startsAt:
        patchFields.startsAt !== undefined
          ? patchFields.startsAt
          : toLocalDateString(doc.startsAt) || null,
      endsAt:
        patchFields.endsAt !== undefined
          ? patchFields.endsAt
          : toLocalDateString(doc.endsAt) || null,
      usageLimit:
        patchFields.usageLimit !== undefined
          ? patchFields.usageLimit
          : doc.usageLimit ?? null,
      perEmailLimit: patchFields.perEmailLimit ?? doc.perEmailLimit ?? 1,
      status:
        patchFields.status !== undefined && patchFields.status !== 'archived'
          ? patchFields.status
          : doc.status === 'archived'
            ? 'paused'
            : doc.status,
      isPopupCoupon:
        patchFields.isPopupCoupon !== undefined
          ? patchFields.isPopupCoupon
          : Boolean(doc.isPopupCoupon),
    };

    if (mergedInput.discountType === 'percent') {
      mergedInput.currency = '';
    }

    const merged = couponWriteSchema.safeParse(mergedInput);
    if (!merged.success) {
      const msg = merged.error.issues[0]?.message || 'Invalid input';
      return badRequest(msg);
    }

    const next = merged.data;
    const businessErr = await assertCouponBusinessRules(next, { usedCount });
    if (businessErr) return badRequest(businessErr);

    const prevPopup = Boolean(doc.isPopupCoupon);

    if (next.isPopupCoupon) {
      await Coupon.updateMany(
        { _id: { $ne: doc._id }, isPopupCoupon: true },
        {
          $set: { isPopupCoupon: false, updatedBy: gate.admin.sub },
          $inc: { version: 1 },
        }
      );
    }

    doc.code = normalizeCouponCode(next.code);
    doc.note = next.note ?? '';
    doc.discountType = next.discountType;
    doc.discountValue = next.discountValue;
    doc.currency = next.discountType === 'percent' ? '' : next.currency || '';
    doc.planId = next.planId ?? '';
    doc.startsAt = parseCouponStart(next.startsAt);
    doc.endsAt = parseCouponEnd(next.endsAt);
    doc.usageLimit = next.usageLimit ?? null;
    doc.perEmailLimit = next.perEmailLimit ?? 1;
    if (next.status && next.status !== 'archived') {
      doc.status = next.status;
    }
    doc.isPopupCoupon = Boolean(next.isPopupCoupon);
    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'coupon.update',
      entity: 'coupon',
      entityId: String(doc._id),
      meta: { code: doc.code, status: doc.status },
    });

    if (prevPopup !== doc.isPopupCoupon) {
      await logAudit({
        adminId: gate.admin.sub,
        action: 'coupon.popup',
        entity: 'coupon',
        entityId: String(doc._id),
        meta: { code: doc.code, isPopupCoupon: doc.isPopupCoupon },
      });
    }

    return NextResponse.json({
      coupon: serializeAdminCoupon(
        doc,
        usedCount,
        await loadPlanName(doc.planId || '')
      ),
    });
  } catch (err) {
    if (isMongoDuplicateKey(err)) {
      const field = duplicateKeyField(err);
      if (field === 'isPopupCoupon') {
        return badRequest(
          'Another coupon is already set as the popup coupon. Try again.'
        );
      }
      return badRequest('A coupon with this code already exists');
    }
    console.error('[coupons PATCH]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

/** Soft-delete = archive */
export async function DELETE(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const doc = await Coupon.findById(id);
    if (!doc) return notFound();
    if (doc.status === 'archived') {
      return badRequest('This coupon is already archived');
    }

    doc.status = 'archived';
    doc.isPopupCoupon = false;
    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'coupon.archive',
      entity: 'coupon',
      entityId: String(doc._id),
      meta: { code: doc.code },
    });

    const usedCount = await countRedemptionsForCoupon(id);
    return NextResponse.json({
      coupon: serializeAdminCoupon(
        doc,
        usedCount,
        await loadPlanName(doc.planId || '')
      ),
    });
  } catch (err) {
    console.error('[coupons DELETE]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
