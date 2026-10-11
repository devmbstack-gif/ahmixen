import { PlanForm } from '@/components/admin/plans/PlanForm';
import { connectToDatabase } from '@/lib/db';
import { Session } from '@/models/Session';
import { requireAdmin } from '@/lib/auth/admin-session';

export const metadata = { title: 'New plan' };

export default async function Page() {
  await requireAdmin();
  await connectToDatabase();
  const sessions = await Session.find({ status: { $ne: 'archived' } })
    .sort({ startsAt: 1 })
    .select({ title: 1 })
    .lean();

  return (
    <PlanForm
      mode="create"
      sessions={sessions.map((s) => ({ id: String(s._id), title: s.title }))}
    />
  );
}
