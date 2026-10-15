import { z } from 'zod';
import { instructor as staticInstructor } from '@/data/instructor';
import { MISSION as staticMission } from '@/data/mission';
import { hasHtmlTags } from './plainText';
import {
  isHttpsUrl,
  isInstagramUrl,
  isLinkedInUrl,
  isProofCardHref,
  type ProofPlatformHref,
} from './urls';
import {
  agendaDataSchema,
  agendaStaticDefault,
  aiJobsDataSchema,
  aiJobsStaticDefault,
  heroDataSchema,
  heroStaticDefault,
  introDataSchema,
  introStaticDefault,
  learnDataSchema,
  learnStaticDefault,
  previewDataSchema,
  previewStaticDefault,
  programsDataSchema,
  programsStaticDefault,
  seoDataSchema,
  seoStaticDefault,
  pricingDataSchema,
  pricingStaticDefault,
  statsDataSchema,
  statsStaticDefault,
} from './landingSchemas';

const plain = (max: number, min = 0, label = 'Text') =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine((v) => !hasHtmlTags(v), {
      message: `${label} must be plain text — remove any HTML tags`,
    });

const instructorStatFields = z.object({
  value: z.number().finite(),
  suffix: plain(10, 0, 'Suffix'),
  label: plain(60, 1, 'Stat label'),
  visible: z.boolean(),
  textOnly: z.boolean().optional().default(false),
});

const proofPlatformEnum = z.enum([
  'linkedin',
  'instagram',
  'youtube',
  'other',
]);

const instructorProofCardFields = z
  .object({
    imageAssetId: z
      .string()
      .trim()
      .refine((v) => /^[a-f\d]{24}$/i.test(v), {
        message: 'Choose a valid image from the media library',
      }),
    platform: proofPlatformEnum,
    href: z.string().trim().max(500),
    label: plain(60, 1, 'Card label'),
  })
  .superRefine((card, ctx) => {
    if (
      !isProofCardHref(card.platform as ProofPlatformHref, card.href)
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Link must be https and match the platform (linkedin.com, instagram.com, youtube.com / youtu.be)',
        path: ['href'],
      });
    }
  });

const instructorDataFields = z.object({
  name: plain(80, 2, 'Name'),
  greeting: plain(80, 1, 'Greeting').default(staticInstructor.greeting),
  greetingAccent: plain(20, 0, 'Greeting accent').default(
    staticInstructor.greetingAccent
  ),
  headlineSub: plain(200, 1, 'Tagline').default(staticInstructor.headlineSub),
  headlineAccent: plain(80, 0, 'Headline accent').default(
    staticInstructor.headlineAccent
  ),
  title: plain(120, 2, 'Title'),
  bio: plain(1600, 10, 'Bio'),
  shortBio: plain(400, 10, 'Short bio'),
  chip: plain(80, 1, 'Chip'),
  missionQuote: plain(800, 0, 'Quote').default(staticInstructor.missionQuote),
  differenceHeading: plain(80, 0, 'Difference heading').default(
    staticInstructor.differenceHeading
  ),
  differenceBody: plain(800, 0, 'Difference body').default(
    staticInstructor.differenceBody
  ),
  stats: z.array(instructorStatFields).max(6, 'At most 6 stats'),
  seminars: z.object({
    label: plain(40, 1, 'Seminars label'),
    places: z
      .array(plain(60, 1, 'Place'))
      .max(8, 'At most 8 seminar places'),
  }),
  linkedin: z
    .string()
    .trim()
    .refine(isLinkedInUrl, {
      message: 'LinkedIn must be an https:// link on linkedin.com',
    }),
  instagram: z
    .string()
    .trim()
    .refine(isInstagramUrl, {
      message: 'Instagram must be an https:// link on instagram.com',
    }),
  photo: z.string().trim().optional(),
  photoAssetId: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || /^[a-f\d]{24}$/i.test(v), {
      message: 'Choose a valid photo from the media library',
    }),
  proofCards: z
    .array(instructorProofCardFields)
    .max(6, 'At most 6 profile pictures')
    .default([]),
});

export const instructorDataSchema = instructorDataFields;

const missionDataFields = z.object({
  title: plain(40, 1, 'Title'),
  sub: plain(160, 1, 'Sub text'),
  accentLine: plain(80, 1, 'Accent line'),
  story: z.object({
    text: plain(300, 1, 'Story text'),
    link: z.object({
      label: plain(40, 1, 'Link label'),
      href: z
        .string()
        .trim()
        .refine(isHttpsUrl, {
          message: 'Link URL must start with https://',
        }),
    }),
  }),
});

export const missionDataSchema = missionDataFields;

export type ContentKey =
  | 'instructor'
  | 'mission'
  | 'intro'
  | 'hero'
  | 'preview'
  | 'learn'
  | 'aiJobs'
  | 'agenda'
  | 'stats'
  | 'pricing'
  | 'programs'
  | 'seo';

export type ContentRegistryEntry = {
  key: ContentKey;
  label: string;
  description: string;
  group: 'home' | 'programs' | 'all' | 'other';
  schema: z.ZodType<unknown>;
  staticDefault: unknown;
  publicAnchor?: string;
  publicPath?: string;
};

export const CONTENT_REGISTRY: Record<ContentKey, ContentRegistryEntry> = {
  instructor: {
    key: 'instructor',
    label: 'Instructor',
    description: 'Instructor profile (separate admin page)',
    group: 'other',
    schema: instructorDataSchema,
    staticDefault: {
      ...staticInstructor,
      photoAssetId: null,
    },
  },
  mission: {
    key: 'mission',
    label: 'Mission',
    description: 'Mission page copy (separate admin page)',
    group: 'other',
    schema: missionDataSchema,
    staticDefault: structuredClone(staticMission),
  },
  intro: {
    key: 'intro',
    label: 'Intro hero',
    description: 'The first section visitors see.',
    group: 'home',
    schema: introDataSchema,
    staticDefault: structuredClone(introStaticDefault),
    publicAnchor: '#intro',
    publicPath: '/',
  },
  hero: {
    key: 'hero',
    label: 'Workshop hero (live session)',
    description:
      'Top line, main headline, subtext, countdown, Reserve CTA and tools row',
    group: 'home',
    schema: heroDataSchema,
    staticDefault: structuredClone(heroStaticDefault),
    publicAnchor: '#hero',
    publicPath: '/',
  },
  preview: {
    key: 'preview',
    label: 'Workshop preview',
    description: 'Video teaser section under the hero',
    group: 'home',
    schema: previewDataSchema,
    staticDefault: structuredClone(previewStaticDefault),
    publicAnchor: '#preview',
    publicPath: '/',
  },
  learn: {
    key: 'learn',
    label: "What you'll learn",
    description: 'Skills tabs on the home page',
    group: 'home',
    schema: learnDataSchema,
    staticDefault: structuredClone(learnStaticDefault),
    publicAnchor: '#benefits',
    publicPath: '/',
  },
  aiJobs: {
    key: 'aiJobs',
    label: 'The AI job shift',
    description: 'Statistics cards about AI and jobs',
    group: 'home',
    schema: aiJobsDataSchema,
    staticDefault: structuredClone(aiJobsStaticDefault),
    publicAnchor: '#rise-ai-jobs',
    publicPath: '/',
  },
  agenda: {
    key: 'agenda',
    label: 'Session agenda',
    description: 'Workshop modules timeline',
    group: 'home',
    schema: agendaDataSchema,
    staticDefault: structuredClone(agendaStaticDefault),
    publicAnchor: '#agenda',
    publicPath: '/',
  },
  stats: {
    key: 'stats',
    label: 'Stats counters',
    description: 'Number strip under the preview',
    group: 'home',
    schema: statsDataSchema,
    staticDefault: structuredClone(statsStaticDefault),
    publicPath: '/',
  },
  pricing: {
    key: 'pricing',
    label: 'Mentorship section',
    description: 'Badge and heading above the mentorship / fees card',
    group: 'home',
    schema: pricingDataSchema,
    staticDefault: structuredClone(pricingStaticDefault),
    publicAnchor: '#pricing',
    publicPath: '/',
  },
  programs: {
    key: 'programs',
    label: 'Programs cards',
    description: 'Course cards on the Programs page',
    group: 'programs',
    schema: programsDataSchema,
    staticDefault: structuredClone(programsStaticDefault),
    publicPath: '/programs',
  },
  seo: {
    key: 'seo',
    label: 'Page titles & descriptions',
    description: 'Browser tab titles and search descriptions',
    group: 'all',
    schema: seoDataSchema,
    staticDefault: structuredClone(seoStaticDefault),
  },
};

/**
 * Landing admin index — primary sections shown first;
 * “more” stays available under a collapsed Advanced group.
 * (Excludes instructor/mission — separate admin pages.)
 */
export const PRIMARY_LANDING_CONTENT_KEYS: ContentKey[] = [
  'intro',
  'hero',
  'preview',
  'pricing',
  'seo',
];

export const MORE_LANDING_CONTENT_KEYS: ContentKey[] = [
  'learn',
  'aiJobs',
  'agenda',
  'stats',
  'programs',
];

/** Full landing list order (primary then more). */
export const LANDING_CONTENT_KEYS: ContentKey[] = [
  ...PRIMARY_LANDING_CONTENT_KEYS,
  ...MORE_LANDING_CONTENT_KEYS,
];

export function landingContentPriority(
  key: ContentKey
): 'primary' | 'more' | null {
  if ((PRIMARY_LANDING_CONTENT_KEYS as string[]).includes(key)) return 'primary';
  if ((MORE_LANDING_CONTENT_KEYS as string[]).includes(key)) return 'more';
  return null;
}

export function isContentKey(value: string): value is ContentKey {
  return value in CONTENT_REGISTRY;
}

export type InstructorContentData = z.infer<typeof instructorDataSchema>;
export type MissionContentData = z.infer<typeof missionDataSchema>;

export {
  introDataSchema,
  heroDataSchema,
  previewDataSchema,
  learnDataSchema,
  aiJobsDataSchema,
  agendaDataSchema,
  statsDataSchema,
  pricingDataSchema,
  programsDataSchema,
  seoDataSchema,
};
