export type ReserveIntent = 'workshop' | 'mentorship';

export type ReserveContext = {
  /** Program card id when coming from Programs */
  programId?: string | null;
  /** Human label: program title or mentorship plan name */
  forTitle?: string | null;
};

const PENDING_PATH_KEY = 'ahmixen_reserve_pending_path';

export function buildReservePath(
  intent: ReserveIntent,
  planId: string | null | undefined,
  context?: ReserveContext
): string {
  const params = new URLSearchParams();
  params.set('intent', intent);
  if (planId) params.set('plan', planId);
  const programId = context?.programId?.trim();
  if (programId) params.set('program', programId.slice(0, 80));
  const forTitle = context?.forTitle?.trim();
  if (forTitle) params.set('for', forTitle.slice(0, 120));
  return `/reserve?${params.toString()}`;
}

export function stashReservePath(path: string) {
  try {
    sessionStorage.setItem(PENDING_PATH_KEY, path);
  } catch {
    /* ignore */
  }
}

export function takeStashedReservePath(): string | null {
  try {
    const path = sessionStorage.getItem(PENDING_PATH_KEY);
    if (path) sessionStorage.removeItem(PENDING_PATH_KEY);
    return path;
  } catch {
    return null;
  }
}
