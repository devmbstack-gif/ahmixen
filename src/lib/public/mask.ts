/** Mask email for public order status, e.g. a***@gmail.com */
export function maskEmail(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.indexOf('@');
  if (at <= 0) return '***';
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const first = local[0] || '*';
  return `${first}***@${domain}`;
}
