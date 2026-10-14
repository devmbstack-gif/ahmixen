import mongoose from 'mongoose';
import { getEmailMode as getMode } from '../src/lib/email/config';
import { withOrdersTransaction } from '../src/lib/orders/tx';

export function getEmailMode() {
  return getMode();
}

/** Probe whether Mongo supports transactions in this environment. */
export async function getOrdersTxModeHint(): Promise<string> {
  try {
    const { mode } = await withOrdersTransaction(async (session) => {
      // no-op work; session may be null in compensating mode
      void session;
      return true;
    });
    return mode === 'transaction'
      ? 'transaction (replica set)'
      : 'compensating (no real transaction)';
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'probe failed';
    // Avoid dumping connection strings if present
    return `probe error: ${msg.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, 'mongodb://***')}`;
  } finally {
    // withOrdersTransaction already used the shared connection
    void mongoose;
  }
}
