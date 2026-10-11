import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Coupon } from '@/models/Coupon';
import { Plan } from '@/models/Plan';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { couponWriteSchema } from '@/lib/coupons/schema';
import { serializeAdminCoupon } from '@/lib/coupons/serialize';
import { parseCouponEnd, parseCouponStart } from '@/lib/coupons/dates';
import { normalizeCouponCode } from '@/lib/coupons/code';
import {
  assertCouponBusinessRules,
  duplicateKeyField,
  isMongoDuplicateKey,
} from '@/lib/coupons/business';
import { countRedemptionsByCouponIds } from '@/lib/coupons/redemptions';
import type { CouponComputedState } from '@/lib/coupons/state';

async function planNameMap(ids: string[]) {
  const unique = Array.from(
    new Set(ids.filter((id) => id && mongoose.isValidObjectId(id)))
  );
  if (unique.length === 0) return new Map<string, string>();
  const docs = await Plan.find({ _id: { $in: unique } })
    .select({ name: 1 })
    .lean();
  const map = new Map<string, string>();
  for (const d of docs) map.set(String(d._id), d.name);
  return map;
}

export async function GET(request: Request) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const q = (searchParams.get('q') || '').trim();
    const stateFilter = (searchParams.get('state') || 'all').trim();

    const filter: Record<string, unknown> = {};
    if (!includeArchived && stateFilter !== 'archived') {
      filter.status = { $ne: 'archived' };
    }
    if (stateFilter === 'archived') {
      filter.status = 'archived';
    } else if (stateFilter === 'paused') {
      filter.status = 'paused';
    } else if (stateFilter === 'active') {
      filter.status = 'active';
    }

    if (q) {
      filter.code = {
        $regex: normalizeCouponCode(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    }

    const docs = await Coupon.find(filter).sort({ createdAt: -1 }).lean();
    const ids = docs.map((d) => String(d._id));
    const usedMap = await countRedemptionsByCouponIds(ids);
    const names = await planNameMap(docs.map((d) => d.planId || ''));
    const now = new Date();

    let coupons = docs.map((d) =>
      serializeAdminCoupon(
        d as unknown as Parameters<typeof serializeAdminCoupon>[0],
        usedMap.get(String(d._id)) ?? 0,
        d.planId ? names.get(d.planId) ?? null : null,
        now
      )
    );

    const computedStates: CouponComputedState[] = [
      'scheduled',
      'expired',
      'used up',
      'active',
      'paused',
      'archived',
    ];
    if (
      stateFilter !== 'all' &&
      computedStates.includes(stateFilter as CouponComputedState)
    ) {
      coupons = coupons.filter((c) => c.state === stateFilter);
    }

    return NextResponse.json({ coupons });
  } catch (err) {
    console.error('[coupons GET]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function POST(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const body = await request.json().catch(() => null);
    const parsed = couponWriteSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Invalid input';
      return badRequest(msg);
    }

    const data = parsed.data;
    if (data.status === 'archived') {
      return badRequest('Create as active or paused first');
    }

    const businessErr = await assertCouponBusinessRules(data, { usedCount: 0 });
    if (businessErr) return badRequest(businessErr);

    const code = normalizeCouponCode(data.code);
    const currency = data.discountType === 'percent' ? '' : data.currency || '';

    if (data.isPopupCoupon) {
      await Coupon.updateMany(
        { isPopupCoupon: true },
        {
          $set: { isPopupCoupon: false, updatedBy: gate.admin.sub },
          $inc: { version: 1 },
        }
      );
    }

    const doc = await Coupon.create({
      code,
      note: data.note ?? '',
      discountType: data.discountType,
      discountValue: data.discountValue,
      currency,
      planId: data.planId ?? '',
      startsAt: parseCouponStart(data.startsAt),
      endsAt: parseCouponEnd(data.endsAt),
      usageLimit: data.usageLimit ?? null,
      perEmailLimit: data.perEmailLimit ?? 1,
      status: data.status === 'paused' ? 'paused' : 'active',
      isPopupCoupon: Boolean(data.isPopupCoupon),
      version: 1,
      createdBy: gate.admin.sub,
      updatedBy: gate.admin.sub,
    });

    await logAudit({
      adminId: gate.admin.sub,
      action: 'coupon.create',
      entity: 'coupon',
      entityId: String(doc._id),
      meta: { code: doc.code, status: doc.status, isPopupCoupon: doc.isPopupCoupon },
    });

    const planName = doc.planId
      ? (await Plan.findById(doc.planId).select({ name: 1 }).lean())?.name ?? null
      : null;

    return NextResponse.json(
      { coupon: serializeAdminCoupon(doc, 0, planName) },
      { status: 201 }
    );
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
    console.error('[coupons POST]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
