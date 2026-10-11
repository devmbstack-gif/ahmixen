/** Whole numbers only — no decimals. */

export function digitsOnlyMoney(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatWholeMoney(n: number): string {
  if (!Number.isFinite(n)) return '';
  return Math.trunc(n).toLocaleString('en-US');
}

export function parseWholeMoney(raw: string): number | null {
  const cleaned = digitsOnlyMoney(raw);
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isInteger(n)) return null;
  return n;
}

export function savingsPercent(
  price: number,
  originalPrice: number | null | undefined
): number | null {
  if (
    originalPrice == null ||
    !Number.isFinite(originalPrice) ||
    originalPrice <= 0 ||
    price >= originalPrice
  ) {
    return null;
  }
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function installmentTotal(
  price: number,
  installmentsCount: number | null | undefined
): number | null {
  if (
    installmentsCount == null ||
    !Number.isInteger(installmentsCount) ||
    installmentsCount < 2
  ) {
    return null;
  }
  return price * installmentsCount;
}

export function formatMoneyLabel(currency: string, amount: number): string {
  return `${currency} ${formatWholeMoney(amount)}`;
}
