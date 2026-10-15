/**
 * One-off: inspect recent EmailJob rows (no secrets printed).
 * Usage: npx tsx scripts/inspect-email-jobs.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db';
import { EmailJob } from '../src/models/EmailJob';
import {
  getEmailMode,
  isSmtpConfigured,
  getSmtpConfig,
  getEmailFrom,
  getSiteUrl,
  getEmailAllowlist,
} from '../src/lib/email/config';
import { recipientAllowed } from '../src/lib/email/sender';

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
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  console.log('mode=', getEmailMode());
  console.log('smtpConfigured=', isSmtpConfigured());
  console.log('siteUrl=', getSiteUrl());
  console.log('fromSet=', Boolean(getEmailFrom()));
  console.log('smtpHostSet=', Boolean(getSmtpConfig().host));
  console.log('smtpUserSet=', Boolean(getSmtpConfig().user));
  console.log('allowlistLen=', getEmailAllowlist().length);
  console.log('NODE_ENV=', process.env.NODE_ENV);

  await connectToDatabase();
  const jobs = await EmailJob.find({})
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  for (const j of jobs) {
    const domain = (j.to || '').includes('@') ? j.to.split('@')[1] : '?';
    const allowed = recipientAllowed(j.to || '');
    console.log(
      JSON.stringify({
        type: j.type,
        status: j.status,
        attempts: j.attempts,
        lastError: j.lastError || '',
        lastNote: j.lastNote || '',
        toDomain: domain,
        recipientAllowedNow: allowed.ok,
        skipReason: allowed.reason || '',
        updatedAt: j.updatedAt,
      })
    );
  }
  console.log('count=', jobs.length);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
