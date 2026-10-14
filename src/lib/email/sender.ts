import { createTransport, type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  getEmailAllowlist,
  getEmailFrom,
  getEmailMode,
  getEmailReplyTo,
  getSmtpConfig,
  isSmtpConfigured,
  parseEmailAddress,
} from './config';
import { mapSmtpError, stripLineBreaks } from './sanitize';

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
};

export type SendResult =
  | { ok: true; status: 'sent'; note?: string }
  | { ok: true; status: 'skipped'; reason: string }
  | { ok: false; status: 'failed'; reason: string };

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const { host, port, secure, user, pass } = getSmtpConfig();
  const options: SMTPTransport.Options = {
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };
  if (!secure) {
    options.requireTLS = true;
  }
  transporter = createTransport(options);
  return transporter;
}

/** Reset cached transporter (tests). */
export function resetEmailTransporter(): void {
  transporter = null;
}

export function recipientAllowed(to: string): {
  ok: boolean;
  reason?: string;
} {
  const addr = parseEmailAddress(to);
  if (!addr) return { ok: false, reason: 'Recipient is not allowed in this environment' };
  if (addr.endsWith('.invalid')) {
    return { ok: false, reason: 'Test address skipped' };
  }

  const mode = getEmailMode();
  if (mode !== 'smtp') return { ok: true };

  const isProd = process.env.NODE_ENV === 'production';
  const allowlist = getEmailAllowlist();
  const smtpUser = getSmtpConfig().user.toLowerCase();

  if (!isProd) {
    if (allowlist.length > 0) {
      if (!allowlist.includes(addr)) {
        return { ok: false, reason: 'Recipient is not allowed in this environment' };
      }
    } else if (addr !== smtpUser) {
      return { ok: false, reason: 'Recipient is not allowed in this environment' };
    }
  } else if (allowlist.length > 0 && !allowlist.includes(addr)) {
    return { ok: false, reason: 'Recipient is not allowed in this environment' };
  }

  return { ok: true };
}

export async function sendOutboundEmail(
  mail: OutboundEmail
): Promise<SendResult> {
  const to = stripLineBreaks(mail.to);
  const subject = stripLineBreaks(mail.subject);
  const allowed = recipientAllowed(to);
  if (!allowed.ok) {
    return {
      ok: true,
      status: 'skipped',
      reason: allowed.reason || 'Recipient is not allowed in this environment',
    };
  }

  const mode = getEmailMode();
  if (mode === 'log') {
    console.info('[email:log]', {
      to: '(redacted)',
      subject,
      textPreview: mail.text.slice(0, 500),
      attachments: (mail.attachments || []).map((a) => a.filename),
    });
    // Full body logged for local verification without printing recipient
    console.info('[email:log:body]\n' + mail.text);
    return { ok: true, status: 'sent', note: 'logged' };
  }

  if (!isSmtpConfigured()) {
    return { ok: false, status: 'failed', reason: 'Email is not configured' };
  }

  try {
    const from = getEmailFrom();
    const replyTo = getEmailReplyTo();
    const transport = getTransporter();
    await transport.sendMail({
      from,
      to,
      subject,
      text: mail.text,
      html: mail.html,
      ...(replyTo ? { replyTo } : {}),
      attachments: (mail.attachments || []).map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    return { ok: true, status: 'sent' };
  } catch (err) {
    return { ok: false, status: 'failed', reason: mapSmtpError(err) };
  }
}

export { fromAddressMismatch } from './config';
