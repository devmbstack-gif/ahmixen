import { NextResponse } from 'next/server';
import { clearAdminSessionCookie, isAllowedOrigin } from '@/lib/auth/admin-session';

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  clearAdminSessionCookie(response);
  return response;
}
