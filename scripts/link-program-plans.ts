/**
 * Link active one-time (non-Mentorship) plans to open program cards in order.
 * Mentorship (isLandingPlan) is never attached to Programs cards.
 *
 * Usage:
 *   npx tsx scripts/link-program-plans.ts
 *   npx tsx scripts/link-program-plans.ts --dry-run
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

function scoreMatch(planName: string, sessionTitle: string | null, cardTitle: string) {
  const card = cardTitle.trim().toLowerCase();
  if (!card) return 0;
  const name = planName.trim().toLowerCase();
  const session = (sessionTitle || '').trim().toLowerCase();
  let score = 0;
  if (name.includes(card) || card.includes(name)) score += 10;
  if (session && (session.includes(card) || card.includes(session))) score += 12;
  const cardWords = card.split(/\s+/).filter((w) => w.length > 3);
  for (const w of cardWords) {
    if (name.includes(w)) score += 1;
    if (session.includes(w)) score += 1;
  }
  return score;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error('Missing MONGODB_URI (or DATABASE_URL) in .env.local');
    process.exit(1);
  }
  assertScriptAllowed(uri, 'link-program-plans');

  await mongoose.connect(uri);
  const { Plan } = await import('../src/models/Plan');
  const { Session } = await import('../src/models/Session');
  const { SiteContent } = await import('../src/models/SiteContent');

  const plans = await Plan.find({ status: 'active', type: 'one_time' })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const sessionIds = plans
    .map((p) => p.sessionId)
    .filter((id): id is string => Boolean(id && mongoose.isValidObjectId(id)));
  const sessions =
    sessionIds.length > 0
      ? await Session.find({ _id: { $in: sessionIds } }).select({ title: 1 }).lean()
      : [];
  const sessionTitle = new Map(
    sessions.map((s) => [String(s._id), String(s.title || '')])
  );

  const mentorship = plans.filter((p) => p.isLandingPlan);
  const workshopPool = plans.filter((p) => !p.isLandingPlan);

  console.log('\nPlans (active one-time):');
  for (const p of plans) {
    const sid = p.sessionId ? sessionTitle.get(String(p.sessionId)) || p.sessionId : 'All';
    console.log(
      `  - ${p.name} | ${p.currency} ${p.price}` +
        (p.isLandingPlan ? ' [MENTORSHIP]' : '') +
        (p.isWorkshopPlan ? ' [WORKSHOP DEFAULT]' : '') +
        ` | session: ${sid}`
    );
  }

  const doc = await SiteContent.findOne({ key: 'programs' });
  if (!doc) {
    console.error('\nNo SiteContent key=programs. Open Admin → Landing Content → Programs once, or run seed:content.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const data = (doc.data || {}) as {
    cards?: Array<{
      id: string;
      title?: string;
      status?: string;
      planId?: string | null;
      priceLabel?: string;
    }>;
  };
  const cards = Array.isArray(data.cards) ? [...data.cards] : [];
  if (cards.length === 0) {
    console.error('\nPrograms content has no cards.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('\nProgram cards before:');
  for (const c of cards) {
    console.log(
      `  - [${c.status || 'locked'}] ${c.title || c.id} → planId=${c.planId || '(none)'}`
    );
  }

  const openIndexes = cards
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.status === 'open');

  if (openIndexes.length === 0) {
    console.warn('\nNo open program cards. Set status to Open in admin first.');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (workshopPool.length === 0) {
    console.error(
      '\nNo non-Mentorship active one-time plans. Create workshop plans under Pricing (do not set Mentorship flag).'
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const usedPlanIds = new Set<string>();
  const assignments: Array<{ cardTitle: string; planName: string; planId: string }> =
    [];

  for (const { c, i } of openIndexes) {
    const title = String(c.title || c.id);
    let best: (typeof workshopPool)[number] | null = null;
    let bestScore = -1;
    for (const p of workshopPool) {
      const id = String(p._id);
      if (usedPlanIds.has(id)) continue;
      const st = p.sessionId ? sessionTitle.get(String(p.sessionId)) || null : null;
      const score = scoreMatch(String(p.name), st, title);
      // Prefer name/session match; fall back to sort order via modest baseline
      const effective = score > 0 ? score : 0;
      if (effective > bestScore) {
        bestScore = effective;
        best = p;
      }
    }
    // If nothing matched by name, take next unused by sort order
    if (!best || bestScore <= 0) {
      best =
        workshopPool.find((p) => !usedPlanIds.has(String(p._id))) || null;
    }
    if (!best) {
      console.warn(`  ! No free plan left for open card: ${title}`);
      continue;
    }
    const planId = String(best._id);
    usedPlanIds.add(planId);
    cards[i] = {
      ...c,
      planId,
      priceLabel: `${best.currency} ${Number(best.price).toLocaleString('en-US')}`,
    };
    assignments.push({
      cardTitle: title,
      planName: String(best.name),
      planId,
    });
  }

  console.log('\nAssignments:');
  if (assignments.length === 0) {
    console.log('  (none)');
  } else {
    for (const a of assignments) {
      console.log(`  ${a.cardTitle} → ${a.planName} (${a.planId})`);
    }
  }

  if (mentorship.length > 0) {
    console.log('\nMentorship / Fees Structure (unchanged, not linked to Programs):');
    for (const m of mentorship) {
      console.log(`  - ${m.name} | ${m.currency} ${m.price}`);
    }
  } else {
    console.warn(
      '\nNo Mentorship plan (isLandingPlan). Set one under Pricing so Fees Structure shows a default price.'
    );
  }

  const hasWorkshopDefault = workshopPool.some((p) => p.isWorkshopPlan);
  if (!hasWorkshopDefault && assignments.length > 0) {
    const defaultId = assignments[0].planId;
    console.log(
      `\nNo Workshop default flag set — will mark "${assignments[0].planName}" as isWorkshopPlan (Nav/Hero Reserve).`
    );
    if (!dryRun) {
      await Plan.updateMany(
        { isWorkshopPlan: true },
        { $set: { isWorkshopPlan: false } }
      );
      await Plan.updateOne(
        { _id: defaultId },
        { $set: { isWorkshopPlan: true, isLandingPlan: false } }
      );
    }
  }

  if (dryRun) {
    console.log('\nDry run — no DB write.');
    await mongoose.disconnect();
    return;
  }

  doc.data = { ...data, cards };
  doc.version = (doc.version || 1) + 1;
  doc.markModified('data');
  await doc.save();

  console.log(`\nSaved programs content (version ${doc.version}).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
