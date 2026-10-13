import { z } from 'zod';
import { hasHtmlTags } from '@/lib/content/plainText';

const nameField = z
  .string()
  .trim()
  .min(1, 'Enter a name')
  .max(120, 'Name must be at most 120 characters')
  .refine((v) => !hasHtmlTags(v), {
    message: 'Name must be plain text — remove any HTML tags',
  });

const altField = z
  .string()
  .trim()
  .max(160, 'Alt text must be at most 160 characters')
  .refine((v) => !hasHtmlTags(v), {
    message: 'Alt text must be plain text — remove any HTML tags',
  });

export const mediaPatchFieldsSchema = z.object({
  name: nameField.optional(),
  altText: altField.optional(),
  version: z.number().int().positive(),
});

export const mediaPatchSchema = mediaPatchFieldsSchema.refine(
  (d) => d.name !== undefined || d.altText !== undefined,
  { message: 'Nothing to update' }
);
