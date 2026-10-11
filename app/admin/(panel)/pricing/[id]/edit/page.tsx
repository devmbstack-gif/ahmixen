import { notFound } from 'next/navigation';
import { PlanForm } from '@/components/admin/plans/PlanForm';
import { connectToDatabase } from '@/lib/db';
import { Plan } from '@/models/Plan';
import { Session } from '@/models/Session';
import { requireAdmin } from '@/lib/auth/admin-session';
import { serializeAdminPlan } from '@/lib/plans/serialize';

export const metadata = { title: 'Edit plan' };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  await requireAdmin();
  await connectToDatabase();
  const { id } = await params;
  const doc = await Plan.findById(id);
  if (!doc) notFound();

  const sessions = await Session.find({ status: { $ne: 'archived' } })
    .sort({ startsAt: 1 })
    .select({ title: 1 })
    .lean();

  const sessionTitle = doc.sessionId
    ? sessions.find((s) => String(s._id) === doc.sessionId)?.title ?? null
    : null;

  return (
    <PlanForm
      mode="edit"
      initial={serializeAdminPlan(doc, sessionTitle)}
      sessions={sessions.map((s) => ({ id: String(s._id), title: s.title }))}
    />
  );
}
