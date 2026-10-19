/**
 * Set the three product pricing tiers and wire Programs / Mentorship flags.
 *
 *   Workshop                          = PKR 999   (isWorkshopPlan)
 *   Mentorship 1 month                = PKR 8,999 (isLandingPlan / Fees Structure)
 *   AI Generalist Accelerator Program = PKR 29,999
 *
 * Usage: npx tsx scripts/sync-pricing-tiers.ts
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

type TierKey = 'workshop' | 'mentorship' | 'generalist';

const TIER_META: Record<
  TierKey,
  { name: string; price: number; role: 'workshop' | 'mentorship' | 'program' }
> = {
  workshop: { name: 'Workshop', price: 999, role: 'workshop' },
  mentorship: {
    name: 'Mentorship 1 month',
    price: 8999,
    role: 'mentorship',
  },
  generalist: {
    name: 'AI Generalist Accelerator Program',
    price: 29999,
    role: 'program',
  },
};

async function main() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  assertScriptAllowed(uri, 'sync-pricing-tiers');
  await mongoose.connect(uri);

  const { Plan } = await import('../src/models/Plan');
  const { SiteContent } = await import('../src/models/SiteContent');

  const plans = await Plan.find({ status: { $ne: 'archived' } }).sort({
    sortOrder: 1,
    createdAt: 1,
  });

  console.log('\nBefore:');
  for (const p of plans) {
    console.log(
      `  ${p.name} | ${p.currency} ${p.price}` +
        (p.isLandingPlan ? ' [MENTORSHIP]' : '') +
        (p.isWorkshopPlan ? ' [WORKSHOP]' : '')
    );
  }

  if (plans.length < 3) {
    console.error(`\nNeed at least 3 plans; found ${plans.length}`);
    process.exit(1);
  }

  const used = new Set<string>();
  const pick = (
    predicate: (p: (typeof plans)[number]) => boolean
  ): (typeof plans)[number] | null => {
    const found = plans.find((p) => !used.has(String(p._id)) && predicate(p));
    if (found) used.add(String(found._id));
    return found || null;
  };

  // Resolve in order that avoids name collisions (e.g. "Automation Workshop").
  const generalist =
    pick((p) => /generalist|accelerator/i.test(String(p.name))) ||
    pick(() => false);
  const mentorship =
    pick((p) => p.isLandingPlan) ||
    pick((p) => /mentorship/i.test(String(p.name))) ||
    pick(() => false);
  const workshop =
    pick((p) => p.isWorkshopPlan) ||
    pick((p) => /masterclass|^workshop$/i.test(String(p.name))) ||
    pick(() => false);

  // Fill any miss with remaining plans by current price proximity
  const remaining = () => plans.filter((p) => !used.has(String(p._id)));
  const fillClosest = (
    current: (typeof plans)[number] | null,
    targetPrice: number
  ) => {
    if (current) return current;
    const pool = remaining();
    if (pool.length === 0) return null;
    pool.sort(
      (a, b) =>
        Math.abs(Number(a.price) - targetPrice) -
        Math.abs(Number(b.price) - targetPrice)
    );
    used.add(String(pool[0]._id));
    return pool[0];
  };

  const picked: Record<TierKey, (typeof plans)[number]> = {
    generalist: fillClosest(generalist, 29999)!,
    mentorship: fillClosest(mentorship, 8999)!,
    workshop: fillClosest(workshop, 999)!,
  };

  for (const key of ['workshop', 'mentorship', 'generalist'] as TierKey[]) {
    if (!picked[key]) {
      console.error(`\nCould not resolve plan for ${key}`);
      process.exit(1);
    }
  }

  // Clear exclusive flags, then set roles
  await Plan.updateMany(
    {},
    { $set: { isLandingPlan: false, isWorkshopPlan: false } }
  );

  for (const key of ['workshop', 'mentorship', 'generalist'] as TierKey[]) {
    const meta = TIER_META[key];
    const doc = picked[key];
    doc.name = meta.name;
    doc.price = meta.price;
    doc.currency = 'PKR';
    doc.type = 'one_time';
    doc.status = 'active';
    doc.isLandingPlan = meta.role === 'mentorship';
    doc.isWorkshopPlan = meta.role === 'workshop';
    await doc.save();
    console.log(
      `\nUpdated → ${meta.name} | PKR ${meta.price.toLocaleString('en-US')}` +
        (doc.isLandingPlan ? ' [MENTORSHIP / Fees Structure]' : '') +
        (doc.isWorkshopPlan ? ' [WORKSHOP DEFAULT]' : '')
    );
  }

  // Wire programs content cards
  const content = await SiteContent.findOne({ key: 'programs' });
  if (content) {
    const data = (content.data || {}) as {
      cards?: Array<Record<string, unknown>>;
    };
    const cards = Array.isArray(data.cards) ? [...data.cards] : [];
    const workshopId = String(picked.workshop._id);
    const generalistId = String(picked.generalist._id);

    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      const title = String(card.title || '');
      const open = card.status === 'open';
      if (!open) continue;

      if (/generalist|accelerator|sprint/i.test(title)) {
        cards[i] = {
          ...card,
          planId: generalistId,
          priceLabel: 'PKR 29,999',
        };
      } else if (/idea|workshop|money|automation|masterclass/i.test(title)) {
        cards[i] = {
          ...card,
          planId: workshopId,
          priceLabel: 'PKR 999',
        };
      }
    }

    content.data = { ...data, cards };
    content.version = (content.version || 1) + 1;
    content.markModified('data');
    await content.save();

    console.log('\nPrograms cards:');
    for (const c of cards) {
      console.log(
        `  [${c.status}] ${c.title} → planId=${c.planId || '(none)'} ${c.priceLabel || ''}`
      );
    }
    console.log(`Saved programs content version ${content.version}`);
  } else {
    console.warn('\nNo programs SiteContent — skipped card linking');
  }

  // Hide leftover plans so Programs dropdown only shows the three tiers.
  const keepIds = new Set(
    (['workshop', 'mentorship', 'generalist'] as TierKey[]).map((k) =>
      String(picked[k]._id)
    )
  );
  for (const p of plans) {
    if (keepIds.has(String(p._id))) continue;
    if (p.status === 'archived') continue;
    p.status = 'hidden';
    p.isLandingPlan = false;
    p.isWorkshopPlan = false;
    await p.save();
    console.log(`\nHidden leftover: ${p.name} (was PKR ${p.price})`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
