/**
 * Idempotent: creates one open landing session from WORKSHOP_CONFIG
 * only if the sessions collection is empty.
 *
 * Usage: npm run seed:session
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { WORKSHOP_CONFIG } from '../src/data/workshopData';
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

function durationMinutesFromConfig(): number {
  const label = WORKSHOP_CONFIG.durationLabel || '';
  const match = label.match(/([\d.]+)/);
  if (match) {
    const hours = Number(match[1]);
    if (!Number.isNaN(hours) && hours > 0) return Math.round(hours * 60);
  }
  return 150;
}

function titleFromConfig(): string {
  return [
    WORKSHOP_CONFIG.titlePrefix,
    WORKSHOP_CONFIG.titleDuration,
    WORKSHOP_CONFIG.titleHighlight,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertScriptAllowed(uri, 'seed:session');

  await mongoose.connect(uri);
  const col = mongoose.connection.collection('sessions');
  const count = await col.countDocuments();
  if (count > 0) {
    console.log(`Sessions already exist (${count}). No changes made.`);
    await mongoose.disconnect();
    return;
  }

  const startsAt = new Date(WORKSHOP_CONFIG.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error('Invalid WORKSHOP_CONFIG.startsAt');
  }

  const now = new Date();
  await col.insertOne({
    title: titleFromConfig(),
    description: WORKSHOP_CONFIG.tagline || '',
    startsAt,
    durationMinutes: durationMinutesFromConfig(),
    timezone: 'Asia/Karachi',
    status: 'open',
    seatsTotal: WORKSHOP_CONFIG.seatsTotal,
    seatsConfirmed: 0,
    holds: [],
    holdHours: 24,
    showLimitedSeatsBadge: true,
    meetingLink: '',
    recordingUrl: '',
    isLandingActive: true,
    version: 1,
    createdBy: 'seed',
    updatedBy: 'seed',
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Created landing session: ${titleFromConfig()} @ ${WORKSHOP_CONFIG.startsAt}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
