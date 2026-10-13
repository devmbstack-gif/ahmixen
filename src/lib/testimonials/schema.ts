import { z } from 'zod';
import { hasHtmlTags } from '@/lib/content/plainText';

const nameField = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be at most 80 characters')
  .refine((v) => !hasHtmlTags(v), {
    message: 'Name must be plain text — remove any HTML tags',
  });

const roleField = z
  .string()
  .trim()
  .max(80, 'Role must be at most 80 characters')
  .refine((v) => !hasHtmlTags(v), {
    message: 'Role must be plain text — remove any HTML tags',
  });

const quoteField = z
  .string()
  .trim()
  .min(10, 'Quote must be at least 10 characters')
  .max(400, 'Quote must be at most 400 characters')
  .refine((v) => !hasHtmlTags(v), {
    message: 'Quote must be plain text — remove any HTML tags',
  });

const ratingField = z
  .number()
  .int()
  .min(1)
  .max(5)
  .nullable()
  .optional();

const avatarField = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine((v) => v == null || v === '' || /^[a-f\d]{24}$/i.test(v), {
    message: 'Choose a valid photo from the media library',
  });

export const testimonialWriteFieldsSchema = z.object({
  name: nameField,
  role: roleField.default(''),
  quote: quoteField,
  rating: ratingField,
  avatarAssetId: avatarField,
  visible: z.boolean().default(true),
});

export const testimonialWriteSchema = testimonialWriteFieldsSchema;

export const testimonialPatchFieldsSchema = z.object({
  name: nameField.optional(),
  role: roleField.optional(),
  quote: quoteField.optional(),
  rating: ratingField,
  avatarAssetId: avatarField,
  visible: z.boolean().optional(),
  version: z.number().int().positive(),
});

export const testimonialPatchSchema = testimonialPatchFieldsSchema;

export const testimonialVisibilitySchema = z.object({
  visible: z.boolean(),
  version: z.number().int().positive(),
});

export const testimonialReorderSchema = z.object({
  orderedIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1),
});
