import type { TestimonialDocument } from '@/models/Testimonial';
import { mediaPublicUrl } from '@/lib/media/url';

export type AdminTestimonialDTO = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number | null;
  avatarAssetId: string | null;
  avatarUrl: string | null;
  visible: boolean;
  source: 'admin' | 'feedback';
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export function serializeTestimonial(
  doc: TestimonialDocument,
  avatarAsset?: {
    kind: string;
    fileId?: string | null;
    staticPath?: string | null;
    _id?: { toString(): string };
  } | null
): AdminTestimonialDTO {
  const id = String(doc._id);
  const avatarUrl = avatarAsset
    ? mediaPublicUrl({
        kind: avatarAsset.kind,
        fileId: avatarAsset.fileId,
        staticPath: avatarAsset.staticPath,
        id: avatarAsset._id ? String(avatarAsset._id) : undefined,
      })
    : null;

  return {
    id,
    name: doc.name,
    role: doc.role || '',
    quote: doc.quote,
    rating: doc.rating ?? null,
    avatarAssetId: doc.avatarAssetId || null,
    avatarUrl,
    visible: Boolean(doc.visible),
    source: doc.source === 'feedback' ? 'feedback' : 'admin',
    sortOrder: doc.sortOrder ?? 0,
    version: doc.version ?? 1,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt ?? ''),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt ?? ''),
  };
}
