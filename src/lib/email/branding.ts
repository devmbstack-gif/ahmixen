import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORKSHOP_CONFIG } from '@/data/workshopData';

/** Content-ID for inline logo — works offline / localhost (unlike remote img URLs). */
export const EMAIL_LOGO_CID = 'ahmixen-favicon@ahmixen';

export type EmailAttachment = {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  cid?: string;
};

/** Inline logo attachment for nodemailer (cid referenced in HTML). */
export function getEmailLogoAttachment(): EmailAttachment | null {
  // Prefer favicon.PNG (brand mark); fall back to ahmixen-logo.png if missing.
  const candidates = ['favicon.PNG', 'favicon.png', 'ahmixen-logo.png'];
  for (const name of candidates) {
    const path = join(process.cwd(), 'public', name);
    if (!existsSync(path)) continue;
    try {
      const content = readFileSync(path);
      return {
        filename: name.toLowerCase().endsWith('.png') ? 'ahmixen-icon.png' : name,
        content,
        contentType: 'image/png',
        cid: EMAIL_LOGO_CID,
      };
    } catch {
      continue;
    }
  }
  return null;
}

/** Header block with embedded logo (CID) + text fallback. */
export function buildEmailLogoHeaderHtml(): string {
  const logo = getEmailLogoAttachment();
  if (logo) {
    // Square favicon mark — keep modest size in email header
    return `<p style="margin:0 0 20px;">
  <img src="cid:${EMAIL_LOGO_CID}" alt="AhmiXen" width="72" height="72" style="display:block;width:72px;height:72px;border:0;outline:none;text-decoration:none;border-radius:12px;" />
</p>`;
  }
  return `<p style="margin:0 0 16px;font-size:20px;font-weight:800;color:#5b21b6;letter-spacing:-0.02em;">AhmiXen</p>`;
}

/** Attachments list that includes the brand logo when available. */
export function withEmailLogoAttachment(
  attachments: EmailAttachment[] = []
): EmailAttachment[] {
  const logo = getEmailLogoAttachment();
  if (!logo) return attachments;
  return [logo, ...attachments];
}

export type CommunityWhatsAppDetails = {
  customerName: string;
  orderNumber: string;
  dateLine: string;
  duration: string;
  planName: string;
  amountPaid: string;
};

/** Prefill for wa.me — seat details + community join request. */
export function buildCommunityWhatsAppPrefill(
  details: CommunityWhatsAppDetails
): string {
  return [
    'Assalamualaikum,',
    '',
    'Please add me in the community. My seat is confirmed.',
    '',
    `Name: ${details.customerName}`,
    `Order number: ${details.orderNumber}`,
    `Date and time: ${details.dateLine}`,
    `Duration: ${details.duration}`,
    `Plan: ${details.planName}`,
    `Amount paid: ${details.amountPaid}`,
    '',
    'Thank you.',
  ].join('\n');
}

/** Same WhatsApp number as landing "Let's have a chat" float. */
export function buildCommunityWhatsAppUrl(
  details: CommunityWhatsAppDetails
): string {
  const digits = (WORKSHOP_CONFIG.whatsappNumber || '').replace(/\D/g, '');
  const text = encodeURIComponent(buildCommunityWhatsAppPrefill(details));
  return `https://wa.me/${digits}?text=${text}`;
}
