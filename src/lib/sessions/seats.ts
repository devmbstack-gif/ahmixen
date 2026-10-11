export type SessionLikeForSeats = {
  seatsTotal: number;
  seatsConfirmed: number;
  holds?: Array<{ orderId?: string; expiresAt: Date | string }>;
};

export type SeatSummary = {
  total: number;
  confirmed: number;
  held: number;
  available: number;
};

/** Single source of truth for seat math. Never persist "available". */
export function getSeatSummary(
  session: SessionLikeForSeats,
  now: Date = new Date()
): SeatSummary {
  const total = Math.max(0, session.seatsTotal ?? 0);
  const confirmed = Math.max(0, session.seatsConfirmed ?? 0);
  const held = (session.holds ?? []).filter((h) => {
    const exp = h.expiresAt instanceof Date ? h.expiresAt : new Date(h.expiresAt);
    return exp.getTime() > now.getTime();
  }).length;

  return {
    total,
    confirmed,
    held,
    available: Math.max(0, total - confirmed - held),
  };
}
