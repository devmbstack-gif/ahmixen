/**
 * QA wipe: removes ALL customer user data — bookings (orders), reservations
 * (derived from approved orders), leads, related proofs, holds, and email jobs.
 *
 * Keeps: sessions, plans, admin accounts, landing content, testimonials,
 * payment settings, media.
 *
 * Usage: npx tsx scripts/clear-user-data.ts
 *        npm run clear:user-data
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { Order } from '../src/models/Order';
import { Lead } from '../src/models/Lead';
import { EmailJob } from '../src/models/EmailJob';
import { Session } from '../src/models/Session';
import { deleteProof } from '../src/lib/orders/gridfs';
import {
  releaseConfirmedSeat,
  releaseHold,
} from '../src/lib/orders/seats';
import { ensureOrderIndexes } from '../src/lib/orders/syncIndexes';

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

function assertClearAllowed(uri: string) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error(
      'Refusing to clear user data in production (set ALLOW_SEED=true to override)'
    );
  }
  const dbName = uri.split('/').pop()?.split('?')[0] || '';
  const looksDev = /dev|test|local|admixen|ahmixen|staging/i.test(dbName);
  if (!looksDev && process.env.ALLOW_SEED !== 'true') {
    throw new Error(
      `Database "${dbName}" does not look like a dev database. Set ALLOW_SEED=true to override.`
    );
  }
}

async function clearUserData() {
  await ensureOrderIndexes();

  const docs = await Order.find({});
  let releasedHolds = 0;
  let releasedConfirmed = 0;
  let proofs = 0;

  for (const doc of docs) {
    const id = String(doc._id);
    try {
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
    } catch {
      /* continue wipe */
    }

    if (doc.proof?.fileId) {
      await deleteProof(doc.proof.fileId).catch(() => undefined);
      proofs += 1;
    }
  }

  const orders = await Order.deleteMany({});
  const leads = await Lead.deleteMany({});
  const emailJobs = await EmailJob.deleteMany({});

  // Ensure no orphan holds / seat counters remain on sessions
  const sessionsReset = await Session.updateMany(
    {},
    {
      $set: {
        holds: [],
        seatsConfirmed: 0,
      },
    }
  );

  return {
    ordersDeleted: orders.deletedCount ?? 0,
    leadsDeleted: leads.deletedCount ?? 0,
    emailJobsDeleted: emailJobs.deletedCount ?? 0,
    releasedHolds,
    releasedConfirmed,
    proofsRemoved: proofs,
    sessionsSeatReset: sessionsReset.modifiedCount ?? 0,
  };
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertClearAllowed(uri);

  await mongoose.connect(uri);
  const summary = await clearUserData();
  console.log('clear:user-data summary');
  console.log(JSON.stringify(summary, null, 2));
}

const isDirect =
  typeof process.argv[1] === 'string' &&
  /clear-user-data\.(ts|js|mjs|cjs)$/.test(
    process.argv[1].replace(/\\/g, '/')
  );

if (isDirect) {
  main()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await mongoose.disconnect().catch(() => undefined);
      process.exit(1);
    });
}

export { clearUserData };
