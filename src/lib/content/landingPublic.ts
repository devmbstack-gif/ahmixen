import { unstable_cache } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { SiteContent } from '@/models/SiteContent';
import { MediaAsset } from '@/models/MediaAsset';
import { Plan } from '@/models/Plan';
import { mediaPublicUrl } from '@/lib/media/url';
import { CONTENT_TAGS } from './cache';
import {
  CONTENT_REGISTRY,
  type ContentKey,
} from './registry';
import {
  agendaDataSchema,
  aiJobsDataSchema,
  heroDataSchema,
  introDataSchema,
  learnDataSchema,
  previewDataSchema,
  programsDataSchema,
  seoDataSchema,
  statsDataSchema,
  type AgendaContentData,
  type AiJobsContentData,
  type HeroContentData,
  type IntroContentData,
  type LearnContentData,
  type PreviewContentData,
  type ProgramsContentData,
  type SeoContentData,
  type StatsContentData,
} from './landingSchemas';
import { applyHeroDurationToken } from '@/lib/video';
import { getInstructor } from './public';
import { instructor as staticInstructor } from '@/data/instructor';

/** Overlay landing "trained" from CMS instructor "students trained". */
export function applyTrainedStatFromInstructor(
  stats: StatsContentData,
  instructorStats: Array<{ label: string; value: number; suffix: string }>
): StatsContentData {
  const linked =
    instructorStats.find((s) => s.label === 'students trained') ??
    staticInstructor.stats.find((s) => s.label === 'students trained');
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

export async function getHeroContent(
  durationMinutes?: number | null
): Promise<HeroContentData & { headlineLine1Resolved: string }> {
  const data = await loadHero();
  return {
    ...data,
    headlineLine1Resolved: applyHeroDurationToken(
      data.headlineLine1,
      durationMinutes
    ),
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

export type ProgramCardPublic = ProgramsContentData['cards'][number] & {
  posterUrl: string;
  priceLabel: string;
  originalPriceLabel: string | null;
};

export async function getProgramsContent(): Promise<{
  cards: ProgramCardPublic[];
}> {
  const data = await loadPrograms();
  let priceLabel = '$29';
  let originalPriceLabel: string | null = null;

  try {
    await connectToDatabase();
    const plans = await Plan.find({
      status: 'active',
      type: 'one_time',
    })
      .sort({ price: 1 })
      .limit(1)
      .lean();
    const cheapest = plans[0];
    if (cheapest) {
      const currency = cheapest.currency === 'PKR' ? 'Rs' : '$';
      priceLabel = `${currency}${cheapest.price}`;
      if (
        cheapest.originalPrice != null &&
        cheapest.originalPrice > cheapest.price
      ) {
        originalPriceLabel = `${currency}${cheapest.originalPrice}`;
      }
    }
  } catch (err) {
    console.error(
      '[programs price]',
      err instanceof Error ? err.message : 'error'
    );
  }

  const cards: ProgramCardPublic[] = [];
  for (const card of data.cards) {
    let posterUrl = card.image || '/course1.jpeg';
    if (card.posterAssetId) {
      try {
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
    cards.push({
      ...card,
      posterUrl,
      priceLabel,
      originalPriceLabel,
    });
  }

  return { cards };
}

export async function getSeoContent(): Promise<SeoContentData> {
  return loadSeo();
}
