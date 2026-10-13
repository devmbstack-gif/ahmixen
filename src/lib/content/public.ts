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
  const photo = await resolveInstructorPhoto(data);
  return {
    name: data.name,
    title: data.title,
    bio: data.bio,
    shortBio: data.shortBio,
    chip: data.chip,
    stats: data.stats,
    seminars: data.seminars,
    linkedin: data.linkedin,
    instagram: data.instagram,
    photo,
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
