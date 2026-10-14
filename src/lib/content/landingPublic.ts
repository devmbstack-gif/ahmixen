import { unstable_cache } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { SiteContent } from '@/models/SiteContent';
import { MediaAsset } from '@/models/MediaAsset';
import { mediaPublicUrl } from '@/lib/media/url';
import { CONTENT_TAGS } from './cache';
import {
  CONTENT_REGISTRY,
  type ContentKey,
} from './registry';
import {
  agendaDataSchema,
  aiJobsDataSchema,
  DEFAULT_HERO_TOOLS,
  heroDataSchema,
  introDataSchema,
  learnDataSchema,
  previewDataSchema,
  pricingDataSchema,
  programsDataSchema,
  programsStaticDefault,
  seoDataSchema,
  statsDataSchema,
  type AgendaContentData,
  type AiJobsContentData,
  type HeroContentData,
  type IntroContentData,
  type LearnContentData,
  type PreviewContentData,
  type PricingContentData,
  type ProgramsContentData,
  type SeoContentData,
  type StatsContentData,
} from './landingSchemas';
import { applyHeroDurationToken } from '@/lib/video';
import { getInstructor } from './public';
import { instructor as staticInstructor } from '@/data/instructor';
import {
  staticHeroToolBlend,
  staticHeroToolLogo,
  type HeroLogoBlend,
} from './heroToolLogos';

const LEGACY_HERO_TOOL_SETS = new Set([
  ['openclaw', 'claude-code', 'designer', 'n8n', 'antigravity'].join(','),
  // Previous default that still listed Cursor instead of Meta AI
  ['claude', 'openclaw', 'antigravity', 'cursor', 'n8n'].join(','),
]);

function resolveHeroTools(
  tools: HeroContentData['tools']
): HeroContentData['tools'] {
  if (!tools.length) return structuredClone(DEFAULT_HERO_TOOLS);
  const ids = tools.map((t) => t.id).join(',');
  if (LEGACY_HERO_TOOL_SETS.has(ids)) {
    return structuredClone(DEFAULT_HERO_TOOLS);
  }
  // Swap a lone Cursor tile to Meta AI without resetting other custom tools
  return tools.map((t) =>
    t.id === 'cursor' || t.id === 'cursor-ai'
      ? { ...t, id: 'meta-ai', name: 'Meta AI' }
      : t
  );
}

/** Overlay landing "trained" from CMS instructor "students trained". */
export function applyTrainedStatFromInstructor(
  stats: StatsContentData,
  instructorStats: Array<{ label: string; value: number; suffix: string }>
): StatsContentData {
  const isTrained = (label: string) =>
    label.trim().toLowerCase() === 'students trained';
  const linked =
    instructorStats.find((s) => isTrained(s.label)) ??
    staticInstructor.stats.find((s) => isTrained(s.label));
  if (!linked) return stats;
  return {
    items: stats.items.map((item) =>
      item.id === 'trained'
        ? { ...item, value: linked.value, suffix: linked.suffix }
        : item
    ),
  };
}

async function loadKey<T>(
  key: ContentKey,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }
): Promise<T | null> {
  try {
    await connectToDatabase();
    const doc = await SiteContent.findOne({ key }).lean();
    if (!doc) return null;
    const parsed = schema.safeParse(doc.data);
    if (!parsed.success) {
      console.error(`[content] invalid siteContent.${key}`);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.error(
      `[content ${key}]`,
      err instanceof Error ? err.message : 'db error'
    );
    return null;
  }
}

/** Uncached resolve: DB doc if valid, otherwise static default (also used when DB is down). */
export async function resolveContentKey<T>(
  key: ContentKey,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }
): Promise<T> {
  const fromDb = await loadKey(key, schema);
  if (fromDb) return fromDb;
  return CONTENT_REGISTRY[key].staticDefault as T;
}

function cachedLoader<T>(
  key: ContentKey,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } },
  tag: string
) {
  return unstable_cache(
    async () => resolveContentKey(key, schema),
    [`public-content-${key}`],
    { revalidate: 60, tags: [tag, CONTENT_TAGS.landing] }
  );
}

const loadIntro = cachedLoader<IntroContentData>(
  'intro',
  introDataSchema,
  CONTENT_TAGS.intro
);
const loadHero = cachedLoader<HeroContentData>(
  'hero',
  heroDataSchema,
  CONTENT_TAGS.hero
);
const loadPreview = cachedLoader<PreviewContentData>(
  'preview',
  previewDataSchema,
  CONTENT_TAGS.preview
);
const loadLearn = cachedLoader<LearnContentData>(
  'learn',
  learnDataSchema,
  CONTENT_TAGS.learn
);
const loadAiJobs = cachedLoader<AiJobsContentData>(
  'aiJobs',
  aiJobsDataSchema,
  CONTENT_TAGS.aiJobs
);
const loadAgenda = cachedLoader<AgendaContentData>(
  'agenda',
  agendaDataSchema,
  CONTENT_TAGS.agenda
);
const loadStats = cachedLoader<StatsContentData>(
  'stats',
  statsDataSchema,
  CONTENT_TAGS.stats
);
const loadPricing = cachedLoader<PricingContentData>(
  'pricing',
  pricingDataSchema,
  CONTENT_TAGS.pricing
);
const loadPrograms = cachedLoader<ProgramsContentData>(
  'programs',
  programsDataSchema,
  CONTENT_TAGS.programs
);
const loadSeo = cachedLoader<SeoContentData>(
  'seo',
  seoDataSchema,
  CONTENT_TAGS.seo
);

export async function getIntroContent(): Promise<
  IntroContentData & { photoUrl: string; photoAlt: string }
> {
  const data = await loadIntro();
  const instructor = await getInstructor();
  let photoUrl = '/pic 4.jpeg';
  let photoAlt = instructor.name || staticInstructor.name;

  if (data.photoAssetId) {
    try {
      await connectToDatabase();
      const asset = await MediaAsset.findById(data.photoAssetId).lean();
      if (asset) {
        const url = mediaPublicUrl({
          kind: asset.kind,
          fileId: asset.fileId,
          staticPath: asset.staticPath,
          id: String(asset._id),
        });
        if (url) {
          photoUrl = url;
          photoAlt = asset.altText?.trim() || photoAlt;
        }
      }
    } catch (err) {
      console.error(
        '[intro photo]',
        err instanceof Error ? err.message : 'error'
      );
    }
  }

  return { ...data, photoUrl, photoAlt };
}

export type HeroToolPublic = HeroContentData['tools'][number] & {
  logoUrl: string | null;
  logoBlend: HeroLogoBlend;
};

export async function getHeroContent(
  durationMinutes?: number | null
): Promise<
  Omit<HeroContentData, 'tools'> & {
    headlineLine1Resolved: string;
    tools: HeroToolPublic[];
  }
> {
  const data = await loadHero();
  const tools = resolveHeroTools(data.tools ?? []);
  const logoIds = tools
    .map((t) => t.logoAssetId)
    .filter((id): id is string => Boolean(id));

  const urlById = new Map<string, string>();
  if (logoIds.length > 0) {
    try {
      await connectToDatabase();
      const assets = await MediaAsset.find({
        _id: { $in: logoIds },
      }).lean();
      for (const asset of assets) {
        const url = mediaPublicUrl({
          kind: asset.kind,
          fileId: asset.fileId,
          staticPath: asset.staticPath,
          id: String(asset._id),
        });
        if (url) urlById.set(String(asset._id), url);
      }
    } catch (err) {
      console.error(
        '[hero tools logos]',
        err instanceof Error ? err.message : 'error'
      );
    }
  }

  return {
    ...data,
    headlineLine1Resolved: applyHeroDurationToken(
      data.headlineLine1,
      durationMinutes
    ),
    tools: tools.map((t) => {
      const uploaded = t.logoAssetId
        ? urlById.get(t.logoAssetId) ?? null
        : null;
      return {
        ...t,
        logoUrl: uploaded ?? staticHeroToolLogo(t.id),
        // CMS uploads are assumed transparent; static assets declare a blend.
        logoBlend: uploaded ? 'normal' : staticHeroToolBlend(t.id),
      };
    }),
  };
}

export async function getPreviewContent(): Promise<
  PreviewContentData & { posterUrl: string | null }
> {
  const data = await loadPreview();
  let posterUrl: string | null = null;
  if (data.posterAssetId) {
    try {
      await connectToDatabase();
      const asset = await MediaAsset.findById(data.posterAssetId).lean();
      if (asset) {
        posterUrl = mediaPublicUrl({
          kind: asset.kind,
          fileId: asset.fileId,
          staticPath: asset.staticPath,
          id: String(asset._id),
        });
      }
    } catch (err) {
      console.error(
        '[preview poster]',
        err instanceof Error ? err.message : 'error'
      );
    }
  }
  // Static fallback from /public (CMS posterAssetId wins when set).
  if (!posterUrl) {
    posterUrl = '/intro-video-thumbnail.jpeg';
  }
  return { ...data, videoUrl: '/intro-video.mp4', posterUrl };
}

export async function getLearnContent(): Promise<LearnContentData> {
  return loadLearn();
}

export async function getAiJobsContent(): Promise<AiJobsContentData> {
  return loadAiJobs();
}

export async function getAgendaContent(): Promise<AgendaContentData> {
  return loadAgenda();
}

export async function getStatsContent(): Promise<StatsContentData> {
  const [stats, instructor] = await Promise.all([loadStats(), getInstructor()]);
  return applyTrainedStatFromInstructor(stats, instructor.stats);
}

export async function getPricingContent(): Promise<PricingContentData> {
  return loadPricing();
}

export type ProgramCardPublic = ProgramsContentData['cards'][number] & {
  posterUrl: string;
  priceLabel: string;
  originalPriceLabel: string | null;
  status: 'open' | 'locked';
};

const LEGACY_PROGRAM_ID_SETS = new Set([
  'course-1,course-2,course-3',
  'ai-automation-live,course-1,course-2,course-3',
]);

function resolveProgramCards(
  cards: ProgramsContentData['cards']
): ProgramsContentData['cards'] {
  if (!cards.length) {
    return structuredClone(programsStaticDefault.cards);
  }
  const ids = cards.map((c) => c.id).join(',');
  const hasRetiredFourth = cards.some(
    (c) =>
      c.id === 'course-3' ||
      /xen ai batch|stop!\s*why you need/i.test(c.title)
  );
  if (LEGACY_PROGRAM_ID_SETS.has(ids) || hasRetiredFourth || cards.length > 3) {
    return structuredClone(programsStaticDefault.cards);
  }
  return cards.map((c) => {
    const locked = c.status !== 'open';
    return {
      ...c,
      instructorLine: /hafiz ahmad ali/i.test(c.instructorLine)
        ? 'Ahmi'
        : c.instructorLine || 'Ahmi',
      status: locked ? 'locked' : 'open',
      // Locked workshops hide price until they open
      priceLabel: locked
        ? ''
        : c.priceLabel?.trim() || 'Rs 500',
    };
  });
}

export async function getProgramsContent(): Promise<{
  cards: ProgramCardPublic[];
}> {
  const data = await loadPrograms();
  const sourceCards = resolveProgramCards(data.cards);

  const cards: ProgramCardPublic[] = [];
  for (const card of sourceCards) {
    let posterUrl = card.image || '/course1.jpeg';
    if (card.posterAssetId) {
      try {
        await connectToDatabase();
        const asset = await MediaAsset.findById(card.posterAssetId).lean();
        if (asset) {
          posterUrl =
            mediaPublicUrl({
              kind: asset.kind,
              fileId: asset.fileId,
              staticPath: asset.staticPath,
              id: String(asset._id),
            }) || posterUrl;
        }
      } catch {
        /* keep fallback */
      }
    }
    const locked = card.status !== 'open';
    const fromStatic =
      programsStaticDefault.cards.find((c) => c.id === card.id)?.priceLabel ||
      '';
    cards.push({
      ...card,
      posterUrl,
      priceLabel: locked ? '' : card.priceLabel || fromStatic || 'Rs 500',
      originalPriceLabel: null,
      status: locked ? 'locked' : 'open',
    });
  }

  return { cards };
}

export async function getSeoContent(): Promise<SeoContentData> {
  return loadSeo();
}
