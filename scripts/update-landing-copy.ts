/**
 * Apply workshop-focused landing copy + plan/program/session dates.
 *
 * Usage: npx tsx scripts/update-landing-copy.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { assertScriptAllowed } from './dev-guard';
import { WORKSHOP_CONFIG } from '../src/data/workshopData';

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

const WORKSHOP_STARTS_AT = new Date('2026-10-24T22:00:00+05:00');

const MENTORSHIP_FEATURES = [
  'Live group sessions, 5 days a week, 2 hours per session',
  'AI Playgrounds, Local Models, Image and Video Gen',
  'AI Automations with n8n and Agentic AI',
  'MCPs, Connectors and Claude Mastery',
  'Voice Agents',
  'Jerry',
  'Hackathon pitches and Monetisation 101',
  'Recordings after every session',
];

const ACCELERATOR_LEAD =
  '6 months of live sessions, 5 days a week, 2 hours per session';

function scrubFeature(f: string): string | null {
  const t = f.trim();
  if (!t) return null;
  if (/^one live session/i.test(t)) return null;
  if (/14\s*days/i.test(t)) return null;
  // Fix glued typo like "80Master"
  return t.replace(/80\s*Master/gi, 'Master').replace(/80Master/gi, 'Master');
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  assertScriptAllowed(uri, 'update-landing-copy');
  await mongoose.connect(uri);

  const { Plan } = await import('../src/models/Plan');
  const { Session } = await import('../src/models/Session');
  const { SiteContent } = await import('../src/models/SiteContent');

  // --- Landing session date/time ---
  const landing = await Session.findOne({ isLandingActive: true });
  if (landing) {
    landing.startsAt = WORKSHOP_STARTS_AT;
    landing.durationMinutes = 120;
    landing.timezone = 'Asia/Karachi';
    if (typeof landing.title === 'string' && /90\s*day/i.test(landing.title)) {
      landing.title = 'AI Ideas That Make Money (2-Hour Live Workshop)';
    }
    await landing.save();
    console.log(
      `Session OK: ${landing.title} @ ${WORKSHOP_CONFIG.startsAt} (120 min)`
    );
  } else {
    console.warn('No landing-active session found — countdown uses fallback config');
  }

  // --- Plans ---
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
    plans.find(
      (p) =>
        /generalist|accelerator/i.test(String(p.name)) && p.status === 'active'
    ) ||
    plans.find((p) => /generalist|accelerator/i.test(String(p.name))) ||
    null;

  if (workshop) {
    const w = await Plan.findById(workshop._id);
    if (w) {
      w.name = 'Workshop';
      w.shortDescription = w.shortDescription?.replace(/one live session\.?\s*/gi, '').trim()
        || 'Hands-on live workshop. Beginner friendly.';
      if (/one live session/i.test(String(w.shortDescription))) {
        w.shortDescription = 'Hands-on live workshop. Beginner friendly.';
      }
      w.features = (w.features || [])
        .map((f) => scrubFeature(String(f)))
        .filter((f): f is string => Boolean(f));
      await w.save();
      console.log(`Plan Workshop: PKR ${w.price} (${w.features.length} features)`);
    }
  }

  if (mentorship) {
    const m = await Plan.findById(mentorship._id);
    if (m) {
      m.name = 'one month Mentorship';
      m.shortDescription =
        'Group mentorship: master top AI tools live in one month and ship real products.';
      const kept = (m.features || [])
        .map((f) => scrubFeature(String(f)))
        .filter((f): f is string => Boolean(f))
        .filter(
          (f) =>
            !/^live group sessions/i.test(f) &&
            !/14\s*days/i.test(f)
        );
      // Prefer the canonical list; merge any extra unique kept items after lead set
      const lead = MENTORSHIP_FEATURES[0];
      const canonicalRest = MENTORSHIP_FEATURES.slice(1);
      const extras = kept.filter(
        (f) =>
          !canonicalRest.some((c) => c.toLowerCase() === f.toLowerCase()) &&
          f.toLowerCase() !== lead.toLowerCase()
      );
      m.features = [lead, ...canonicalRest, ...extras].slice(0, 8);
      await m.save();
      console.log(`Plan Mentorship: PKR ${m.price}`);
      console.log(`  features: ${m.features.join(' | ')}`);
    }
  }

  if (generalist) {
    const g = await Plan.findById(generalist._id);
    if (g) {
      g.name = 'AI Generalist Accelerator';
      g.shortDescription =
        'A 6-month, hands-on and beginner-friendly program.';
      const cleaned = (g.features || [])
        .map((f) => scrubFeature(String(f)))
        .filter((f): f is string => Boolean(f))
        .filter((f) => !/^6 months of live sessions/i.test(f));
      g.features = [ACCELERATOR_LEAD, ...cleaned].slice(0, 8);
      await g.save();
      console.log(`Plan Accelerator: PKR ${g.price}`);
      console.log(`  features: ${g.features.join(' | ')}`);
    }
  }

  // --- Hero CMS ---
  const hero = await SiteContent.findOne({ key: 'hero' });
  if (hero) {
    const data = { ...(hero.data as Record<string, unknown>) };
    data.mainHeadlineLine1 = 'LEARN 5 REAL AI MONEY IDEAS';
    data.mainHeadlineLine2 = 'IN JUST 2 HOURS';
    hero.data = data;
    hero.version = (hero.version || 1) + 1;
    hero.markModified('data');
    await hero.save();
    console.log(`Hero content v${hero.version}`);
  } else {
    console.warn('No hero SiteContent — defaults from code will apply');
  }

  // --- Programs CMS ---
  const workshopId = workshop ? String(workshop._id) : null;
  const mentorshipId = mentorship ? String(mentorship._id) : null;
  const generalistId = generalist ? String(generalist._id) : null;

  const programsDoc = await SiteContent.findOne({ key: 'programs' });
  const cards = [
    {
      id: 'workshop',
      title: 'Workshop',
      instructorLine: 'Ahmi',
      badges: ['Live Event', '2 Hours'],
      posterAssetId: null as string | null,
      image: '/course4.jpeg',
      href: '/#pricing',
      status: 'open' as const,
      priceLabel: 'PKR 999',
      planId: workshopId,
    },
    {
      id: 'mentorship-1-month',
      title: 'one month Mentorship',
      instructorLine: 'Ahmi',
      badges: ['Group Mentorship', '1 Month', '5 days/week · 2 hrs/session'],
      posterAssetId: null as string | null,
      image: '/course1.jpeg',
      href: '/#pricing',
      status: 'open' as const,
      priceLabel: 'PKR 8,999',
      planId: mentorshipId,
    },
    {
      id: 'ai-generalist-accelerator',
      title: 'AI Generalist Accelerator',
      instructorLine: 'Ahmi',
      badges: ['6 Months', '5 days/week · 2 hrs/session'],
      posterAssetId: null as string | null,
      image: '/course2.jpeg',
      href: '/#pricing',
      status: 'open' as const,
      priceLabel: 'PKR 29,999',
      planId: generalistId,
    },
  ];

  if (programsDoc) {
    const prev = Array.isArray((programsDoc.data as { cards?: unknown[] })?.cards)
      ? ((programsDoc.data as { cards: Array<Record<string, unknown>> }).cards)
      : [];
    const byId = new Map(prev.map((c) => [String(c.id), c]));
    const byTitle = prev.find((c) => /generalist/i.test(String(c.title || '')));
    const merged = cards.map((c) => {
      const old =
        byId.get(c.id) ||
        (c.id === 'ai-generalist-accelerator' ? byTitle : undefined);
      if (!old) return c;
      return {
        ...c,
        posterAssetId:
          (old.posterAssetId as string | null | undefined) ?? c.posterAssetId,
        image: (old.image as string) || c.image,
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
    console.log(`Programs content v${programsDoc.version}`);
  }

  await mongoose.disconnect();
  console.log('\nDone. Hard-refresh the landing page.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
