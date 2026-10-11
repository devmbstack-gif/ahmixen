import { OrdersListClient } from '@/components/admin/orders/OrdersListClient';
import { connectToDatabase } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-session';
import { Session } from '@/models/Session';

export const metadata = { title: 'Orders & Payments' };

export default async function Page() {
  await requireAdmin();
  await connectToDatabase();
  const sessions = await Session.find({ status: { $ne: 'archived' } })
    .sort({ startsAt: -1 })
    .select({ title: 1 })
    .lean();

  return (
    <OrdersListClient
      sessions={sessions.map((s) => ({
        id: String(s._id),
        title: s.title,
      }))}
    />
  );
}
