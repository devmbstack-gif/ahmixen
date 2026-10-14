import mongoose from 'mongoose';
import { Testimonial } from '@/models/Testimonial';
import { SiteContent } from '@/models/SiteContent';

export type MediaUsage = {
  label: string;
  href: string;
};

export const MEDIA_CONTENT_PHOTO_KEYS: Array<{
  key: string;
  label: string;
  href: string;
  field: string;
}> = [
  {
    key: 'instructor',
    label: 'Instructor photo',
    href: '/admin/instructor',
    field: 'photoAssetId',
  },
  {
    key: 'intro',
    label: 'Intro hero photo',
    href: '/admin/content/intro',
    field: 'photoAssetId',
  },
  {
    key: 'preview',
    label: 'Workshop preview poster',
    href: '/admin/content/preview',
    field: 'posterAssetId',
  },
];

export async function findMediaUsages(assetId: string): Promise<MediaUsage[]> {
  const usages: MediaUsage[] = [];
  if (!assetId || !mongoose.isValidObjectId(assetId)) return usages;

  const testimonials = await Testimonial.find({ avatarAssetId: assetId })
    .select({ name: 1 })
    .lean();
  for (const t of testimonials) {
    usages.push({
      label: `Testimonial: ${t.name || 'Untitled'}`,
      href: `/admin/testimonials/${String(t._id)}/edit`,
    });
  }

  for (const entry of MEDIA_CONTENT_PHOTO_KEYS) {
    const doc = await SiteContent.findOne({ key: entry.key }).lean();
    if (!doc?.data || typeof doc.data !== 'object') continue;
    const data = doc.data as Record<string, unknown>;
    if (data[entry.field] === assetId) {
      usages.push({ label: entry.label, href: entry.href });
    }
  }

  const programsDoc = await SiteContent.findOne({ key: 'programs' }).lean();
  if (programsDoc?.data && typeof programsDoc.data === 'object') {
    const cards = (programsDoc.data as { cards?: Array<{ posterAssetId?: string | null; title?: string }> })
      .cards;
    if (Array.isArray(cards)) {
      for (const card of cards) {
        if (card?.posterAssetId === assetId) {
          usages.push({
            label: `Programs card: ${card.title || 'Untitled'}`,
            href: '/admin/content/programs',
          });
        }
      }
    }
  }

  const instructorDoc = await SiteContent.findOne({ key: 'instructor' }).lean();
  if (instructorDoc?.data && typeof instructorDoc.data === 'object') {
    const proofCards = (
      instructorDoc.data as {
        proofCards?: Array<{ imageAssetId?: string; label?: string }>;
      }
    ).proofCards;
    if (Array.isArray(proofCards)) {
      for (const card of proofCards) {
        if (card?.imageAssetId === assetId) {
          usages.push({
            label: `Instructor profile picture: ${card.label || 'Untitled'}`,
            href: '/admin/instructor',
          });
        }
      }
    }
  }

  return usages;
}
