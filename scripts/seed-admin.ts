/**
 * One-time admin seed. Does not overwrite an existing admin with the same email.
 *
 * Usage:
 *   set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME / MONGODB_URI in .env
 *   npm run seed:admin
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
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
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim();

  if (!uri) throw new Error('Missing MONGODB_URI');
  assertScriptAllowed(uri, 'seed:admin');
  if (!email) throw new Error('Missing ADMIN_EMAIL');
  if (!password || password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }
  if (!name) throw new Error('Missing ADMIN_NAME');

  await mongoose.connect(uri);

  const collection = mongoose.connection.collection('admins');
  const existing = await collection.findOne({ email });
  if (existing) {
    console.log('Admin already exists for that email. No changes made.');
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await collection.insertOne({
    email,
    passwordHash,
    name,
    role: 'admin',
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Created admin account.');
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
