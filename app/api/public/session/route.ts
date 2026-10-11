import { NextResponse } from 'next/server';
import { getPublicSession } from '@/lib/sessions/public';

export const revalidate = 30;

/** Read-only public session for the landing page. Safe fields only. */
export async function GET() {
  const session = await getPublicSession();

  // Strip display helpers for the API contract — only safe source fields.
  const body = {
    startsAt: session.startsAt,
    durationMinutes: session.durationMinutes,
    timezone: session.timezone,
    seatsAvailable: session.seatsAvailable,
    showLimitedSeatsBadge: session.showLimitedSeatsBadge,
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
