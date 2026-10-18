import { z } from 'zod';
import { hasHtmlTags } from '@/lib/content/plainText';

export const publicFeedbackSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be at most 80 characters')
    .refine((v) => !hasHtmlTags(v), {
      message: 'Name must be plain text',
    }),
  role: z
    .string()
    .trim()
    .max(80, 'Role must be at most 80 characters')
    .refine((v) => !hasHtmlTags(v), {
      message: 'Role must be plain text',
    })
    .optional()
    .default(''),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Choose a rating from 1 to 5')
    .max(5, 'Choose a rating from 1 to 5'),
  quote: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters')
    .max(400, 'Feedback must be at most 400 characters')
    .refine((v) => !hasHtmlTags(v), {
      message: 'Feedback must be plain text',
    }),
  /** Honeypot — bots fill this; humans leave empty */
  website: z.string().max(200).optional().default(''),
});

export type PublicFeedbackInput = z.infer<typeof publicFeedbackSchema>;
