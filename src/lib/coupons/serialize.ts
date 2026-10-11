import type { CouponDocument } from '@/models/Coupon';
import { formatMoneyLabel } from '@/lib/plans/money';
import { formatCouponDay, toLocalDateString } from './dates';
import {
  computeCouponState,
  type CouponComputedState,
  type CouponStoredStatus,
} from './state';

export type AdminCouponDTO = {
  id: string;
  code: string;
  note: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency: 'PKR' | 'USD' | '';
  planId: string;
  planName: string | null;
  startsAt: string | null;
  startsAtLocal: string;
  endsAt: string | null;
  endsAtLocal: string;
  endsLabel: string;
  usageLimit: number | null;
  perEmailLimit: number;
  status: CouponStoredStatus;
  state: CouponComputedState;
  usedCount: number;
  isPopupCoupon: boolean;
  version: number;
  discountLabel: string;
  appliesToLabel: string;
  usedLabel: string;
  createdAt: string | null;
  updatedAt: string | null;
};

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function discountLabelFor(
  discountType: 'percent' | 'fixed',
  discountValue: number,
  currency: string
): string {
  if (discountType === 'percent') return `${discountValue}% off`;
  return `${formatMoneyLabel(currency || 'PKR', discountValue)} off`;
}

export function serializeAdminCoupon(
  doc: CouponDocument,
  usedCount: number,
  planName: string | null = null,
  now = new Date()
): AdminCouponDTO {
  const startsAt = asDate(doc.startsAt);
  const endsAt = asDate(doc.endsAt);
  const status = doc.status as CouponStoredStatus;
  const usageLimit =
    doc.usageLimit == null || doc.usageLimit === undefined
      ? null
      : Number(doc.usageLimit);
  const state = computeCouponState({
    status,
    startsAt,
    endsAt,
    usageLimit,
    usedCount,
    now,
  });
  const discountType = doc.discountType as 'percent' | 'fixed';
  const currency = (doc.currency || '') as 'PKR' | 'USD' | '';

  return {
    id: String(doc._id),
    code: String(doc.code || '').toUpperCase(),
    note: doc.note ?? '',
    discountType,
    discountValue: Number(doc.discountValue),
    currency,
    planId: doc.planId ?? '',
    planName,
    startsAt: startsAt ? startsAt.toISOString() : null,
    startsAtLocal: toLocalDateString(startsAt),
    endsAt: endsAt ? endsAt.toISOString() : null,
    endsAtLocal: toLocalDateString(endsAt),
    endsLabel: endsAt ? `Ends ${formatCouponDay(endsAt)}` : '',
    usageLimit,
    perEmailLimit: Math.max(1, Number(doc.perEmailLimit) || 1),
    status,
    state,
    usedCount,
    isPopupCoupon: Boolean(doc.isPopupCoupon),
    version: doc.version ?? 1,
    discountLabel: discountLabelFor(discountType, Number(doc.discountValue), currency),
    appliesToLabel: planName || 'All plans',
    usedLabel:
      usageLimit == null
        ? `${usedCount} / unlimited`
        : `${usedCount} / ${usageLimit}`,
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : null,
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : null,
  };
}
