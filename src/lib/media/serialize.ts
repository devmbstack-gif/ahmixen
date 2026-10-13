import type { MediaAssetDocument } from '@/models/MediaAsset';
import { mediaPublicUrl } from './url';
import type { MediaUsage } from './usages';

export type AdminMediaDTO = {
  id: string;
  kind: 'upload' | 'static';
  name: string;
  altText: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
  usageCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export function serializeMediaAsset(
  doc: MediaAssetDocument | (MediaAssetDocument & { toObject?: () => unknown }),
  usageCount = 0
): AdminMediaDTO {
  const raw = typeof (doc as { toObject?: () => MediaAssetDocument }).toObject === 'function'
    ? (doc as { toObject: () => MediaAssetDocument }).toObject()
    : (doc as MediaAssetDocument);

  const id = String(raw._id);
  const url =
    mediaPublicUrl({
      kind: raw.kind,
      fileId: raw.fileId,
      staticPath: raw.staticPath,
      id,
    }) || '';

  return {
    id,
    kind: raw.kind as 'upload' | 'static',
    name: raw.name,
    altText: raw.altText || '',
    contentType: raw.contentType,
    size: raw.size,
    width: raw.width ?? null,
    height: raw.height ?? null,
    url,
    usageCount,
    version: raw.version ?? 1,
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt ?? ''),
    updatedAt:
      raw.updatedAt instanceof Date
        ? raw.updatedAt.toISOString()
        : String(raw.updatedAt ?? ''),
  };
}

export type MediaDetailDTO = AdminMediaDTO & {
  usages: MediaUsage[];
};
