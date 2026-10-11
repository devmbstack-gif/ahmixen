/**
 * Idempotent: set isActive on every couponRedemption from its order.isLive.
 * Uses the raw collection so legacy docs missing isActive are detected correctly
 * (Mongoose schema defaults would otherwise hide the missing field).
 *
 * Usage: npm run migrate:redemptions
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { assertScriptAllowed } from './dev-guard';

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

type Counts = {
  total: number;
  activeTrue: number;
  activeFalse: number;
  missing: number;
  countedActive: number;
};

async function countRedemptions(
  col: mongoose.mongo.Collection
): Promise<Counts> {
  const rows = await col
    .aggregate<Counts>([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          activeTrue: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          activeFalse: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
          },
          missing: {
            $sum: {
              $cond: [{ $eq: [{ $type: '$isActive' }, 'missing'] }, 1, 0],
            },
          },
          countedActive: {
            $sum: { $cond: [{ $ne: ['$isActive', false] }, 1, 0] },
          },
        },
      },
    ])
    .toArray();
  return (
    rows[0] || {
      total: 0,
      activeTrue: 0,
      activeFalse: 0,
      missing: 0,
      countedActive: 0,
    }
  );
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertScriptAllowed(uri, 'migrate:redemptions');
  await mongoose.connect(uri);

  const redemptions = mongoose.connection.collection('couponRedemptions');
  const orders = mongoose.connection.collection('orders');

  const before = await countRedemptions(redemptions);
  const docs = await redemptions.find({}).project({ orderId: 1, isActive: 1 }).toArray();

  let setTrue = 0;
  let setFalse = 0;
  let unchanged = 0;

  for (const doc of docs) {
    const orderId = String(doc.orderId || '');
    let isLive = false;
    if (orderId && mongoose.isValidObjectId(orderId)) {
      const order = await orders.findOne(
        { _id: new mongoose.Types.ObjectId(orderId) },
        { projection: { isLive: 1 } }
      );
      isLive = Boolean(order?.isLive);
    }

    const next = isLive;
    const hasField = Object.prototype.hasOwnProperty.call(doc, 'isActive');
    if (hasField && doc.isActive === next) {
      unchanged += 1;
      continue;
    }

    await redemptions.updateOne(
      { _id: doc._id },
      { $set: { isActive: next } }
    );
    if (next) setTrue += 1;
    else setFalse += 1;
  }

  const after = await countRedemptions(redemptions);

  console.log('migrate:redemptions');
  console.log(
    JSON.stringify(
      {
        before,
        updated: { setTrue, setFalse, unchanged },
        after,
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
    console.error(err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
