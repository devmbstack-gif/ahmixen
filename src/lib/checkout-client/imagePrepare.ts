const MAX_UPLOAD = 2 * 1024 * 1024;
const RESIZE_THRESHOLD = 600 * 1024;
const TARGET_BYTES = 400 * 1024;
const MAX_SIDE = 1600;

export type PrepareResult =
  | { ok: true; file: File }
  | { ok: false; message: string };

function sniffOk(type: string): boolean {
  return type === 'image/jpeg' || type === 'image/png' || type === 'image/webp';
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = url;
    });
    return img;
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

/** Client-side image prep before proof upload. Server still validates. */
export async function prepareProofImage(file: File): Promise<PrepareResult> {
  if (!sniffOk(file.type)) {
    return {
      ok: false,
      message: 'Please upload a JPG, PNG or WebP image.',
    };
  }

  if (file.size <= RESIZE_THRESHOLD) {
    if (file.size > MAX_UPLOAD) {
      return {
        ok: false,
        message: 'This image is too large. Please choose a smaller screenshot.',
      };
    }
    return { ok: true, file };
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return {
      ok: false,
      message: 'Please upload a JPG, PNG or WebP image.',
    };
  }

  let { width, height } = img;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      ok: false,
      message: 'Please upload a JPG, PNG or WebP image.',
    };
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let blob: Blob | null = null;
  while (quality >= 0.5) {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (blob && blob.size <= TARGET_BYTES) break;
    quality -= 0.1;
  }

  if (!blob || blob.size > MAX_UPLOAD) {
    return {
      ok: false,
      message: 'This image is too large. Please choose a smaller screenshot.',
    };
  }

  const next = new File([blob], 'payment-proof.jpg', { type: 'image/jpeg' });
  return { ok: true, file: next };
}
