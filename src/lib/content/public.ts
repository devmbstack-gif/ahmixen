import { unstable_cache } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { Testimonial } from '@/models/Testimonial';
import { SiteContent } from '@/models/SiteContent';
import { MediaAsset } from '@/models/MediaAsset';
import {
  REVIEWS,
  getAllReviews as staticAllReviews,
  getLandingReviews as staticLandingReviews,
  LANDING_REVIEW_LIMIT,
  type Review,
} from '@/data/reviews';
import {
  instructor as staticInstructor,
  type Instructor,
} from '@/data/instructor';
import { MISSION as staticMission, type MissionContent } from '@/data/mission';
import { mediaPublicUrl } from '@/lib/media/url';
import {
  CONTENT_REGISTRY,
  instructorDataSchema,
  missionDataSchema,
  type InstructorContentData,
} from './registry';
import { CONTENT_TAGS } from './cache';

function reviewFromStatic(): Review[] {
  return staticAllReviews();
}

function mapDocToReview(
  doc: {
    _id: { toString(): string };
    name: string;
    role?: string;
    quote: string;
    rating?: number | null;
  },
  index: number,
  featuredId: string | null
): Review {
  const id = String(doc._id);
  return {
    id,
    name: doc.name,
    role: doc.role || '',
    text: doc.quote,
    // Design always shows stars; keep a number for existing UI.
    rating: doc.rating ?? 5,
    featured: featuredId ? id === featuredId : index === 0,
    status: 'approved',
  };
}

async function loadTestimonialsFromDb(): Promise<Review[] | null> {
  await connectToDatabase();
  const docs = await Testimonial.find({ visible: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  if (!docs.length) return null;
  const featuredId = String(docs[0]!._id);
  return docs.map((d, i) => mapDocToReview(d, i, featuredId));
}

async function resolveInstructorPhoto(
  data: InstructorContentData
): Promise<string> {
  if (data.photoAssetId) {
    const asset = await MediaAsset.findById(data.photoAssetId).lean();
    if (asset) {
      const url = mediaPublicUrl({
        kind: asset.kind,
        fileId: asset.fileId,
        staticPath: asset.staticPath,
        id: String(asset._id),
      });
      if (url) return url;
    }
  }
  if (data.photo && data.photo.trim()) return data.photo.trim();
  return staticInstructor.photo;
}

async function resolveProofCards(
  cards: InstructorContentData['proofCards']
): Promise<Instructor['proofCards']> {
  if (!cards?.length) return [];
  const ids = cards.map((c) => c.imageAssetId).filter(Boolean);
  if (ids.length === 0) return [];

  const assets = await MediaAsset.find({ _id: { $in: ids } }).lean();
  const urlById = new Map<string, string>();
  for (const asset of assets) {
    const url = mediaPublicUrl({
      kind: asset.kind,
      fileId: asset.fileId,
      staticPath: asset.staticPath,
      id: String(asset._id),
    });
    if (url) urlById.set(String(asset._id), url);
  }

  return cards
    .map((c) => {
      const imageUrl = urlById.get(c.imageAssetId);
      if (!imageUrl) return null;
      return {
        imageUrl,
        platform: c.platform,
        href: c.href,
        label: c.label,
      };
    })
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
}

async function loadInstructorFromDb(): Promise<Instructor | null> {
  await connectToDatabase();
  const doc = await SiteContent.findOne({ key: 'instructor' }).lean();
  if (!doc) return null;
  const parsed = instructorDataSchema.safeParse(doc.data);
  if (!parsed.success) {
    console.error('[getInstructor] invalid siteContent.instructor');
    return null;
  }
  const data = parsed.data;
  const [photo, proofCards] = await Promise.all([
    resolveInstructorPhoto(data),
    resolveProofCards(data.proofCards ?? []),
  ]);
  // Heal legacy CMS rows that still store older short copy.
  const legacyGreeting = new Set([
    "Hello I'm Ahmi.",
    "Hello I'm Ahmi",
    "HELLO I'm Ahmi",
    "HELLO I'm Ahmi.",
    "Hello I'm HAFIZ AHMAD ALI",
    "Hello I'm Hafiz Ahmad Ali",
    "HELLO I'm HAFIZ AHMAD ALI",
  ]);
  const legacyHeadline =
    'Trained 100+ students & delivered keynote AI seminars across universities';
  const legacyHeadlineUpper =
    'TRAINED 100+ STUDENTS & DELIVERED KEYNOTE AI SEMINARS ACROSS UNIVERSITIES';
  const legacyAccent = new Set([
    'TRAINED 100+ STUDENTS',
    'Trained 100+ students',
  ]);
  const legacyBioStartsWith =
    "Over the past 3+ years, I've been on a mission to empower youth";
  const legacyQuote =
    'We cannot win the race of AI without actively building with AI.';

  const greetingRaw = data.greeting.trim();
  const greeting = legacyGreeting.has(greetingRaw)
    ? staticInstructor.greeting
    : /HAFIZ AHMAD ALI|Hafiz Ahmad Ali/i.test(greetingRaw)
      ? greetingRaw
          .replace(/HAFIZ AHMAD ALI/gi, 'AHMI')
          .replace(/Hafiz Ahmad Ali/gi, 'Ahmi')
      : greetingRaw;
  const headlineSubRaw = data.headlineSub.trim();
  const headlineSub =
    headlineSubRaw.toLowerCase() === legacyHeadline.toLowerCase() ||
    headlineSubRaw === legacyHeadlineUpper
      ? staticInstructor.headlineSub
      : data.headlineSub;
  const bioRaw = data.bio.trim();
  const bioHealedName = bioRaw
    .replace(/^Hafiz Ahmad Ali\b/i, 'Ahmi')
    .replace(/\bHafiz Ahmad Ali\b/g, 'Ahmi');
  const bio =
    bioRaw.startsWith(legacyBioStartsWith) ||
    /^Hafiz Ahmad Ali teaches\b/i.test(bioRaw)
      ? staticInstructor.bio
      : bioHealedName;

  const differenceHeading =
    (data.differenceHeading && data.differenceHeading.trim()) ||
    staticInstructor.differenceHeading;
  const differenceBodyRaw =
    (data.differenceBody && data.differenceBody.trim()) ||
    data.missionQuote?.trim() ||
    '';
  const differenceBody =
    !differenceBodyRaw || differenceBodyRaw === legacyQuote
      ? staticInstructor.differenceBody
      : differenceBodyRaw;

  const headlineAccentRaw = data.headlineAccent?.trim() || '';
  const headlineAccent =
    !headlineAccentRaw || legacyAccent.has(headlineAccentRaw)
      ? staticInstructor.headlineAccent
      : headlineAccentRaw;

  const nameRaw = (data.name || '').trim();
  const name =
    !nameRaw || /hafiz ahmad ali/i.test(nameRaw)
      ? staticInstructor.name
      : nameRaw;
  const shortBio = (data.shortBio || '')
    .replace(/^Hafiz Ahmad Ali\b/i, 'Ahmi')
    .replace(/\bHafiz Ahmad Ali\b/g, 'Ahmi')
    .replace(/^He teaches AI and agentic AI/i, 'Ahmi teaches AI and agentic AI');

  return {
    name,
    greeting,
    greetingAccent:
      (data.greetingAccent && data.greetingAccent.trim()) ||
      staticInstructor.greetingAccent,
    headlineSub,
    headlineAccent,
    title: data.title,
    bio,
    shortBio: shortBio || staticInstructor.shortBio,
    chip: data.chip,
    missionQuote: differenceBody,
    differenceHeading,
    differenceBody,
    stats: data.stats,
    seminars: data.seminars,
    linkedin: data.linkedin,
    instagram: data.instagram,
    photo,
    proofCards,
  };
}

async function loadMissionFromDb(): Promise<MissionContent | null> {
  await connectToDatabase();
  const doc = await SiteContent.findOne({ key: 'mission' }).lean();
  if (!doc) return null;
  const parsed = missionDataSchema.safeParse(doc.data);
  if (!parsed.success) {
    console.error('[getMission] invalid siteContent.mission');
    return null;
  }
  return parsed.data;
}

const cachedTestimonials = unstable_cache(
  async () => {
    try {
      const fromDb = await loadTestimonialsFromDb();
      if (fromDb && fromDb.length > 0) return fromDb;
    } catch (err) {
      console.error(
        '[getTestimonials]',
        err instanceof Error ? err.message : 'db error'
      );
    }
    return reviewFromStatic();
  },
  ['public-testimonials'],
  { revalidate: 60, tags: [CONTENT_TAGS.testimonials] }
);

const cachedInstructor = unstable_cache(
  async () => {
    try {
      const fromDb = await loadInstructorFromDb();
      if (fromDb) return fromDb;
    } catch (err) {
      console.error(
        '[getInstructor]',
        err instanceof Error ? err.message : 'db error'
      );
    }
    return staticInstructor;
  },
  ['public-instructor'],
  { revalidate: 60, tags: [CONTENT_TAGS.instructor, CONTENT_TAGS.media] }
);

const cachedMission = unstable_cache(
  async () => {
    try {
      const fromDb = await loadMissionFromDb();
      if (fromDb) return fromDb;
    } catch (err) {
      console.error(
        '[getMission]',
        err instanceof Error ? err.message : 'db error'
      );
    }
    return staticMission;
  },
  ['public-mission'],
  { revalidate: 60, tags: [CONTENT_TAGS.mission] }
);

/** Visible testimonials ordered by sortOrder. Falls back to src/data/reviews.ts. */
export async function getTestimonials(): Promise<Review[]> {
  return cachedTestimonials();
}

/** Landing subset — same shape as getLandingReviews(). */
export async function getLandingTestimonials(): Promise<Review[]> {
  const all = await getTestimonials();
  if (all.length === 0) return staticLandingReviews();
  const featured = all.find((r) => r.featured) ?? all[0]!;
  const rest = all.filter((r) => r.id !== featured.id);
  return [featured, ...rest].slice(0, LANDING_REVIEW_LIMIT);
}

export async function getInstructor(): Promise<Instructor> {
  return cachedInstructor();
}

export async function getMission(): Promise<MissionContent> {
  return cachedMission();
}

export function visibleStats(instructor: Instructor) {
  return instructor.stats.filter((s) => s.visible);
}

/** Seed helpers — static reviews list. */
export { REVIEWS, CONTENT_REGISTRY };
