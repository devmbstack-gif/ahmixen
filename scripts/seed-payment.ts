/**
 * Idempotent: creates default payment settings if missing.
 *
 * Usage: npm run seed:payment
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { Setting } from '../src/models/Setting';
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

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertScriptAllowed(uri, 'seed:payment');

  await mongoose.connect(uri);
  const existing = await Setting.findOne({ key: 'payment' });
  if (existing) {
    console.log('Payment settings already exist — skipped');
    return;
  }

  await Setting.create({
    key: 'payment',
    bankTransferEnabled: false,
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    paymentInstructions: '',
    cardPaymentEnabled: false,
    version: 1,
    updatedBy: 'seed',
  });

  console.log('Created default payment settings (bank transfer disabled)');
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
