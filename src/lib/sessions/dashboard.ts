import { connectToDatabase } from '@/lib/db';
import { Session } from '@/models/Session';
import { serializeAdminSession, type AdminSessionDTO } from './serialize';

export async function getAdminSpotlightSession(): Promise<AdminSessionDTO | null> {
  await connectToDatabase();
  const now = new Date();
  const doc =
    (await Session.findOne({
      isLandingActive: true,
      status: { $ne: 'archived' },
    })) ||
    (await Session.findOne({
      status: 'open',
      startsAt: { $gte: now },
    }).sort({ startsAt: 1 }));

  if (!doc) return null;
  return serializeAdminSession(doc, now);
}
