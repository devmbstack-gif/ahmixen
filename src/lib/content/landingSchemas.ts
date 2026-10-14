import { z } from 'zod';
import {
  BENTO_FEATURES,
  LANDING_STATS,
  WORKSHOP_AGENDA,
  WORKSHOP_CONFIG,
} from '@/data/workshopData';
import { PROGRAMS } from '@/data/programs';
import { PROOF_ITEMS } from '@/data/proofItems';
import { hasHtmlTags } from './plainText';
import { isHttpsUrl } from './urls';
import { getVideoSource } from '@/lib/video';

export const plain = (max: number, min = 0, label = 'Text') =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine((v) => !hasHtmlTags(v), {
      message: `${label} must be plain text — remove any HTML tags`,
    });

const objectIdOrNull = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine((v) => v == null || v === '' || /^[a-f\d]{24}$/i.test(v), {
    message: 'Choose a valid image from the media library',
  });

/** Only {duration} curly-brace token is allowed. */
function onlyDurationToken(value: string): boolean {
  const tokens = value.match(/\{[^}]*\}/g) || [];
  return tokens.every((t) => t === '{duration}');
}

const heroToolFields = z.object({
  id: plain(40, 1, 'Id'),
  name: plain(40, 1, 'Name'),
  logoAssetId: objectIdOrNull,
});

export const DEFAULT_HERO_TOOLS = [
  { id: 'claude', name: 'Claude AI', logoAssetId: null as string | null },
  { id: 'openclaw', name: 'OpenClaw', logoAssetId: null as string | null },
  { id: 'antigravity', name: 'AntiGravity', logoAssetId: null as string | null },
  { id: 'meta-ai', name: 'Meta AI', logoAssetId: null as string | null },
  { id: 'n8n', name: 'n8n', logoAssetId: null as string | null },
];

const heroFields = z.object({
  /** Soft intro / hook above the main title (Aaghaz-style top line). */
  headlineLine1: plain(140, 1, 'Top line 1').refine(onlyDurationToken, {
    message: 'Only the {duration} placeholder is allowed in curly braces',
  }),
  headlineLine2: plain(80, 0, 'Top line 2'),
  /** Large display title under the soft intro. */
  mainHeadlineLine1: plain(60, 1, 'Main headline 1').default(
    'BECOME A CERTIFIED AI'
  ),
  mainHeadlineLine2: plain(60, 1, 'Main headline 2').default('EXPERT IN 90 DAYS'),
  /** Description under the main title (was badge callout). */
  badgeText: plain(220, 1, 'Subtext'),
  badgeSuffix: plain(80, 0, 'Subtext suffix').default(''),
  primaryCtaLabel: plain(30, 1, 'Primary button label'),
  secondaryLinkLabel: plain(30, 1, 'Secondary link label'),
  toolsTitle: plain(40, 1, 'Tools title').default("Tools you'll master"),
  tools: z
    .array(heroToolFields)
    .min(1, 'Add at least one tool')
    .max(8, 'At most 8 tools')
    .default(DEFAULT_HERO_TOOLS),
});

export const heroDataSchema = heroFields;

const introFields = z.object({
  badge: plain(40, 1, 'Badge'),
  headlineAccent: plain(30, 1, 'Headline accent'),
  headlineMain: plain(40, 1, 'Headline main'),
  subtext: plain(200, 1, 'Subtext'),
  primaryCtaLabel: plain(30, 1, 'Primary button label'),
  secondaryCtaLabel: plain(30, 1, 'Secondary button label'),
  photoAssetId: objectIdOrNull,
});

export const introDataSchema = introFields;

const previewFields = z.object({
  heading: plain(60, 1, 'Heading'),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .default('')
    .refine((v) => v === '' || Boolean(getVideoSource(v)), {
      message: 'Use a YouTube/Vimeo https link or an .mp4/.webm path',
    }),
  posterAssetId: objectIdOrNull,
});

export const previewDataSchema = previewFields;

const LEARN_IDS = [
  'fundamentals',
  'agents',
  'automation',
  'building',
  'live-qa',
  'certificate',
] as const;

const learnItemFields = z
  .object({
    id: z.enum(LEARN_IDS),
    title: plain(40, 1, 'Title'),
    description: plain(120, 1, 'Description'),
  })
  .strict();

const learnFields = z.object({
  eyebrow: plain(30, 1, 'Eyebrow'),
  heading: plain(80, 1, 'Heading'),
  items: z
    .array(learnItemFields)
    .length(6, 'Keep all 6 learn topics')
    .refine(
      (items) => {
        const ids = items.map((i) => i.id);
        return LEARN_IDS.every((id, index) => ids[index] === id);
      },
      { message: 'Learn topics must stay in the fixed order' }
    ),
});

export const learnDataSchema = learnFields;

const aiJobsItemFields = z.object({
  publisher: plain(60, 1, 'Publisher'),
  number: z.number().finite('Enter a number'),
  prefix: plain(10, 0, 'Prefix'),
  suffix: plain(10, 0, 'Suffix'),
  headline: plain(120, 1, 'Headline'),
  url: z
    .string()
    .trim()
    .refine(isHttpsUrl, { message: 'Source URL must start with https://' }),
});

const aiJobsFields = z.object({
  eyebrow: plain(40, 1, 'Eyebrow'),
  headingBefore: plain(60, 1, 'Heading'),
  headingAccent: plain(40, 1, 'Accent words'),
  items: z
    .array(aiJobsItemFields)
    .min(1, 'Add at least one statistic')
    .max(6, 'At most 6 statistics'),
});

export const aiJobsDataSchema = aiJobsFields;

const agendaItemFields = z.object({
  id: plain(40, 1, 'Id'),
  moduleNumber: plain(10, 1, 'Module number'),
  timeRange: plain(30, 1, 'Time range'),
  durationMin: plain(20, 1, 'Duration'),
  title: plain(60, 1, 'Title'),
  summary: plain(140, 1, 'Description'),
});

const agendaFields = z.object({
  heading: plain(60, 1, 'Heading'),
  comingSoon: z.boolean(),
  items: z
    .array(agendaItemFields)
    .min(1, 'Add at least one agenda item')
    .max(10, 'At most 10 agenda items'),
});

export const agendaDataSchema = agendaFields;

const statsItemFields = z.object({
  id: plain(40, 1, 'Id'),
  value: z.number().finite(),
  decimals: z.number().int().min(0).max(2).optional(),
  suffix: plain(10, 0, 'Suffix'),
  prefix: plain(10, 0, 'Prefix').optional(),
  label: plain(40, 1, 'Label'),
});

const statsFields = z.object({
  items: z
    .array(statsItemFields)
    .min(1, 'Add at least one stat')
    .max(6, 'At most 6 stats'),
});

export const statsDataSchema = statsFields;

function isValidProgramHref(value: string): boolean {
  const v = value.trim();
  if (!v || v.includes('\\')) return false;
  if (v.startsWith('https://')) return isHttpsUrl(v);
  if (v.startsWith('/') && !v.startsWith('//')) return true;
  return false;
}

const programCardFields = z.object({
  id: plain(40, 1, 'Id'),
  title: plain(80, 1, 'Title'),
  instructorLine: plain(60, 1, 'Instructor line'),
  badges: z.array(plain(30, 1, 'Badge')).min(1).max(4),
  posterAssetId: objectIdOrNull,
  /** Fallback static path when no media asset (seed) */
  image: z.string().trim().optional(),
  href: z
    .string()
    .trim()
    .refine(isValidProgramHref, {
      message:
        'Use an internal path like /#pricing or an https:// link',
    }),
  status: z.enum(['open', 'locked']).default('locked'),
  priceLabel: plain(40, 0, 'Price label').default(''),
});

const programsFields = z.object({
  cards: z
    .array(programCardFields)
    .min(1, 'Add at least one program card')
    .max(8, 'At most 8 program cards'),
});

export const programsDataSchema = programsFields;

const seoPageFields = z.object({
  title: plain(70, 1, 'Title'),
  description: plain(160, 1, 'Description'),
});

const seoFields = z.object({
  home: seoPageFields,
  programs: seoPageFields,
  'our-mission': seoPageFields,
  testimonials: seoPageFields,
});

export const seoDataSchema = seoFields;

export const heroStaticDefault = {
  headlineLine1:
    'AI Will Replace You In The Next 12 Months... Unless You Become The One Who Uses It',
  headlineLine2: '',
  mainHeadlineLine1: 'BECOME A CERTIFIED AI',
  mainHeadlineLine2: 'EXPERT IN 90 DAYS',
  badgeText:
    'Master the best AI tools, use them in real life, build real solutions and then we show you how to sell AI services to high paying businesses.',
  badgeSuffix: '',
  primaryCtaLabel: 'Reserve My Seat',
  secondaryLinkLabel: 'Watch preview',
  toolsTitle: "Tools you'll master",
  tools: structuredClone(DEFAULT_HERO_TOOLS),
};

/** Hero info cards — fixed on the site, not CMS-editable. */
export const HERO_INFO_CARDS = [
  { label: 'Program Format', value: WORKSHOP_CONFIG.deliveryFormat },
  { label: 'Program Length', value: WORKSHOP_CONFIG.durationLabel },
  { label: 'Topic', value: 'Practical AI' },
] as const;

export const introStaticDefault = {
  badge: 'AI and Agentic AI for youth',
  headlineAccent: 'Practical AI,',
  headlineMain: 'Taught in Plain Words',
  subtext:
    'Live, hands-on workshops with Hafiz Ahmad Ali for university students and young people. Learn AI and agentic AI step by step, and use it at work the same day.',
  primaryCtaLabel: 'Explore Our Programs',
  secondaryCtaLabel: 'Join Live Workshop',
  photoAssetId: null as string | null,
};

export const previewStaticDefault = {
  heading: 'Workshop Preview',
  videoUrl: '/intro-video.mp4',
  posterAssetId: null as string | null,
};

export const learnStaticDefault = {
  eyebrow: "What you'll learn",
  heading: 'Skills that stick — in one live session',
  items: BENTO_FEATURES.map((f) => ({
    id: f.id as (typeof LEARN_IDS)[number],
    title: f.title,
    description: f.description,
  })),
};

export const aiJobsStaticDefault = {
  eyebrow: 'The AI job shift',
  headingBefore: 'Jobs are moving to',
  headingAccent: 'AI-ready people',
  items: PROOF_ITEMS.map((p) => ({ ...p })),
};

export const agendaStaticDefault = {
  heading: 'Session Agenda',
  comingSoon: true,
  items: WORKSHOP_AGENDA.map((m) => ({ ...m })),
};

export const statsStaticDefault = {
  items: LANDING_STATS.map((s) => ({
    id: s.id,
    value: s.value,
    decimals: s.decimals,
    suffix: s.suffix,
    prefix: s.prefix,
    label: s.label,
  })),
};

const pricingFields = z.object({
  badge: plain(20, 1, 'Badge'),
  headingLine1: plain(40, 1, 'Heading line 1'),
  headingLine2: plain(40, 1, 'Heading line 2'),
  subtext: plain(120, 0, 'Subtext'),
});

export const pricingDataSchema = pricingFields;

export const pricingStaticDefault = {
  badge: 'PRICING',
  headingLine1: 'FEES STRUCTURE OF',
  headingLine2: 'AHMIXEN AI',
  subtext:
    'Takes about 2 minutes. You pay by JazzCash / Easypaisa on the next step.',
};

export const programsStaticDefault = {
  cards: PROGRAMS.map((p) => ({
    id: p.id,
    title: p.title,
    instructorLine: p.instructor,
    badges: [...p.badges],
    posterAssetId: null as string | null,
    image: p.image,
    href: p.href,
    status: p.status,
    priceLabel: p.price,
  })),
};

export const seoStaticDefault = {
  home: {
    title: 'AhmiXen — Live AI Masterclass & Autonomous Agents Workshop',
    description:
      "Join AhmiXen's intensive 2.5-hour live AI masterclass. Learn AI fundamentals, prompt patterns, autonomous agents, and vibe coding.",
  },
  programs: {
    title: 'Programs - AhmiXen',
    description:
      'Browse AhmiXen live AI workshop programs and reserve your seat.',
  },
  'our-mission': {
    title: 'Our Mission - AhmiXen',
    description:
      'We teach practical AI in plain words, so you can use it at work the same day.',
  },
  testimonials: {
    title: 'Testimonials - AhmiXen',
    description: 'What attendees say about the AhmiXen live AI workshop.',
  },
};

export type HeroContentData = z.infer<typeof heroDataSchema>;
export type IntroContentData = z.infer<typeof introDataSchema>;
export type PreviewContentData = z.infer<typeof previewDataSchema>;
export type LearnContentData = z.infer<typeof learnDataSchema>;
export type AiJobsContentData = z.infer<typeof aiJobsDataSchema>;
export type AgendaContentData = z.infer<typeof agendaDataSchema>;
export type StatsContentData = z.infer<typeof statsDataSchema>;
export type PricingContentData = z.infer<typeof pricingDataSchema>;
export type ProgramsContentData = z.infer<typeof programsDataSchema>;
export type SeoContentData = z.infer<typeof seoDataSchema>;
