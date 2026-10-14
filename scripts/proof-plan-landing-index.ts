/**
 * Proves the unique partial index on isLandingPlan rejects a second true flag.
 * Usage: npm run proof:plan-landing (dev only)
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

loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertScriptAllowed(uri, 'proof:plan-landing');

  await mongoose.connect(uri);
  const { Plan } = await import('../src/models/Plan');
  const { ensurePlanIndexes } = await import('../src/lib/plans/syncIndexes');
  await ensurePlanIndexes();

  const indexes = await Plan.collection.indexes();
  const landingIdx = indexes.find((i) => i.name === 'plans_unique_landing');
  console.log('index plans_unique_landing:', landingIdx ? 'present' : 'MISSING');
  if (landingIdx) console.log(JSON.stringify(landingIdx, null, 2));

  const a = await Plan.create({
    name: `Proof A ${Date.now()}`,
    shortDescription: 'proof',
    type: 'one_time',
    currency: 'PKR',
    price: 100,
    status: 'active',
    isLandingPlan: true,
    features: [],
    createdBy: 'proof',
    updatedBy: 'proof',
  });
  console.log('created landing plan A', String(a._id));

  let rejected = false;
  try {
    await Plan.create({
      name: `Proof B ${Date.now()}`,
      shortDescription: 'proof',
      type: 'one_time',
      currency: 'PKR',
      price: 200,
      status: 'active',
      isLandingPlan: true,
      features: [],
      createdBy: 'proof',
      updatedBy: 'proof',
    });
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code?: number }).code
        : undefined;
    rejected = code === 11000;
    console.log(
      'second isLandingPlan=true insert:',
      rejected ? 'REJECTED (E11000) as expected' : `unexpected: ${String(err)}`
    );
  }

  await Plan.updateMany(
    { _id: { $ne: a._id }, isLandingPlan: true },
    { $set: { isLandingPlan: false } }
  );
  const b = await Plan.create({
    name: `Proof C ${Date.now()}`,
    shortDescription: 'proof',
    type: 'one_time',
    currency: 'PKR',
    price: 300,
    status: 'active',
    isLandingPlan: false,
    features: [],
    createdBy: 'proof',
    updatedBy: 'proof',
  });
  await Plan.updateMany(
    { _id: { $ne: b._id }, isLandingPlan: true },
    { $set: { isLandingPlan: false } }
  );
  b.isLandingPlan = true;
  await b.save();
  const stillA = await Plan.findById(a._id).lean();
  const stillB = await Plan.findById(b._id).lean();
  console.log(
    'after swap-style set: A.landing=',
    Boolean(stillA?.isLandingPlan),
    'B.landing=',
    Boolean(stillB?.isLandingPlan)
  );

  await Plan.deleteMany({
    _id: { $in: [a._id, b._id] },
    createdBy: 'proof',
  });
  console.log('cleaned proof plans');
  console.log(rejected ? 'PROOF OK' : 'PROOF FAILED');

  await mongoose.disconnect();
  if (!rejected) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
