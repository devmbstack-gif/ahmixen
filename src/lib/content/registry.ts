import { z } from 'zod';
import { instructor as staticInstructor } from '@/data/instructor';
import { MISSION as staticMission } from '@/data/mission';
import { hasHtmlTags } from './plainText';
import { isHttpsUrl, isInstagramUrl, isLinkedInUrl } from './urls';
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
  label: plain(40, 1, 'Stat label'),
  visible: z.boolean(),
});

const instructorDataFields = z.object({
  name: plain(80, 2, 'Name'),
  title: plain(120, 2, 'Title'),
  bio: plain(800, 10, 'Bio'),
  shortBio: plain(400, 10, 'Short bio'),
  chip: plain(80, 1, 'Chip'),
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
    description: 'Live session headline, countdown, seats and Reserve CTA',
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

/** Landing admin index order (excludes instructor/mission). */
export const LANDING_CONTENT_KEYS: ContentKey[] = [
  'intro',
  'hero',
  'preview',
  'learn',
  'aiJobs',
  'agenda',
  'stats',
  'programs',
  'seo',
];

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
  programsDataSchema,
  seoDataSchema,
};
