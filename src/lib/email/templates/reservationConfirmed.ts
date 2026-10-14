import {
  formatAmount,
  formatDuration,
  formatPktDateTime,
  isHttpsUrl,
} from '../formatters';
import { escapeHtml, firstNameFrom, stripLineBreaks } from '../sanitize';
import { getEmailReplyTo, getSiteUrl } from '../config';
import { buildReservationIcs } from '../ics';

export type ReservationConfirmedInput = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  publicToken: string;
  planName: string;
  currency: string;
  amountPaid: number;
  sessionTitle: string;
  startsAt: Date;
  durationMinutes: number;
  timezone: string;
  meetingLink: string;
};

export type BuiltEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
};

export function buildReservationConfirmedEmail(
  input: ReservationConfirmedInput
): BuiltEmail {
  const firstName = firstNameFrom(input.customerName);
  const dateLine = formatPktDateTime(input.startsAt, input.timezone);
  const duration = formatDuration(input.durationMinutes);
  const amount = formatAmount(input.currency, input.amountPaid);
  const site = getSiteUrl();
  const viewUrl = `${site}/pay/${encodeURIComponent(input.publicToken)}`;
  const joinHttps = isHttpsUrl(input.meetingLink) ? input.meetingLink.trim() : '';
  const replyTo = getEmailReplyTo();

  const subject = stripLineBreaks('Your seat is confirmed');

  const rows: Array<[string, string]> = [
    ['Order number', input.orderNumber],
    ['Date and time', dateLine],
    ['Duration', duration],
    ['Plan', input.planName],
    ['Amount paid', amount],
  ];

  const textLines = [
    `Hi ${firstName},`,
    '',
    'Your seat is confirmed. Here are your details:',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
  ];
  if (joinHttps) {
    textLines.push(`Join link: ${joinHttps}`);
  } else {
    textLines.push('We will share the joining link before the session.');
  }
  textLines.push('', `View your reservation: ${viewUrl}`, '', 'See you at the session.');
  if (replyTo) {
    textLines.push('', 'Questions? Just reply to this email.');
  }

  const htmlRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#555;font-size:14px;">${escapeHtml(k)}</td><td style="padding:6px 0;color:#111;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(v)}</td></tr>`
    )
    .join('');

  const joinHtml = joinHttps
    ? `<tr><td style="padding:6px 0;color:#555;font-size:14px;">Join link</td><td style="padding:6px 0;font-size:14px;text-align:right;"><a href="${escapeHtml(joinHttps)}" style="color:#7c3aed;">${escapeHtml(joinHttps)}</a></td></tr>`
    : `<tr><td colspan="2" style="padding:8px 0;color:#555;font-size:14px;">We will share the joining link before the session.</td></tr>`;

  const replyHtml = replyTo
    ? `<p style="margin:16px 0 0;color:#555;font-size:14px;">Questions? Just reply to this email.</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px 24px;border:1px solid #e8e8ee;">
        <tr><td>
          <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:#5b21b6;letter-spacing:-0.02em;">AhmiXen</p>
          <p style="margin:0 0 8px;font-size:16px;color:#111;">Hi ${escapeHtml(firstName)},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#333;">Your seat is confirmed. Here are your details:</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
            ${htmlRows}
            ${joinHtml}
          </table>
          <p style="margin:0 0 16px;">
            <a href="${escapeHtml(viewUrl)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">View your reservation</a>
          </p>
          <p style="margin:0;color:#333;font-size:15px;">See you at the session.</p>
          ${replyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const icsDescription = [
    `Order ${input.orderNumber}`,
    `Plan: ${input.planName}`,
    joinHttps ? `Join: ${joinHttps}` : '',
    `Reservation: ${viewUrl}`,
  ]
    .filter(Boolean)
    .join('\\n');

  const ics = buildReservationIcs({
    orderId: input.orderId,
    summary: input.sessionTitle || 'AhmiXen live session',
    description: icsDescription.replace(/\\n/g, '\n'),
    startsAt: input.startsAt,
    durationMinutes: input.durationMinutes,
  });

  return {
    to: stripLineBreaks(input.customerEmail),
    subject,
    text: textLines.join('\n'),
    html,
    attachments: [
      {
        filename: 'ahmixen-session.ics',
        content: ics,
        contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
      },
    ],
  };
}
