/**
 * Show "one month Mentorship" (PKR 8,999) on Fees Structure only.
 * Clears Mentorship flag from other plans; keeps Workshop as workshop default.
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
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  assertScriptAllowed(uri, 'fix-mentorship-landing');
  await mongoose.connect(uri);

  const { Plan } = await import('../src/models/Plan');

  const all = await Plan.find({}).sort({ createdAt: 1 });
  console.log('\nBefore:');
  for (const p of all) {
    console.log(
      `  ${String(p._id)} | ${p.name} | ${p.status} | ${p.currency} ${p.price}` +
        (p.isLandingPlan ? ' [L]' : '') +
        (p.isWorkshopPlan ? ' [W]' : '') +
        (p.validUntil ? ` until ${p.validUntil.toISOString().slice(0, 10)}` : '')
    );
  }

  // Prefer the user-created "one month Mentorship" (hidden, 8999, often with original).
  let mentorship =
    all.find((p) => /^one month mentorship$/i.test(String(p.name).trim())) ||
    all.find(
      (p) =>
        /mentorship/i.test(String(p.name)) &&
        Number(p.price) === 8999 &&
        p.status !== 'archived'
    ) ||
    null;

  if (!mentorship) {
    console.error('\nCould not find Mentorship plan at PKR 8999');
    process.exit(1);
  }

  const workshop =
    all.find((p) => p.isWorkshopPlan) ||
    all.find((p) => /^workshop$/i.test(String(p.name).trim())) ||
    null;

  // Clear exclusive flags on everyone
  await Plan.updateMany(
    {},
    { $set: { isLandingPlan: false, isWorkshopPlan: false } }
  );

  // Activate Mentorship for Fees Structure
  mentorship = await Plan.findById(mentorship._id);
  if (!mentorship) {
    console.error('Mentorship plan disappeared');
    process.exit(1);
  }

  mentorship.name = 'one month Mentorship';
  mentorship.price = 8999;
  mentorship.currency = 'PKR';
  mentorship.type = 'one_time';
  mentorship.status = 'active';
  mentorship.isLandingPlan = true;
  mentorship.isWorkshopPlan = false;
  // Extend validity so it is not "expired" on the site
  const until = mentorship.validUntil;
  const now = new Date();
  if (!until || until.getTime() < now.getTime() + 7 * 24 * 60 * 60 * 1000) {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() + 2);
    mentorship.validUntil = d;
  }
  // Prefer All sessions for landing eligibility
  mentorship.sessionId = '';
  await mentorship.save();

  if (workshop) {
    const w = await Plan.findById(workshop._id);
    if (w) {
      w.isWorkshopPlan = true;
      w.isLandingPlan = false;
      if (w.status !== 'active') w.status = 'active';
      await w.save();
      console.log(`\nWorkshop default: ${w.name} | PKR ${w.price}`);
    }
  }

  // Hide duplicate "Mentorship 1 month" if different doc
  for (const p of all) {
    if (String(p._id) === String(mentorship._id)) continue;
    if (!/mentorship/i.test(String(p.name))) continue;
    const dup = await Plan.findById(p._id);
    if (!dup) continue;
    dup.isLandingPlan = false;
    dup.isWorkshopPlan = false;
    if (dup.status === 'active') dup.status = 'hidden';
    await dup.save();
    console.log(`\nHidden duplicate: ${dup.name} (${dup._id})`);
  }

  const after = await Plan.find({}).sort({ createdAt: 1 }).lean();
  console.log('\nAfter:');
  for (const p of after) {
    console.log(
      `  ${p.name} | ${p.status} | PKR ${p.price}` +
        (p.isLandingPlan ? ' [MENTORSHIP / Fees Structure]' : '') +
        (p.isWorkshopPlan ? ' [WORKSHOP]' : '')
    );
  }

  await mongoose.disconnect();
  console.log('\nDone — refresh /#pricing');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
