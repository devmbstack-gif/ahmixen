import { z } from 'zod';

export const rejectReasonSchema = z.enum([
  'Payment not received',
  'Amount does not match',
  'Screenshot is unclear',
  'Other',
]);

/** Plain fields for reject body. */
export const rejectFieldsSchema = z.object({
  reason: rejectReasonSchema,
  note: z.string().trim().max(500).optional().default(''),
});

export const rejectWriteSchema = rejectFieldsSchema.superRefine((data, ctx) => {
  if (data.reason === 'Other' && !data.note.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['note'],
      message: 'Add a short note when the reason is Other',
    });
  }
});

export const cancelFieldsSchema = z.object({
  note: z.string().trim().max(500).optional().default(''),
});

export const noteFieldsSchema = z.object({
  adminNote: z.string().trim().max(500),
});

export const notePatchSchema = noteFieldsSchema;
