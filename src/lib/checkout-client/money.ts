/** Public money display: "PKR 2,249" or "$29". */

export function formatPublicMoney(
  currency: string,
  amount: number
): string {
  if (!Number.isFinite(amount)) return '';
  const whole = Math.trunc(amount).toLocaleString('en-US');
  if (currency === 'USD') return `$${whole}`;
  return `${currency} ${whole}`;
}
