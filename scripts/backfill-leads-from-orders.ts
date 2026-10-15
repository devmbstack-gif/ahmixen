/**
 * Create/update Lead rows for live orders that are missing leads.
 * Usage: npx tsx scripts/backfill-leads-from-orders.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db';
import { Order } from '../src/models/Order';
import { upsertLeadFromSubmission } from '../src/lib/leads/upsert';

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
  const orders = await Order.find({
    isLive: true,
    status: {
      $in: ['awaiting_payment', 'pending_verification', 'approved'],
    },
  }).lean();

  console.log('orders=', orders.length);
  let linked = 0;
  for (const order of orders) {
    const { leadId } = await upsertLeadFromSubmission({
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      profession: order.customer.profession || '',
      kind: order.sourceKind === 'workshop' ? 'workshop' : 'general',
      programId: order.programId || '',
      programTitle: order.programTitle || '',
      city: order.workshopMeta?.city || '',
      skillLevel: order.workshopMeta?.skillLevel || '',
      learningGoals: order.workshopMeta?.learningGoals || [],
      paidConfirmed:
        order.status === 'pending_verification' || order.status === 'approved',
      markConverted: order.status === 'approved',
      orderId: String(order._id),
      utm: order.utm,
      message:
        order.sourceKind === 'workshop'
          ? `Workshop booking: ${order.programTitle || 'program'}`
          : 'Reserve form submission',
      proof: order.proof?.fileId
        ? {
            fileId: order.proof.fileId,
            contentType: order.proof.contentType || '',
            size: order.proof.size || 0,
            uploadedAt: order.proof.uploadedAt
              ? new Date(order.proof.uploadedAt)
              : null,
          }
        : null,
    });

    if (!order.leadId || order.leadId !== leadId) {
      await Order.updateOne({ _id: order._id }, { $set: { leadId } });
      linked += 1;
    }
    console.log(
      JSON.stringify({
        orderNumber: order.orderNumber,
        status: order.status,
        leadId,
        emailDomain: order.customer.email.includes('@')
          ? order.customer.email.split('@')[1]
          : '?',
      })
    );
  }
  console.log('linkedOrUpdated=', linked);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
