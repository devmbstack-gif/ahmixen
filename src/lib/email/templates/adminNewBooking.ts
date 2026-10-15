import {
  formatAmount,
  formatPktDateTime,
} from '../formatters';
import { escapeHtml, stripLineBreaks } from '../sanitize';
import { getSiteUrl } from '../config';

export type AdminNewBookingInput = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  planName: string;
  currency: string;
  amount: number;
  sessionTitle: string;
  startsAt: Date | null;
  timezone: string;
  bookingTypeLabel: string;
  adminTo: string;
};

export type BuiltAdminEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: [];
};

export function buildAdminNewBookingEmail(
  input: AdminNewBookingInput
): BuiltAdminEmail {
  const site = getSiteUrl();
  const reviewUrl = `${site}/admin/orders/${encodeURIComponent(input.orderId)}`;
  const amount = formatAmount(input.currency, input.amount);
  const when =
    input.startsAt != null
      ? formatPktDateTime(input.startsAt, input.timezone)
      : '—';

  const subject = stripLineBreaks(
    `New booking to review — ${input.orderNumber}`
  );

  const rows: Array<[string, string]> = [
    ['Order', input.orderNumber],
    ['Type', input.bookingTypeLabel],
    ['Customer', input.customerName],
    ['Email', input.customerEmail],
    ['Phone', input.customerPhone || '—'],
    ['Plan', input.planName],
    ['Amount', amount],
    ['Session', input.sessionTitle || '—'],
    ['Date and time', when],
  ];

  const text = [
    'A new booking needs your review.',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `Review in admin: ${reviewUrl}`,
  ].join('\n');

  const htmlRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#555;font-size:14px;">${escapeHtml(k)}</td><td style="padding:6px 0;color:#111;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(v)}</td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px 24px;border:1px solid #e8e8ee;">
        <tr><td>
          <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:#5b21b6;letter-spacing:-0.02em;">AhmiXen</p>
          <p style="margin:0 0 8px;font-size:16px;color:#111;font-weight:700;">New booking received</p>
          <p style="margin:0 0 16px;font-size:15px;color:#333;">A customer submitted a booking. Please review the payment and approve or reject it.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
            ${htmlRows}
          </table>
          <p style="margin:0;">
            <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">Review booking</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    to: stripLineBreaks(input.adminTo),
    subject,
    text,
    html,
    attachments: [],
  };
}
