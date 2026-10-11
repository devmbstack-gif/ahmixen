export type SessionStatus = 'draft' | 'open' | 'closed' | 'completed' | 'archived';

const ALLOWED: Record<SessionStatus, SessionStatus[]> = {
  draft: ['open', 'archived'],
  open: ['closed', 'archived'],
  closed: ['open', 'completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

export function canTransitionStatus(
  from: SessionStatus,
  to: SessionStatus
): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertCanOpen(startsAt: Date, seatsTotal: number): string | null {
  if (seatsTotal < 1) return 'Open sessions need at least 1 seat';
  if (startsAt.getTime() <= Date.now()) {
    return 'Open sessions must start in the future';
  }
  return null;
}
