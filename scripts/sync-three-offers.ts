/**
 * Ensure Workshop / Mentorship / Accelerator are active, valid, and linked
 * on Programs + Pricing content for the public site.
 *
 * Usage: npx tsx scripts/sync-three-offers.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { assertScriptAllowed } from './dev-guard';
import { pricingStaticDefault } from '../src/lib/content/landingSchemas';

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

function monthsFromNow(n: number) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  assertScriptAllowed(uri, 'sync-three-offers');
  await mongoose.connect(uri);

  const { Plan } = await import('../src/models/Plan');
  const { SiteContent } = await import('../src/models/SiteContent');

  const plans = await Plan.find({ status: { $ne: 'archived' } });
  const workshop =
    plans.find((p) => p.isWorkshopPlan) ||
    plans.find((p) => /^workshop$/i.test(String(p.name))) ||
    null;
  const mentorship =
    plans.find((p) => p.isLandingPlan) ||
    plans.find((p) => /mentorship/i.test(String(p.name))) ||
    null;
  const generalist =
    plans.find((p) => /generalist|accelerator/i.test(String(p.name)) && p.status === 'active') ||
    plans.find((p) => /generalist|accelerator/i.test(String(p.name))) ||
    null;

  if (!workshop || !mentorship || !generalist) {
    console.error('Missing one of Workshop / Mentorship / Generalist plans');
    console.error({
      workshop: workshop?.name,
      mentorship: mentorship?.name,
      generalist: generalist?.name,
    });
    process.exit(1);
  }

  await Plan.updateMany(
    {},
    { $set: { isLandingPlan: false, isWorkshopPlan: false } }
  );

  for (const [doc, meta] of [
    [workshop, { name: 'AI Money Lab', price: 999, role: 'workshop' }],
    [
      mentorship,
      { name: '30-Day AI Builder Sprint', price: 8999, role: 'mentorship' },
    ],
    [
      generalist,
      {
        name: 'Zero to AI Pro',
        price: 29999,
        role: 'program',
      },
    ],
  ] as const) {
    const fresh = await Plan.findById(doc._id);
    if (!fresh) continue;
    fresh.name = meta.name;
    fresh.price = meta.price;
    fresh.currency = 'PKR';
    fresh.type = 'one_time';
    fresh.status = 'active';
    fresh.validUntil = monthsFromNow(3);
    fresh.sessionId = '';
    fresh.isWorkshopPlan = meta.role === 'workshop';
    fresh.isLandingPlan = meta.role === 'mentorship';
    await fresh.save();
    console.log(
      `Plan OK: ${fresh.name} | PKR ${fresh.price}` +
        (fresh.isLandingPlan ? ' [MENTORSHIP]' : '') +
        (fresh.isWorkshopPlan ? ' [WORKSHOP]' : '')
    );
  }

  // Hide other non-archived extras
  const keep = new Set([
    String(workshop._id),
    String(mentorship._id),
    String(generalist._id),
  ]);
  for (const p of plans) {
    if (keep.has(String(p._id))) continue;
    if (p.status === 'archived') continue;
    p.status = 'hidden';
    p.isLandingPlan = false;
    p.isWorkshopPlan = false;
    await p.save();
    console.log(`Hidden: ${p.name}`);
  }

  const workshopId = String(workshop._id);
  const mentorshipId = String(mentorship._id);
  const generalistId = String(generalist._id);

  const programsDoc = await SiteContent.findOne({ key: 'programs' });
  const cards = [
    {
      id: 'workshop',
      title: 'AI Money Lab',
      instructorLine: 'Ahmi',
      badges: ['Live Event', '2 Hours'],
      posterAssetId: null,
      image: '/course4.jpeg',
      href: '/#pricing',
      status: 'open' as const,
      priceLabel: 'PKR 999',
      planId: workshopId,
    },
    {
      id: 'mentorship-1-month',
      title: '30-Day AI Builder Sprint',
      instructorLine: 'Ahmi',
      badges: ['Group Mentorship', '30 Days', '5 days/week · 2 hrs/session'],
      posterAssetId: null,
      image: '/course1.jpeg',
      href: '/#pricing',
      status: 'open' as const,
      priceLabel: 'PKR 8,999',
      planId: mentorshipId,
    },
    {
      id: 'ai-generalist-accelerator',
      title: 'Zero to AI Pro',
      instructorLine: 'Ahmi',
      badges: ['3 Months', '5 days/week · 2 hrs/session'],
      posterAssetId: null,
      image: '/course2.jpeg',
      href: '/#pricing',
      status: 'open' as const,
      priceLabel: 'PKR 29,999',
      planId: generalistId,
    },
  ];

  if (programsDoc) {
    // Preserve posters from existing cards when ids match
    const prev = Array.isArray((programsDoc.data as { cards?: unknown[] })?.cards)
      ? ((programsDoc.data as { cards: Array<Record<string, unknown>> }).cards)
      : [];
    const byId = new Map(prev.map((c) => [String(c.id), c]));
    const merged = cards.map((c) => {
      const old = byId.get(c.id);
      if (!old) return c;
      return {
        ...c,
        posterAssetId: old.posterAssetId ?? c.posterAssetId,
        image: old.image || c.image,
        instructorLine:
          typeof old.instructorLine === 'string' && old.instructorLine.trim()
            ? old.instructorLine
            : c.instructorLine,
      };
    });
    programsDoc.data = { cards: merged };
    programsDoc.version = (programsDoc.version || 1) + 1;
    programsDoc.markModified('data');
    await programsDoc.save();
    console.log(`Programs content v${programsDoc.version} — 3 open cards`);
  } else {
    await SiteContent.create({
      key: 'programs',
      data: { cards },
      version: 1,
    });
    console.log('Programs content created');
  }

  const pricingDoc = await SiteContent.findOne({ key: 'pricing' });
  const pricingData = {
    ...pricingStaticDefault,
  };
  if (pricingDoc) {
    pricingDoc.data = {
      ...(pricingDoc.data as object),
      ...pricingData,
    };
    pricingDoc.version = (pricingDoc.version || 1) + 1;
    pricingDoc.markModified('data');
    await pricingDoc.save();
    console.log(`Pricing content v${pricingDoc.version}`);
  } else {
    await SiteContent.create({
      key: 'pricing',
      data: pricingData,
      version: 1,
    });
    console.log('Pricing content created');
  }

  await mongoose.disconnect();
  console.log('\nDone. Refresh / and /#pricing');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
