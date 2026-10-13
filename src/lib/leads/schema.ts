import { z } from 'zod';

/** Writable status values (Converted is set only by order creation). */
export const leadWritableStatusSchema = z.enum(['new', 'contacted']);

const leadPatchFieldsSchema = z.object({
  status: leadWritableStatusSchema.optional(),
  adminNote: z
    .string()
    .max(500, 'Note must be 500 characters or fewer')
    .optional(),
  version: z.number().int().positive('Missing version — reload and try again'),
});

export const leadPatchSchema = leadPatchFieldsSchema;

export type LeadPatchInput = z.infer<typeof leadPatchSchema>;
