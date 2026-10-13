import imageSize from 'image-size';

export type VerifiedImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

export function sniffContentType(buf: Buffer): VerifiedImageType | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export function readImageDimensions(buf: Buffer): {
  width: number | null;
  height: number | null;
} {
  try {
    const dim = imageSize(buf);
    return {
      width: typeof dim.width === 'number' ? dim.width : null,
      height: typeof dim.height === 'number' ? dim.height : null,
    };
  } catch {
    return { width: null, height: null };
  }
}

export function validateMediaBuffer(buf: Buffer): {
  ok: true;
  contentType: VerifiedImageType;
  width: number | null;
  height: number | null;
} | { ok: false; error: string } {
  if (!Buffer.isBuffer(buf) || buf.length === 0) {
    return {
      ok: false,
      error: 'Upload a JPEG, PNG or WebP image (max 5 MB)',
    };
  }
  if (buf.length > MEDIA_MAX_BYTES) {
    return {
      ok: false,
      error: 'The image is too large. Use a file under 5 MB',
    };
  }
  // Reject SVG even if mislabeled
  const head = buf.subarray(0, Math.min(256, buf.length)).toString('utf8').toLowerCase();
  if (head.includes('<svg') || head.includes('<?xml')) {
    return {
      ok: false,
      error: 'SVG files are not allowed. Upload a JPEG, PNG or WebP image',
    };
  }
  const contentType = sniffContentType(buf);
  if (!contentType) {
    return {
      ok: false,
      error: 'Upload a JPEG, PNG or WebP image (max 5 MB)',
    };
  }
  const { width, height } = readImageDimensions(buf);
  return { ok: true, contentType, width, height };
}
