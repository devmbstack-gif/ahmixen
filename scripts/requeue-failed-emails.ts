/**
 * Reset failed/skipped email jobs to pending so they retry after SMTP is fixed.
 * Usage: npx tsx scripts/requeue-failed-emails.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db';
import { EmailJob } from '../src/models/EmailJob';
import { attemptSendEmailJob } from '../src/lib/email/outbox';

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
  await connectToDatabase();
  const jobs = await EmailJob.find({
    status: { $in: ['failed', 'skipped', 'pending'] },
  })
    .sort({ updatedAt: -1 })
    .limit(30);

  console.log('found=', jobs.length);
  for (const job of jobs) {
    job.status = 'pending';
    job.lastError = '';
    job.nextAttemptAt = new Date();
    await job.save();
    const result = await attemptSendEmailJob(String(job._id));
    console.log(
      JSON.stringify({
        type: job.type,
        status: result.status,
        reason: result.reason || '',
        toDomain: (job.to || '').includes('@') ? job.to.split('@')[1] : '?',
      })
    );
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
