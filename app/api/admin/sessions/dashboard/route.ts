import { NextResponse } from 'next/server';
import { Session } from '@/models/Session';
import { serializeAdminSession } from '@/lib/sessions/serialize';
import { serverError, withAdminRead } from '@/lib/sessions/api-helpers';

/** Landing-active session, else next open session by startsAt. */
export async function GET() {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const now = new Date();
    let doc =
      (await Session.findOne({
        isLandingActive: true,
        status: { $ne: 'archived' },
      })) ||
      (await Session.findOne({
        status: 'open',
        startsAt: { $gte: now },
      }).sort({ startsAt: 1 }));

    if (!doc) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({ session: serializeAdminSession(doc, now) });
  } catch (err) {
    console.error('[sessions dashboard]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
