import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lightweight DB warm-up for the login page (no auth).
 * Opens the Mongo pool while the admin types credentials.
 */
export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
