/**
 * Development-only public checkout API harness.
 * Uses only *@checkout-test.invalid emails. Sends Origin = BASE_URL on every request.
 * Each test group uses its own fake x-forwarded-for so rate limits do not cross groups.
 *
 * Usage: npm run test:checkout
 * Requires: npm run dev (BASE_URL, default http://localhost:3000)
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { Session } from '../src/models/Session';
import { Setting } from '../src/models/Setting';
import {
  holdSeat,
  releaseHold,
  SeatError,
  getCheckoutHoldMinutes,
} from '../src/lib/orders/seats';
import { tinyPngBuffer } from '../src/lib/orders/gridfs';
import { getSeatSummary } from '../src/lib/sessions/seats';

type Row = { name: string; pass: boolean; detail: string };

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

function assertDevOnly(uri?: string) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('test:checkout is development-only');
  }
  if (uri) {
    const dbName = uri.split('/').pop()?.split('?')[0] || '';
    const looksDev = /dev|test|local|admixen|ahmixen|staging/i.test(dbName);
    if (!looksDev && process.env.ALLOW_SEED !== 'true') {
      throw new Error(
        `Database "${dbName}" does not look like a dev database. Set ALLOW_SEED=true to override.`
      );
    }
  }
}

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
);

/** Stable TEST-NET IPs unique per group for this run. */
const RUN = Date.now() % 100;
function groupIp(group: number): string {
  return `203.0.113.${((RUN + group * 7) % 200) + 1}`;
}

const IP = {
  checkout: groupIp(1),
  leads: groupIp(2),
  orders: groupIp(4),
  status: groupIp(5),
  payment: groupIp(6),
  proof: groupIp(7),
  honeypot: groupIp(8),
  origin: groupIp(9),
  rateLimit: groupIp(10),
  validation: groupIp(11),
};

async function api(
  path: string,
  opts: {
    method?: string;
    ip: string;
    body?: unknown;
    form?: FormData;
    origin?: string;
  }
): Promise<{ status: number; json: any; headers: Headers }> {
  const headers: Record<string, string> = {
    Origin: opts.origin ?? BASE_URL,
    'x-forwarded-for': opts.ip,
  };
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || (opts.body || opts.form ? 'POST' : 'GET'),
    headers,
    body,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, headers: res.headers };
}

function email(tag: string): string {
  return `${tag}.${randomBytes(3).toString('hex')}@checkout-test.invalid`;
}

function printTable(rows: Row[]) {
  const nameW = Math.max(8, ...rows.map((r) => r.name.length));
  const detailW = Math.max(8, ...rows.map((r) => r.detail.length));
  const line = (a: string, b: string, c: string) =>
    `| ${a.padEnd(nameW)} | ${b.padEnd(6)} | ${c.padEnd(detailW)} |`;
  console.log(line('Test', 'Result', 'Detail'));
  console.log(
    `| ${'-'.repeat(nameW)} | ${'-'.repeat(6)} | ${'-'.repeat(detailW)} |`
  );
  for (const r of rows) {
    console.log(line(r.name, r.pass ? 'PASS' : 'FAIL', r.detail));
  }
  const failed = rows.filter((r) => !r.pass).length;
  console.log(`\n${rows.length - failed}/${rows.length} passed`);
  return failed === 0;
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertDevOnly(uri);

  const rows: Row[] = [];
  const push = (name: string, pass: boolean, detail: string) => {
    rows.push({ name, pass, detail });
  };

  // --- checkout GET ---
  {
    const r = await api('/api/public/checkout', { ip: IP.checkout });
    const ok =
      r.status === 200 &&
      r.json?.ok === true &&
      Array.isArray(r.json?.data?.plans) &&
      r.json.data.plans.length > 0;
    push(
      'GET checkout',
      ok,
      ok
        ? `plans=${r.json.data.plans.length} open=${r.json.data.reservationsOpen}`
        : `status=${r.status}`
    );
    if (!ok) {
      printTable(rows);
      process.exit(1);
    }
  }

  const checkout = (
    await api('/api/public/checkout', { ip: IP.checkout })
  ).json.data;
  const planId = checkout.plans[0].id as string;

  await mongoose.connect(uri);

  // Payment-info requires bank transfer enabled
  {
    const pay = await Setting.findOne({ key: 'payment' });
    if (!pay || !pay.bankTransferEnabled) {
      await Setting.findOneAndUpdate(
        { key: 'payment' },
        {
          $set: {
            bankTransferEnabled: true,
            bankName: pay?.bankName || 'Test Bank',
            accountTitle: pay?.accountTitle || 'AhmiXen Test',
            accountNumber: pay?.accountNumber || '000011112222',
            iban: pay?.iban || 'PK00TEST0000000000000000',
            paymentInstructions:
              pay?.paymentInstructions || 'Transfer and upload proof',
            cardPaymentEnabled: Boolean(pay?.cardPaymentEnabled),
            version: (pay?.version || 0) + 1,
            updatedBy: 'test:checkout',
          },
        },
        { upsert: true }
      );
    }
  }

  const leadEmail = email('lead');
  const orderEmail = email('order');

  // --- leads ---
  {
    const r = await api('/api/public/leads', {
      ip: IP.leads,
      body: {
        name: 'Checkout Lead',
        email: leadEmail,
        phone: '03001234567',
        profession: 'Engineer',
        message: 'hi',
        utm: { source: 'test', campaign: 'checkout' },
      },
    });
    push(
      'POST leads create',
      r.status === 200 && r.json?.ok === true,
      `status=${r.status}`
    );

    const r2 = await api('/api/public/leads', {
      ip: IP.leads,
      body: {
        name: 'Checkout Lead 2',
        email: leadEmail,
        phone: '03001234567',
        message: 'again',
      },
    });
    push(
      'POST leads upsert',
      r2.status === 200 && r2.json?.ok === true,
      `status=${r2.status}`
    );

    const hp = await api('/api/public/leads', {
      ip: IP.leads,
      body: {
        name: 'Bot',
        email: email('bot'),
        phone: '03001234567',
        website: 'http://spam.example',
      },
    });
    push(
      'POST leads honeypot',
      hp.status === 200 && hp.json?.ok === true,
      `status=${hp.status}`
    );
  }

  // --- orders create ---
  let publicToken = '';
  {
    const r = await api('/api/public/orders', {
      ip: IP.orders,
      body: {
        planId,
        name: 'Checkout Buyer',
        email: orderEmail,
        phone: '+92 300 1234567',
        profession: 'Designer',
        utm: { source: 'harness', campaign: 'orders' },
      },
    });
    const ok =
      r.status === 200 &&
      r.json?.ok === true &&
      typeof r.json?.data?.publicToken === 'string' &&
      r.json.data.publicToken.length >= 32;
    publicToken = ok ? r.json.data.publicToken : '';
    push(
      'POST orders create',
      ok,
      ok
        ? `status=${r.json.data.status} final=${r.json.data.amounts.finalPrice}`
        : `status=${r.status} code=${r.json?.error?.code || '?'}`
    );

    const again = await api('/api/public/orders', {
      ip: IP.orders,
      body: {
        planId,
        name: 'Checkout Buyer',
        email: orderEmail,
        phone: '03001234567',
      },
    });
    push(
      'POST orders idempotent live',
      again.status === 200 &&
        again.json?.ok === true &&
        again.json?.data?.alreadyExisted === true &&
        again.json?.data?.publicToken === publicToken,
      `status=${again.status} existed=${again.json?.data?.alreadyExisted}`
    );

    const hp = await api('/api/public/orders', {
      ip: IP.honeypot,
      body: {
        planId,
        name: 'Bot',
        email: email('orderbot'),
        phone: '03001234567',
        website: 'http://spam.example',
      },
    });
    push(
      'POST orders honeypot',
      hp.status === 200 &&
        hp.json?.ok === true &&
        hp.json?.data?.publicToken === 'honeypot',
      `status=${hp.status}`
    );
  }

  // --- bad origin ---
  {
    const r = await api('/api/public/orders', {
      ip: IP.origin,
      origin: 'http://evil.example',
      body: {
        planId,
        name: 'Evil',
        email: email('evil'),
        phone: '03001234567',
      },
    });
    push(
      'POST orders bad Origin',
      r.status === 403 && r.json?.error?.code === 'forbidden',
      `status=${r.status}`
    );
  }

  // --- validation ---
  {
    const r = await api('/api/public/orders', {
      ip: IP.validation,
      body: {
        planId,
        name: 'X',
        email: 'not-an-email',
        phone: '12',
      },
    });
    push(
      'POST orders invalid input',
      r.status === 400 && r.json?.ok === false,
      `status=${r.status}`
    );
  }

  // --- order status + payment-info ---
  if (publicToken) {
    const st = await api(`/api/public/orders/${publicToken}`, {
      ip: IP.status,
    });
    const masked = String(st.json?.data?.maskedEmail || '');
    push(
      'GET order status',
      st.status === 200 &&
        st.json?.ok === true &&
        masked.includes('***@') &&
        !masked.startsWith(orderEmail) &&
        typeof st.json?.data?.canReplaceProof === 'boolean',
      `status=${st.status} canReplace=${st.json?.data?.canReplaceProof}`
    );

    const pay = await api(`/api/public/orders/${publicToken}/payment-info`, {
      ip: IP.payment,
    });
    push(
      'GET payment-info',
      pay.status === 200 &&
        pay.json?.ok === true &&
        typeof pay.json?.data?.amountToPay === 'number',
      `status=${pay.status}`
    );

    // proof upload
    const form = new FormData();
    const png = tinyPngBuffer();
    form.append(
      'file',
      new Blob([Uint8Array.from(png)], { type: 'image/png' }),
      'proof.png'
    );
    const pr = await api(`/api/public/orders/${publicToken}/proof`, {
      ip: IP.proof,
      form,
    });
    push(
      'POST proof upload',
      pr.status === 200 &&
        pr.json?.ok === true &&
        pr.json?.data?.status === 'pending_verification',
      `status=${pr.status}`
    );

    const empty = new FormData();
    empty.append('file', new Blob([]), 'empty.png');
    const miss = await api(`/api/public/orders/${publicToken}/proof`, {
      ip: IP.proof,
      form: empty,
    });
    push(
      'POST proof empty file',
      miss.status === 400 && miss.json?.error?.code === 'missing_file',
      `status=${miss.status}`
    );

    const huge = new FormData();
    huge.append(
      'file',
      new Blob([Buffer.alloc(2 * 1024 * 1024 + 50)], { type: 'image/png' }),
      'big.png'
    );
    const tooBig = await api(`/api/public/orders/${publicToken}/proof`, {
      ip: IP.proof,
      form: huge,
    });
    push(
      'POST proof over 2MB',
      tooBig.status === 400 && tooBig.json?.error?.code === 'file_too_large',
      `status=${tooBig.status}`
    );
  } else {
    push('GET order status', false, 'skipped — no token');
    push('GET payment-info', false, 'skipped — no token');
    push('POST proof upload', false, 'skipped — no token');
    push('POST proof empty file', false, 'skipped — no token');
    push('POST proof over 2MB', false, 'skipped — no token');
  }

  // --- rate limits (new campus-friendly defaults) ---
  {
    // Per-email: 5/hour — 6th submission for ONE email is blocked
    const emailIp = groupIp(20);
    const sameEmail = email('same');
    let emailBlocked = false;
    let emailLast = 0;
    for (let i = 0; i < 6; i++) {
      const r = await api('/api/public/leads', {
        ip: emailIp,
        body: {
          name: 'Email Limit',
          email: sameEmail,
          phone: '03001234567',
        },
      });
      emailLast = r.status;
      if (i < 5 && r.status !== 200) break;
      if (i === 5 && r.status === 429) emailBlocked = true;
    }
    push(
      'leads email limit 6th→429',
      emailBlocked,
      emailBlocked ? 'blocked 6th for one email' : `last=${emailLast}`
    );

    // 25 different emails from one IP should all succeed (IP limit is 30/10m)
    const manyIp = groupIp(21);
    let ok25 = 0;
    for (let i = 0; i < 25; i++) {
      const r = await api('/api/public/leads', {
        ip: manyIp,
        body: {
          name: 'Many',
          email: email(`many${i}`),
          phone: '03001234567',
        },
      });
      if (r.status === 200) ok25 += 1;
    }
    push(
      'leads 25 emails same IP',
      ok25 === 25,
      `ok=${ok25}/25`
    );

    // Per-IP: 30/10m — dedicated IP expects 429 on the 31st
    let saw429 = false;
    let lastStatus = 0;
    for (let i = 0; i < 31; i++) {
      const r = await api('/api/public/leads', {
        ip: IP.rateLimit,
        body: {
          name: 'Rate Limit',
          email: email(`rl${i}`),
          phone: '03001234567',
        },
      });
      lastStatus = r.status;
      if (r.status === 429) {
        saw429 = true;
        break;
      }
    }
    push(
      'leads IP limit → 429',
      saw429,
      saw429 ? `got 429 on IP ${IP.rateLimit}` : `lastStatus=${lastStatus}`
    );

    const other = await api('/api/public/leads', {
      ip: IP.leads,
      body: {
        name: 'Other IP',
        email: email('otherip'),
        phone: '03001234567',
      },
    });
    push(
      'rate limit isolated',
      other.status === 200 && other.json?.ok === true,
      `status=${other.status}`
    );
  }

  // --- concurrency holdSeat ---
  {
    const session = await Session.findOne({
      isLandingActive: true,
      status: 'open',
    });
    if (!session) {
      push('holdSeat concurrency', false, 'no open landing session');
    } else {
      const sessionId = String(session._id);
      const before = getSeatSummary(session);
      const n = Math.min(4, Math.max(2, before.available));
      const ids = Array.from({ length: n }, () =>
        new mongoose.Types.ObjectId().toString()
      );
      const results = await Promise.allSettled(
        ids.map((id) => holdSeat(sessionId, id, getCheckoutHoldMinutes()))
      );
      const held = results.filter((r) => r.status === 'fulfilled').length;
      const sold = results.filter(
        (r) =>
          r.status === 'rejected' &&
          r.reason instanceof SeatError
      ).length;
      for (const id of ids) {
        await releaseHold(sessionId, id).catch(() => undefined);
      }
      push(
        'holdSeat concurrency',
        held >= 1 && held + sold === n,
        `held=${held} soldOut=${sold} attempted=${n}`
      );
    }
  }

  await mongoose.disconnect();

  const allOk = printTable(rows);
  console.log(`\nBASE_URL=${BASE_URL}`);
  console.log('Cleanup: npm run test:checkout:clear');
  process.exit(allOk ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : 'error');
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
