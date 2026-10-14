import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Setting } from '@/models/Setting';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { buildEmailSettingsStatus } from '@/lib/email/settingsStatus';
import { sendOutboundEmail } from '@/lib/email/sender';
import { rateLimit, identityHash } from '@/lib/public/rateLimit';
import { getEmailFrom, getSiteUrl } from '@/lib/email/config';

export const runtime = 'nodejs';

const testBodyFields = z.object({
  to: z.string().trim().email('Enter a valid email address').max(120),
});

type EmailMeta = {
  lastTestAt?: Date;
  lastTestOk?: boolean;
  lastTestMessage?: string;
};

function readEmailMeta(doc: unknown): EmailMeta {
  if (!doc || typeof doc !== 'object') return {};
  const d = doc as Record<string, unknown>;
  return {
    lastTestAt:
      d.lastTestAt instanceof Date
        ? d.lastTestAt
        : typeof d.lastTestAt === 'string'
          ? new Date(d.lastTestAt)
          : undefined,
    lastTestOk: typeof d.lastTestOk === 'boolean' ? d.lastTestOk : undefined,
    lastTestMessage:
      typeof d.lastTestMessage === 'string' ? d.lastTestMessage : '',
  };
}

export async function GET() {
  const gate = await withAdminRead();
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const doc = await Setting.findOne({ key: 'email' }).lean();
    return NextResponse.json({
      email: buildEmailSettingsStatus(readEmailMeta(doc)),
    });
  } catch (err) {
    console.error(
      '[admin settings email GET]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}

export async function POST(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const rl = await rateLimit(
      `admin:email-test:${identityHash(gate.admin.sub)}`,
      5,
      3600
    );
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: `Too many test emails. Try again in ${rl.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = testBodyFields.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid email');
    }

    const site = getSiteUrl() || 'https://ahmixen.com';
    const result = await sendOutboundEmail({
      to: parsed.data.to,
      subject: 'AhmiXen test email',
      text: `This is a test email from AhmiXen admin.\nSite: ${site}\nFrom: ${getEmailFrom() || '(not set)'}`,
      html: `<p>This is a test email from <strong>AhmiXen</strong> admin.</p><p>If you received this, SMTP is working.</p>`,
    });

    const ok = result.status === 'sent';
    const message =
      result.status === 'sent'
        ? result.note === 'logged'
          ? 'Test email logged (EMAIL_MODE=log). Nothing was sent over the network.'
          : 'Test email sent.'
        : result.status === 'skipped'
          ? result.reason
          : result.reason;

    await Setting.findOneAndUpdate(
      { key: 'email' },
      {
        $set: {
          key: 'email',
          lastTestAt: new Date(),
          lastTestOk: ok,
          lastTestMessage: message.slice(0, 200),
        },
      },
      { upsert: true }
    );

    await logAudit({
      adminId: gate.admin.sub,
      action: 'email.test',
      entity: 'settings',
      entityId: 'email',
      meta: { ok, status: result.status },
    });

    const doc = await Setting.findOne({ key: 'email' }).lean();
    return NextResponse.json({
      ok,
      message,
      email: buildEmailSettingsStatus(readEmailMeta(doc)),
    });
  } catch (err) {
    console.error(
      '[admin settings email POST]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}
