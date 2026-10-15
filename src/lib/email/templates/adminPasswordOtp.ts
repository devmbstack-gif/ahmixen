import { getSiteUrl } from '../config';

export function adminPasswordOtpEmail(input: {
  name: string;
  otp: string;
  expiresMinutes: number;
}): { subject: string; text: string; html: string } {
  const site = getSiteUrl();
  const subject = 'Your AhmiXen admin verification code';
  const text = [
    `Hi ${input.name},`,
    '',
    `Your AhmiXen admin password reset code is: ${input.otp}`,
    '',
    `This code expires in ${input.expiresMinutes} minutes.`,
    'If you did not request a password reset, you can ignore this email.',
    '',
    `Admin sign-in: ${site}/admin/login`,
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:520px">
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>Your AhmiXen admin password reset code is:</p>
      <p style="font-size:28px;font-weight:800;letter-spacing:0.2em;margin:16px 0">${escapeHtml(input.otp)}</p>
      <p>This code expires in <strong>${input.expiresMinutes} minutes</strong>.</p>
      <p style="color:#555">If you did not request a password reset, you can ignore this email.</p>
      <p><a href="${escapeHtml(site)}/admin/login">Admin sign-in</a></p>
    </div>
  `.trim();

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
