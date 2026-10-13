const MAX_UPLOAD = 5 * 1024 * 1024;
const CLIENT_SOFT_MAX = 1.5 * 1024 * 1024;
const MAX_SIDE = 2400;
const QUALITY = 0.85;

export type PrepareResult =
  | { ok: true; file: File }
  | { ok: false; message: string };

function sniffOk(type: string): boolean {
  return type === 'image/jpeg' || type === 'image/png' || type === 'image/webp';
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function hasTransparency(img: HTMLImageElement): Promise<boolean> {
  const canvas = document.createElement('canvas');
  const w = Math.min(img.naturalWidth || img.width, 64);
  const h = Math.min(img.naturalHeight || img.height, 64);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.drawImage(img, 0, 0, w, h);
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < data.length; i += 4) {
      if ((data[i] ?? 255) < 255) return true;
    }
  } catch {
    return false;
  }
  return false;
}

/** Client-side prep before media library upload. Server still validates (max 5 MB). */
export async function prepareMediaImage(file: File): Promise<PrepareResult> {
  if (!sniffOk(file.type)) {
    return {
      ok: false,
      message: 'Use a JPEG, PNG or WebP image.',
    };
  }

  if (file.size > MAX_UPLOAD) {
    return {
      ok: false,
      message: 'This image is too large. Use a file under 5 MB.',
    };
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { ok: false, message: 'Use a JPEG, PNG or WebP image.' };
  }

  const longest = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const needsResize = longest > MAX_SIDE || file.size > CLIENT_SOFT_MAX;
  if (!needsResize) {
    return { ok: true, file };
  }

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { ok: false, message: 'Use a JPEG, PNG or WebP image.' };
  }
  ctx.drawImage(img, 0, 0, width, height);

  const transparent = await hasTransparency(img);
  let outType = file.type;
  if (transparent) {
    // Keep PNG/WebP transparency; if still large, re-encode as WebP.
    outType = 'image/webp';
  } else {
    outType = 'image/jpeg';
  }

  const blob = await canvasToBlob(canvas, outType, QUALITY);
  if (!blob) {
    return { ok: false, message: 'Could not prepare this image. Try another file.' };
  }
  if (blob.size > MAX_UPLOAD) {
    return {
      ok: false,
      message: 'This image is still too large after resizing. Try a smaller file.',
    };
  }

  const ext = outType === 'image/png' ? 'png' : outType === 'image/webp' ? 'webp' : 'jpg';
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return {
    ok: true,
    file: new File([blob], `${base}.${ext}`, { type: outType }),
  };
}
