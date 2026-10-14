import { z } from 'zod';
import {
  emailSchema,
  nameSchema,
  phoneSchema,
  professionSchema,
} from './schema';

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const LEARNING_GOALS = [
  'ai_automation',
  'monetize',
  'ai_agents',
  'n8n',
  'real_world',
  'business_problems',
  'content_research',
  'other',
] as const;

const noHtml = (value: string) => !/[<>]/.test(value);

export const workshopRegistrationFieldsSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  profession: professionSchema.refine((v) => v.trim().length >= 2, {
    message: 'Enter your education or profession',
  }),
  city: z
    .string()
    .trim()
    .min(2, 'Enter your city')
    .max(80, 'City is too long')
    .refine(noHtml, { message: 'City cannot include HTML tags' }),
  skillLevel: z.enum(SKILL_LEVELS, {
    message: 'Choose your AI skill level',
  }),
  learningGoals: z
    .array(z.enum(LEARNING_GOALS))
    .min(1, 'Select at least one learning goal')
    .max(8),
  paidConfirmed: z
    .boolean()
    .refine((v) => v === true, {
      message: 'Confirm that you have paid to continue',
    }),
  programId: z.string().trim().min(1).max(80),
  programTitle: z.string().trim().min(1).max(120),
  website: z.string().optional().default(''),
  referrer: z.string().trim().max(500).optional().default(''),
});

export type WorkshopRegistrationFields = z.infer<
  typeof workshopRegistrationFieldsSchema
>;
