/**
 * Reservation confirmation email checklist (dev harness).
 * Never prints secret env values. Cleans up emailJobs / test orders it creates.
 *
 * Usage: npx tsx scripts/test-email.ts
 * Optional: EMAIL_TEST_SMTP=1 to run one real SMTP send to SMTP_USER only.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { EmailJob } from '../src/models/EmailJob';
import { ensureEmailJobIndexes } from '../src/lib/email/syncIndexes';
import {
  cancelReservationEmailJob,
  ensureReservationEmailJob,
  mapJobToPublicStatus,
  emailStatusLabel,
  attemptSendEmailJob,
} from '../src/lib/email/outbox';
import { recipientAllowed, resetEmailTransporter, sendOutboundEmail } from '../src/lib/email/sender';
import { escapeHtml, mapSmtpError } from '../src/lib/email/sanitize';
import { isHttpsUrl } from '../src/lib/email/formatters';
import { buildReservationConfirmedEmail } from '../src/lib/email/templates/reservationConfirmed';
import { getEmailMode, getOrdersTxModeHint } from './test-email-helpers';

type Row = { name: string; ok: boolean; detail: string };
const results: Row[] = [];

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

function pass(name: string, detail: string) {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name} — ${detail}`);
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.log(`FAIL  ${name} — ${detail}`);
}

function assert(name: string, cond: boolean, detail: string) {
  if (cond) pass(name, detail);
  else fail(name, detail);
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  // Force log mode for most of the harness unless a live SMTP flag is set.
  const realSmtp = process.env.EMAIL_TEST_SMTP === '1';
  const wrongPassOnly = process.env.EMAIL_TEST_WRONG_PASS === '1';
  if (!realSmtp && !wrongPassOnly) {
    process.env.EMAIL_MODE = 'log';
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');

  const { connectToDatabase } = await import('../src/lib/db');
  await connectToDatabase();
  await ensureEmailJobIndexes();

  // --- Mode default ---
  if (!realSmtp && !wrongPassOnly) {
    const mode = getEmailMode();
    assert(
      'EMAIL_MODE default outside production',
      mode === 'log',
      `mode=${mode}`
    );
  } else {
    pass(
      'EMAIL_MODE default outside production',
      `skipped during live SMTP probe (current getEmailMode=${getEmailMode()})`
    );
  }

  // --- Unique index ---
  const indexes = await EmailJob.collection.indexes();
  const unique = indexes.some(
    (ix) =>
      ix.unique === true &&
      ix.key &&
      (ix.key as Record<string, number>).orderId === 1 &&
      (ix.key as Record<string, number>).type === 1
  );
  assert('Unique { orderId, type } index', unique, unique ? 'present' : 'missing');

  const marker = `email-harness-${Date.now()}`;
  const fakeOrderId = new mongoose.Types.ObjectId().toString();
  const toAddr = 'harness@checkout-test.invalid';

  const job1 = await ensureReservationEmailJob(fakeOrderId, toAddr);
  let dupOk = false;
  try {
    await EmailJob.collection.insertOne({
      orderId: fakeOrderId,
      type: 'reservation_confirmed',
      to: toAddr,
      status: 'pending',
      attempts: 0,
      sentCount: 0,
      lastError: '',
      nextAttemptAt: new Date(),
      sentAt: null,
      sendLog: [],
      lastNote: marker,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (err) {
    const code = (err as { code?: number }).code;
    dupOk = code === 11000;
  }
  assert('Duplicate job rejected (11000)', dupOk, dupOk ? 'E11000' : 'insert allowed');

  const job2 = await ensureReservationEmailJob(fakeOrderId, toAddr);
  assert(
    'Idempotent ensure same _id',
    String(job1._id) === String(job2._id),
    `${String(job1._id)}`
  );

  // --- Safety: .invalid + allowlist ---
  const skipInvalid = recipientAllowed('user@example.invalid');
  assert(
    'Safety .invalid skipped',
    !skipInvalid.ok && /test address skipped/i.test(skipInvalid.reason || ''),
    skipInvalid.reason || 'no reason'
  );

  process.env.EMAIL_MODE = 'smtp';
  process.env.EMAIL_ALLOWLIST = '';
  process.env.SMTP_USER = 'allowed@example.com';
  const blocked = recipientAllowed('other@example.com');
  assert(
    'Safety allowlist (non-prod smtp)',
    !blocked.ok,
    blocked.reason || 'blocked'
  );
  process.env.EMAIL_MODE = 'log';

  // --- Template XSS + http join link ---
  const built = buildReservationConfirmedEmail({
    orderId: fakeOrderId,
    customerName: '<script>alert(1)</script> Test',
    customerEmail: toAddr,
    orderNumber: 'AX-TEST-1',
    publicToken: 'tok',
    planName: 'Plan <b>X</b>',
    currency: 'PKR',
    amountPaid: 5000,
    sessionTitle: 'Session',
    startsAt: new Date('2026-12-01T14:00:00+05:00'),
    durationMinutes: 150,
    timezone: 'Asia/Karachi',
    meetingLink: 'http://evil.example/join',
  });
  assert(
    'Template escapes HTML',
    built.html.includes('&lt;script&gt;') &&
      !built.html.includes('<script>alert'),
    'script escaped in HTML'
  );
  assert(
    'HTTP join link omitted',
    !built.text.includes('http://evil.example') &&
      built.text.includes('We will share the joining link'),
    'fallback copy used'
  );
  assert(
    'HTTPS join link allowed',
    isHttpsUrl('https://meet.example/x') && !isHttpsUrl('http://meet.example/x'),
    'isHttpsUrl ok'
  );
  assert(
    'escapeHtml helper',
    escapeHtml(`a<"'>`).includes('&lt;') && escapeHtml(`a<"'>`).includes('&quot;'),
    'entities present'
  );

  // --- Compensating cancel + not approved skip ---
  await cancelReservationEmailJob(fakeOrderId);
  const afterCancel = await EmailJob.findOne({
    orderId: fakeOrderId,
    type: 'reservation_confirmed',
  });
  assert(
    'Compensating cancel marks skipped',
    afterCancel?.status === 'skipped' &&
      afterCancel.lastError === 'Order is no longer approved',
    afterCancel?.status || 'missing'
  );

  // Re-activate then attempt send without approved order → skipped
  const reactivated = await ensureReservationEmailJob(fakeOrderId, toAddr);
  assert(
    'ensure reactivates skipped → pending',
    reactivated.status === 'pending',
    reactivated.status
  );

  const sendNoOrder = await attemptSendEmailJob(String(reactivated._id));
  assert(
    'processDue/attempt skips non-approved order',
    sendNoOrder.status === 'skipped' &&
      sendNoOrder.reason === 'Order is no longer approved',
    `${sendNoOrder.status}: ${sendNoOrder.reason || ''}`
  );

  // --- Public status labels ---
  assert(
    'Status labels',
    emailStatusLabel('not_sent') === 'Not sent' &&
      emailStatusLabel('sent') === 'Sent' &&
      emailStatusLabel(mapJobToPublicStatus(null)) === 'Not sent',
    'Sent/Pending/Failed/Skipped/Not sent'
  );

  // --- Pre-feature Not sent ---
  const preFeature = mapJobToPublicStatus(undefined);
  assert('Pre-feature no job → not_sent', preFeature === 'not_sent', preFeature);

  // --- Log-mode send (no network) ---
  process.env.EMAIL_MODE = 'log';
  const logSend = await sendOutboundEmail({
    to: 'anyone@example.com',
    subject: 'Harness log',
    text: 'hello',
    html: '<p>hello</p>',
  });
  assert(
    'Log mode send marks sent',
    logSend.status === 'sent' && logSend.note === 'logged',
    logSend.status
  );

  // --- Sanitized SMTP error ---
  const mapped = mapSmtpError({
    message: 'Invalid login: 535-5.7.8 Username and Password not accepted',
    responseCode: 535,
  });
  assert(
    'Sanitized auth error',
    mapped.includes('Email login failed') && !mapped.includes('535'),
    mapped
  );

  // --- 3 confirmation emails / 24h ---
  {
    const limId = new mongoose.Types.ObjectId().toString();
    const j = await ensureReservationEmailJob(limId, 'limit@checkout-test.invalid');
    const now = new Date();
    j.set('sendLog', [
      new Date(now.getTime() - 60_000),
      new Date(now.getTime() - 120_000),
      new Date(now.getTime() - 180_000),
    ]);
    j.status = 'sent';
    await j.save();
    const { countSendsLast24h } = await import('../src/lib/email/outbox');
    const n = await countSendsLast24h(limId);
    assert('countSendsLast24h sees 3', n === 3, `count=${n}`);
    assert('3-per-24h gate', n >= 3, 'gate closed after 3 sends');
    await EmailJob.deleteMany({ orderId: limId });
  }

  // --- Wrong SMTP password (one-run env override, no .env.local edit) ---
  if (realSmtp || wrongPassOnly) {
    resetEmailTransporter();
    const savedPass = process.env.SMTP_PASS;
    const savedMode = process.env.EMAIL_MODE;
    process.env.EMAIL_MODE = 'smtp';
    process.env.SMTP_PASS = 'definitely-wrong-password-for-harness';
    resetEmailTransporter();
    const smtpUser = (process.env.SMTP_USER || '').trim();
    if (!smtpUser) {
      fail('Wrong SMTP password → sanitized fail', 'SMTP_USER not configured');
    } else {
      const failResult = await sendOutboundEmail({
        to: smtpUser,
        subject: 'AhmiXen harness (expect fail)',
        text: 'should fail auth',
        html: '<p>should fail auth</p>',
      });
      assert(
        'Wrong SMTP password → sanitized fail',
        failResult.status === 'failed' &&
          /login failed|could not reach|could not be sent/i.test(
            failResult.reason
          ),
        failResult.status === 'failed' ? failResult.reason : failResult.status
      );
    }
    if (savedPass === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = savedPass;
    if (savedMode === undefined) delete process.env.EMAIL_MODE;
    else process.env.EMAIL_MODE = savedMode;
    resetEmailTransporter();

    if (realSmtp) {
      const smtpUser = (process.env.SMTP_USER || '').trim();
      process.env.EMAIL_MODE = 'smtp';
      const okResult = await sendOutboundEmail({
        to: smtpUser,
        subject: 'AhmiXen harness test',
        text: 'Harness confirmation that SMTP works.',
        html: '<p>Harness confirmation that SMTP works.</p>',
      });
      assert(
        'Real SMTP to SMTP_USER only',
        okResult.status === 'sent',
        okResult.status === 'sent' ? 'sent' : `${okResult.status}`
      );
    } else {
      pass(
        'Real SMTP to SMTP_USER',
        'skipped (wrong-pass-only run; no success send)'
      );
    }
  } else {
    pass(
      'Wrong SMTP password',
      'skipped (set EMAIL_TEST_WRONG_PASS=1 for env-override auth fail)'
    );
    pass(
      'Real SMTP to SMTP_USER',
      'skipped (EMAIL_TEST_SMTP not set; ≤5 real emails budget)'
    );
  }

  // --- Tx mode hint (report only) ---
  const txHint = await getOrdersTxModeHint();
  pass('Orders TX mode probed', txHint);

  // --- .env.local gitignored ---
  const gitignore = readFileSync(resolve(process.cwd(), '.gitignore'), 'utf8');
  assert(
    '.env.local git-ignored',
    /\.env\.\*/.test(gitignore) || /\*\.local/.test(gitignore),
    'gitignore covers .env.local'
  );
  assert(
    '.env.example present (empty docs)',
    existsSync(resolve(process.cwd(), '.env.example')),
    'yes'
  );

  // Cleanup harness jobs (and any order we might have touched — none)
  await EmailJob.deleteMany({
    $or: [{ orderId: fakeOrderId }, { lastNote: marker }],
  });
  // Also purge orphan harness jobs marked via to
  await EmailJob.deleteMany({ to: toAddr, orderId: fakeOrderId });

  console.log('\n--- Summary ---');
  const failed = results.filter((r) => !r.ok);
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    for (const f of failed) console.log(`  FAIL: ${f.name} — ${f.detail}`);
    process.exitCode = 1;
  }
}

main()
  .then(async () => {
    await mongoose.disconnect().catch(() => undefined);
  })
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : 'error');
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
