import mongoose, { type ClientSession } from 'mongoose';
import { connectToDatabase } from '@/lib/db';

export type TxMode = 'transaction' | 'compensating';

let resolvedMode: TxMode | null = null;

export function getOrdersTxMode(): TxMode | null {
  return resolvedMode;
}

/**
 * Run work with a MongoDB transaction when available (Atlas / replica set).
 * If transactions are unsupported, run the work without a session and mark
 * mode as "compensating" so callers apply guarded-update + revert patterns.
 */
export async function withOrdersTransaction<T>(
  work: (session: ClientSession | null) => Promise<T>
): Promise<{ result: T; mode: TxMode }> {
  await connectToDatabase();

  // Prefer real transactions.
  try {
    const session = await mongoose.startSession();
    try {
      let value!: T;
      await session.withTransaction(async () => {
        value = await work(session);
      });
      resolvedMode = 'transaction';
      return { result: value, mode: 'transaction' };
    } finally {
      await session.endSession();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const unsupported =
      /Transaction numbers are only allowed|transactions are not supported|replica set|IllegalOperation/i.test(
        msg
      );
    if (!unsupported) throw err;

    resolvedMode = 'compensating';
    const value = await work(null);
    return { result: value, mode: 'compensating' };
  }
}
