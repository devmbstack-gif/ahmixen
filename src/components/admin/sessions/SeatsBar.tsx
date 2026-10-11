import type { SeatSummary } from '@/lib/sessions/seats';

export function SeatsBar({ seats }: { seats: SeatSummary }) {
  const detail = `${seats.confirmed} confirmed / ${seats.held} held / ${seats.total} total`;
  const tone =
    seats.available <= 0 ? 'is-empty' : seats.available <= 5 ? 'is-low' : 'is-ok';

  return (
    <div
      className="admin-seats-compact"
      title={detail}
      aria-label={`${seats.available} left. ${detail}`}
    >
      <span className={`admin-seats-dot ${tone}`} aria-hidden="true" />
      <span className="admin-seats-compact-text">{seats.available} left</span>
    </div>
  );
}
