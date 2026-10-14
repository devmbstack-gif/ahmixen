export function formatPktDateTime(startsAt: Date, timezone: string): string {
  const tz = timezone || 'Asia/Karachi';
  const datePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(startsAt);
  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(startsAt);
  const zoneLabel = tz === 'Asia/Karachi' ? 'PKT' : tz;
  return `${datePart}, ${timePart} ${zoneLabel}`;
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h <= 0) return `${rem} minute${rem === 1 ? '' : 's'}`;
  if (rem === 0) return `${h} hour${h === 1 ? '' : 's'}`;
  return `${h} hour${h === 1 ? '' : 's'} ${rem} minute${rem === 1 ? '' : 's'}`;
}

export function formatAmount(currency: string, amount: number): string {
  const cur = currency === 'USD' ? 'USD' : 'PKR';
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cur} ${amount}`;
  }
}

export function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}
