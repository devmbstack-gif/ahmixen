import { z } from 'zod';
import { normalizePhone, PHONE_ERROR } from './phone';

const noHtml = (value: string) => !/[<>]/.test(value);

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your full name')
  .max(80, 'Name is too long')
  .refine(noHtml, { message: 'Name cannot include HTML tags' });

export const emailSchema = z
  .string()
  .trim()
  .max(120, 'Email is too long')
  .email('Enter a valid email address')
  .transform((v) => v.toLowerCase());

export const phoneSchema = z
  .string()
  .trim()
  .min(1, PHONE_ERROR)
  .transform((v, ctx) => {
    try {
      return normalizePhone(v);
    } catch {
      ctx.addIssue({ code: 'custom', message: PHONE_ERROR });
      return z.NEVER;
    }
  });

export const professionSchema = z
  .string()
  .trim()
  .max(80, 'Profession is too long')
  .optional()
  .default('');

export const messageSchema = z
  .string()
  .trim()
  .max(200, 'Message is too long')
  .optional()
  .default('');

const utmField = z.string().trim().max(100).optional().default('');

export const utmSchema = z
  .object({
    source: utmField,
    medium: utmField,
    campaign: utmField,
    content: utmField,
    term: utmField,
  })
  .partial()
  .optional()
  .default({})
  .transform((v) => ({
    source: (v?.source || '').slice(0, 100),
    medium: (v?.medium || '').slice(0, 100),
    campaign: (v?.campaign || '').slice(0, 100),
    content: (v?.content || '').slice(0, 100),
    term: (v?.term || '').slice(0, 100),
  }));

/** Plain fields for lead create — refinements live only on write schemas that need them. */
export const leadFieldsSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  profession: professionSchema,
  message: messageSchema,
  utm: utmSchema,
  referrer: z.string().trim().max(500).optional().default(''),
  website: z.string().optional().default(''),
});

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

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export const publicOrderFieldsSchema = z
  .object({
    planId: z.string().trim().min(1).max(64),
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    profession: professionSchema,
    sourceKind: z.enum(['checkout', 'workshop']).optional().default('checkout'),
    programId: z.string().trim().max(80).optional().default(''),
    programTitle: z.string().trim().max(120).optional().default(''),
    city: z.string().trim().max(80).optional().default(''),
    skillLevel: z.string().trim().max(40).optional().default(''),
    learningGoals: z
      .array(z.string().trim().max(40))
      .max(8)
      .optional()
      .default([]),
    utm: utmSchema,
    website: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.sourceKind !== 'workshop') return;

    if (data.profession.trim().length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['profession'],
        message: 'Enter your education or profession',
      });
    }
    if (data.city.trim().length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['city'],
        message: 'Enter your city',
      });
    }
    if (
      !SKILL_LEVELS.includes(data.skillLevel as (typeof SKILL_LEVELS)[number])
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['skillLevel'],
        message: 'Choose your AI skill level',
      });
    }
    const goals = data.learningGoals.filter(Boolean);
    if (goals.length < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['learningGoals'],
        message: 'Select at least one learning goal',
      });
    }
    for (const g of goals) {
      if (!LEARNING_GOALS.includes(g as (typeof LEARNING_GOALS)[number])) {
        ctx.addIssue({
          code: 'custom',
          path: ['learningGoals'],
          message: 'Choose a valid learning goal',
        });
        break;
      }
    }
  });
