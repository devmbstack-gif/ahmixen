/** Public URL for a media asset. Uploads use the media API; static uses /public path. */
export function mediaPublicUrl(asset: {
  kind: string;
  fileId?: string | null;
  staticPath?: string | null;
  _id?: { toString(): string } | string;
  id?: string;
}): string | null {
  if (asset.kind === 'static' && asset.staticPath) {
    return asset.staticPath.startsWith('/')
      ? asset.staticPath
      : `/${asset.staticPath}`;
  }
  if (asset.kind === 'upload') {
    const id =
      asset.id ||
      (typeof asset._id === 'string' ? asset._id : asset._id?.toString());
    if (!id) return null;
    return `/api/media/${id}`;
  }
  return null;
}
