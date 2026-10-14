import { Plan } from '@/models/Plan';

let syncPromise: Promise<void> | null = null;

/** Ensure plan indexes exist (including unique isLandingPlan). Safe to call often. */
export async function ensurePlanIndexes(): Promise<void> {
  if (!syncPromise) {
    syncPromise = (async () => {
      await Plan.syncIndexes();
    })().catch((err) => {
      syncPromise = null;
      throw err;
    });
  }
  await syncPromise;
}
