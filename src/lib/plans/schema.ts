import { z } from 'zod';
import { assertActiveValidUntil } from './validate';

const featureSchema = z.string().trim().min(3).max(80);

/** Plain object fields only — safe for .partial() / .extend(). */
export const planFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  shortDescription: z.string().trim().max(240).optional().default(''),
  type: z.enum(['one_time', 'installment']),
  currency: z.enum(['PKR', 'USD']),
  price: z.number().int().min(1, 'Price must be at least 1'),
  originalPrice: z.number().int().min(1).nullable().optional(),
  installmentsCount: z.number().int().min(2).max(12).nullable().optional(),
  features: z.array(featureSchema).max(8).optional().default([]),
  sessionId: z.string().trim().max(64).optional().default(''),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  status: z.enum(['active', 'hidden', 'archived']).optional().default('hidden'),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
});

/** Full create/write validation including cross-field rules. */
export const planWriteSchema = planFieldsSchema.superRefine((data, ctx) => {
  if (
    data.originalPrice != null &&
    Number.isFinite(data.originalPrice) &&
    data.originalPrice <= data.price
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['originalPrice'],
      message: 'Original price must be greater than the current price',
    });
  }
  if (data.type === 'installment') {
    if (data.installmentsCount == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['installmentsCount'],
        message: 'Choose how many installments (2 to 12)',
      });
    }
  }
  const validErr = assertActiveValidUntil(
    data.status ?? 'hidden',
    data.validUntil ?? null
  );
  if (validErr) {
    ctx.addIssue({
      code: 'custom',
      path: ['validUntil'],
      message: validErr,
    });
  }
});

/** Partial updates — no refinements (Zod forbids .partial() on refined schemas). */
export const planPatchSchema = planFieldsSchema.partial().extend({
  version: z.number().int().min(1),
});

export const planStatusSchema = z.object({
  status: z.enum(['active', 'hidden']),
  version: z.number().int().min(1),
});
