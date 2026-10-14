import mongoose from 'mongoose';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  if (cache.conn) {
    // ReadyState 1 = connected; reconnect if the pool dropped.
    if (mongoose.connection.readyState === 1) return cache.conn;
    cache.conn = null;
    cache.promise = null;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        // Fail fast on bad network; keep a small warm pool for admin login/APIs.
        serverSelectionTimeoutMS: 5_000,
        connectTimeoutMS: 5_000,
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 60_000,
      })
      .catch((err) => {
        // Allow a later request to retry instead of sticking on a rejected promise.
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/** Fire-and-forget warm connect (login page / instrumentation). */
export function warmDatabase(): void {
  void connectToDatabase().catch(() => undefined);
}
