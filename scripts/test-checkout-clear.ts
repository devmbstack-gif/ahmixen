/**
 * Removes checkout harness data only (@checkout-test.invalid).
 * Usage: npm run test:checkout:clear
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { Order } from '../src/models/Order';
import { Lead } from '../src/models/Lead';
import { deleteProof } from '../src/lib/orders/gridfs';
import {
  releaseConfirmedSeat,
  releaseHold,
} from '../src/lib/orders/seats';
import { ensureOrderIndexes } from '../src/lib/orders/syncIndexes';

const EMAIL_RE = /@checkout-test\.invalid$/i;

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function assertDevOnly(uri: string) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Refusing to clear checkout test data in production');
  }
  const dbName = uri.split('/').pop()?.split('?')[0] || '';
  const looksDev = /dev|test|local|admixen|ahmixen|staging/i.test(dbName);
  if (!looksDev && process.env.ALLOW_SEED !== 'true') {
    throw new Error(
      `Database "${dbName}" does not look like a dev database. Set ALLOW_SEED=true to override.`
    );
  }
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertDevOnly(uri);

  await mongoose.connect(uri);
  await ensureOrderIndexes();

  const docs = await Order.find({
    $or: [
      { isTestData: true, 'customer.emailNormalized': EMAIL_RE },
      { 'customer.emailNormalized': EMAIL_RE },
    ],
  });

  let releasedHolds = 0;
  let releasedConfirmed = 0;
  let proofs = 0;
  for (const doc of docs) {
    const id = String(doc._id);
    if (doc.status === 'approved') {
      await releaseConfirmedSeat(doc.sessionId);
      releasedConfirmed += 1;
    } else if (
      doc.status === 'awaiting_payment' ||
      doc.status === 'pending_verification'
    ) {
      await releaseHold(doc.sessionId, id);
      releasedHolds += 1;
    } else {
      await releaseHold(doc.sessionId, id).catch(() => undefined);
    }
    if (doc.proof?.fileId) {
      await deleteProof(doc.proof.fileId);
      proofs += 1;
    }
  }

  const orders = await Order.deleteMany({
    'customer.emailNormalized': EMAIL_RE,
  });
  const leads = await Lead.deleteMany({ emailNormalized: EMAIL_RE });

  console.log(
    JSON.stringify(
      {
        ordersDeleted: orders.deletedCount ?? 0,
        leadsDeleted: leads.deletedCount ?? 0,
        releasedHolds,
        releasedConfirmed,
        proofsRemoved: proofs,
      },
      null,
      2
    )
  );
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : 'error');
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
