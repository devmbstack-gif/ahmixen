/**
 * Idempotent default landing plan seed.
 *
 * Usage:
 *   npm run seed:plan -- --price 1499 --currency PKR
 *   npm run seed:plan -- --price 1499 --original 2499 --currency PKR
 *   npm run seed:plan -- --price 1499 --currency PKR --force
 *
 * Creates the plan only when no plans exist, unless --force is set
 * (then creates and sets as landing, leaving other plans untouched except
 * clearing their isLandingPlan flag).
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

const FEATURES = [
  'Live practical builds, step by step',
  'AI workflows and automations',
  'AI use cases across industries (e-commerce, marketing, design)',
  'How to sell your AI skills: freelancing and services roadmap',
  'Live Q&A with your AI mentor',
] as const;

function usage(): never {
  console.error(
    'Usage: npm run seed:plan -- --price <number> --currency PKR|USD [--original <number>] [--force]'
  );
  process.exit(1);
}

function parseArgs(argv: string[]) {
  let price: number | null = null;
  let original: number | null = null;
  let currency: 'PKR' | 'USD' | null = null;
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--force') {
      force = true;
      continue;
    }
    if (a === '--price') {
      const v = Number(argv[++i]);
      if (!Number.isFinite(v) || v < 1) usage();
      price = Math.trunc(v);
      continue;
    }
    if (a === '--original') {
      const v = Number(argv[++i]);
      if (!Number.isFinite(v) || v < 1) usage();
      original = Math.trunc(v);
      continue;
    }
    if (a === '--currency') {
      const v = String(argv[++i] || '').toUpperCase();
      if (v !== 'PKR' && v !== 'USD') usage();
      currency = v;
      continue;
    }
  }

  if (price == null || currency == null) usage();
  return { price, original, currency, force };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertScriptAllowed(uri, 'seed:plan');

  const args = parseArgs(process.argv.slice(2));
  await mongoose.connect(uri);

  const { Plan } = await import('../src/models/Plan');
  const { ensurePlanIndexes } = await import('../src/lib/plans/syncIndexes');
  await ensurePlanIndexes();

  const count = await Plan.countDocuments();
  if (count > 0 && !args.force) {
    console.log('seed:plan skipped — plans already exist (use --force to add anyway)');
    await mongoose.disconnect();
    return;
  }

  if (args.force) {
    await Plan.updateMany(
      { isLandingPlan: true },
      { $set: { isLandingPlan: false }, $inc: { version: 1 } }
    );
  }

  const doc = await Plan.create({
    name: 'Live Workshop Pass',
    shortDescription: 'One live session. Hands-on and beginner friendly.',
    type: 'one_time',
    currency: args.currency,
    price: args.price,
    originalPrice: args.original,
    installmentsCount: null,
    features: [...FEATURES],
    sessionId: '',
    validUntil: null,
    status: 'active',
    isLandingPlan: true,
    sortOrder: 0,
    version: 1,
    createdBy: 'seed',
    updatedBy: 'seed',
  });

  console.log('seed:plan summary');
  console.log(`  plan id: ${String(doc._id)}`);
  console.log(`  name: ${doc.name}`);
  console.log(`  price: ${doc.currency} ${doc.price}`);
  console.log(
    `  original: ${doc.originalPrice == null ? '(none)' : `${doc.currency} ${doc.originalPrice}`}`
  );
  console.log(`  isLandingPlan: true`);
  console.log(`  force: ${args.force}`);
  console.log(`  features: ${FEATURES.length}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
