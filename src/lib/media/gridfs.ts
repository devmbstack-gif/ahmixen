import { GridFSBucket, ObjectId, type GridFSBucketReadStream } from 'mongodb';
import { connectToDatabase } from '@/lib/db';

type CachedBucket = {
  bucket: GridFSBucket;
  dbName: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __ahmixenMediaBucket: CachedBucket | undefined;
}

export async function getMediaBucket(): Promise<GridFSBucket> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not ready');
  }
  const dbName = db.databaseName;
  const cached = global.__ahmixenMediaBucket;
  if (cached && cached.dbName === dbName) {
    return cached.bucket;
  }
  const bucket = new GridFSBucket(db, { bucketName: 'media' });
  global.__ahmixenMediaBucket = { bucket, dbName };
  return bucket;
}

export async function saveMediaFile(
  buffer: Buffer,
  meta: {
    filename: string;
    contentType: string;
    assetId: string;
    width: number | null;
    height: number | null;
  }
): Promise<string> {
  const bucket = await getMediaBucket();
  const fileId = await new Promise<ObjectId>((resolve, reject) => {
    const stream = bucket.openUploadStream(meta.filename, {
      metadata: {
        bucket: 'media',
        contentType: meta.contentType,
        assetId: meta.assetId,
        width: meta.width,
        height: meta.height,
      },
    });
    stream.on('error', reject);
    stream.on('finish', () => resolve(stream.id as ObjectId));
    stream.end(buffer);
  });
  return String(fileId);
}

export async function openMediaStream(
  fileId: string
): Promise<{
  stream: GridFSBucketReadStream;
  contentType: string;
  length: number;
  uploadDate: Date;
} | null> {
  if (!ObjectId.isValid(fileId)) return null;
  const bucket = await getMediaBucket();
  const _id = new ObjectId(fileId);
  const files = await bucket.find({ _id }).limit(1).toArray();
  if (!files.length) return null;
  const file = files[0]!;
  const meta = (file.metadata ?? {}) as {
    bucket?: string;
    contentType?: string;
  };
  // Never serve payment proofs (or anything else) from this endpoint.
  if (meta.bucket && meta.bucket !== 'media') return null;
  return {
    stream: bucket.openDownloadStream(_id),
    contentType: meta.contentType || 'application/octet-stream',
    length: file.length,
    uploadDate: file.uploadDate,
  };
}

export async function deleteMediaFile(fileId: string): Promise<void> {
  if (!ObjectId.isValid(fileId)) return;
  try {
    const bucket = await getMediaBucket();
    await bucket.delete(new ObjectId(fileId));
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (!/FileNotFound|not found/i.test(msg)) {
      console.error('[media gridfs delete]', msg);
    }
  }
}
