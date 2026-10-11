import { z } from 'zod';
import { COUPON_CODE_REGEX, normalizeCouponCode } from './code';

const optionalDate = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date'),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === '' || v == null ? null : v));

/** Plain fields only — safe for .partial(). Never call .partial() on a refined schema. */
export const couponFieldsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20, 'Coupon code must be at most 20 characters')
    .transform(normalizeCouponCode)
    .refine((v) => COUPON_CODE_REGEX.test(v), {
      message: 'Use only letters, numbers, hyphens and underscores',
    }),
  note: z
    .string()
    .trim()
    .max(120, 'Note must be at most 120 characters')
    .optional()
    .default(''),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z
    .number()
    .int('Amount must be a whole number')
    .min(1, 'Amount must be at least 1'),
  currency: z.enum(['PKR', 'USD', '']).optional().default(''),
  planId: z.string().trim().max(64).optional().default(''),
  startsAt: optionalDate,
  endsAt: optionalDate,
  usageLimit: z
    .number()
    .int('Total uses must be a whole number')
    .min(1, 'Total uses must be at least 1')
    .nullable()
    .optional(),
  perEmailLimit: z
    .number()
    .int('Uses per email must be a whole number')
    .min(1, 'Uses per email must be at least 1')
    .optional()
    .default(1),
  status: z.enum(['active', 'paused', 'archived']).optional().default('active'),
  isPopupCoupon: z.boolean().optional().default(false),
});

function applyCouponCrossFieldRules(
  data: z.infer<typeof couponFieldsSchema>,
  ctx: z.RefinementCtx
) {
  if (data.discountType === 'percent') {
    if (data.discountValue < 1 || data.discountValue > 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['discountValue'],
        message: 'Percent must be between 1 and 100',
      });
    }
  } else {
    if (!data.currency || (data.currency !== 'PKR' && data.currency !== 'USD')) {
      ctx.addIssue({
        code: 'custom',
        path: ['currency'],
        message: 'Choose a currency for a fixed amount coupon',
      });
    }
  }

  if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
    ctx.addIssue({
      code: 'custom',
      path: ['endsAt'],
      message: 'End date must be after the start date',
    });
  }

  if (data.isPopupCoupon && data.status !== 'active') {
    ctx.addIssue({
      code: 'custom',
      path: ['isPopupCoupon'],
      message: 'Only an active coupon can be the popup coupon',
    });
  }
}

/** Full create/write validation including cross-field rules. */
export const couponWriteSchema = couponFieldsSchema.superRefine(
  applyCouponCrossFieldRules
);

/** Partial updates — no refinements (Zod forbids .partial() on refined schemas). */
export const couponPatchSchema = couponFieldsSchema.partial().extend({
  version: z.number().int().min(1),
});

export const couponStatusSchema = z.object({
  status: z.enum(['active', 'paused']),
  version: z.number().int().min(1),
});

export const couponPopupSchema = z.object({
  version: z.number().int().min(1),
});
