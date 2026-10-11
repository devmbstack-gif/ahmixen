/**
 * Single server-side source of truth for checkout seat hold duration.
 * Overridable via CHECKOUT_HOLD_MINUTES (minutes, default 30).
 * Browser clients read holdMinutes from GET /api/public/checkout — never NEXT_PUBLIC.
 */
export function getCheckoutHoldMinutes(): number {
  const raw = process.env.CHECKOUT_HOLD_MINUTES;
  if (raw == null || raw.trim() === '') return 30;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 30;
  return Math.min(24 * 60, Math.trunc(n));
}
