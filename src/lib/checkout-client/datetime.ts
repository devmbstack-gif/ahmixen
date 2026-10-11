/** Format session start in PKT with an explicit "PKT" label. */

export function formatSessionPktLine(
  startsAt: string,
  timezone = 'Asia/Karachi'
): string {
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart} · ${timePart} PKT`;
}
