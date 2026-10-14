import { EmailJob } from '@/models/EmailJob';
import { connectToDatabase } from '@/lib/db';

let syncPromise: Promise<void> | null = null;

export async function ensureEmailJobIndexes(): Promise<void> {
  if (!syncPromise) {
    syncPromise = (async () => {
      await connectToDatabase();
      await EmailJob.init();
      await EmailJob.syncIndexes();
    })().catch((err) => {
      syncPromise = null;
      throw err;
    });
  }
  await syncPromise;
}
