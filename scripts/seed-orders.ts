/**
 * Production-safe: does NOT insert sample bookings.
 * Only clears prior isTestData / harness orders (same as seed:orders:clear).
 *
 * Usage: npm run seed:orders
 */
import mongoose from 'mongoose';
import {
  assertSeedAllowed,
  clearTestOrders,
  loadEnvFile,
} from './seed-orders-clear';

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertSeedAllowed(uri);

  await mongoose.connect(uri);
  const cleared = await clearTestOrders();
  console.log('seed:orders — sample inserts disabled; cleared test bookings only:');
  console.log(JSON.stringify(cleared, null, 2));
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
