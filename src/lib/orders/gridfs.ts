import { GridFSBucket, ObjectId, type GridFSBucketReadStream } from 'mongodb';
import { connectToDatabase } from '@/lib/db';

const MAX_BYTES = 2 * 1024 * 1024;
/** Workshop registration payment screenshots (public form allows up to 10 MB). */
export const WORKSHOP_PROOF_MAX_BYTES = 10 * 1024 * 1024;

type CachedBucket = {
  bucket: GridFSBucket;
  dbName: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __ahmixenProofBucket: CachedBucket | undefined;
}

export type VerifiedImageType = 'image/jpeg' | 'image/png' | 'image/webp';

function sniffContentType(buf: Buffer): VerifiedImageType | null {
  if (buf.length < 12) return null;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG
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
  // WebP: RIFF....WEBP
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

export async function getPaymentProofBucket(): Promise<GridFSBucket> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not ready');
  }
  const dbName = db.databaseName;
  const cached = global.__ahmixenProofBucket;
  if (cached && cached.dbName === dbName) {
    return cached.bucket;
  }
  const bucket = new GridFSBucket(db, { bucketName: 'paymentProofs' });
  global.__ahmixenProofBucket = { bucket, dbName };
  return bucket;
}

export async function saveProof(
  buffer: Buffer,
  meta: { orderId?: string; leadId?: string },
  opts?: { maxBytes?: number }
): Promise<{ fileId: string; contentType: VerifiedImageType; size: number }> {
  const maxBytes = opts?.maxBytes ?? MAX_BYTES;
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error(`Upload a JPEG, PNG or WebP image (max ${maxMb} MB)`);
  }
  if (buffer.length > maxBytes) {
    throw new Error(`The image is too large. Use a file under ${maxMb} MB`);
  }
  const contentType = sniffContentType(buffer);
  if (!contentType) {
    throw new Error(`Upload a JPEG, PNG or WebP image (max ${maxMb} MB)`);
  }

  const bucket = await getPaymentProofBucket();
  const owner = meta.orderId || meta.leadId || 'unknown';
  const filename = `proof-${owner}-${Date.now()}`;

  const fileId = await new Promise<ObjectId>((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, {
      metadata: {
        orderId: meta.orderId || '',
        leadId: meta.leadId || '',
        contentType,
      },
    });
    stream.on('error', reject);
    stream.on('finish', () => resolve(stream.id as ObjectId));
    stream.end(buffer);
  });

  return {
    fileId: String(fileId),
    contentType,
    size: buffer.length,
  };
}

export async function openProofStream(
  fileId: string
): Promise<{ stream: GridFSBucketReadStream; contentType: string } | null> {
  if (!ObjectId.isValid(fileId)) return null;
  const bucket = await getPaymentProofBucket();
  const _id = new ObjectId(fileId);
  const files = await bucket.find({ _id }).limit(1).toArray();
  if (!files.length) return null;
  const meta = (files[0]!.metadata ?? {}) as { contentType?: string };
  const contentType = meta.contentType || 'application/octet-stream';
  return {
    stream: bucket.openDownloadStream(_id),
    contentType,
  };
}

export async function deleteProof(fileId: string): Promise<void> {
  if (!ObjectId.isValid(fileId)) return;
  try {
    const bucket = await getPaymentProofBucket();
    await bucket.delete(new ObjectId(fileId));
  } catch (err) {
    // Missing file is fine during cleanup.
    const msg = err instanceof Error ? err.message : '';
    if (!/FileNotFound|not found/i.test(msg)) {
      console.error('[gridfs delete]', msg);
    }
  }
}

/** Tiny valid 1×1 PNG for seed / tests. */
export function tinyPngBuffer(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
}
