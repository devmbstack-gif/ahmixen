import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { OrderDetailClient } from '@/components/admin/orders/OrderDetailClient';
import { connectToDatabase } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-session';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { expireStaleOrders } from '@/lib/orders/expire';
import { serializeAdminOrderDetail } from '@/lib/orders/serialize';
import { getSeatSummary } from '@/lib/sessions/seats';

export const metadata = { title: 'Order detail' };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  await requireAdmin();
  await connectToDatabase();
  await ensureOrderIndexes();
  await expireStaleOrders();

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  const doc = await Order.findById(id);
  if (!doc) notFound();

  const session = mongoose.isValidObjectId(doc.sessionId)
    ? await Session.findById(doc.sessionId)
        .select({
          title: 1,
          startsAt: 1,
          holds: 1,
          seatsTotal: 1,
          seatsConfirmed: 1,
        })
        .lean()
    : null;

  const seats = session
    ? getSeatSummary({
        seatsTotal: session.seatsTotal,
        seatsConfirmed: session.seatsConfirmed,
        holds: session.holds ?? [],
      })
    : null;

  return (
    <OrderDetailClient
      initial={serializeAdminOrderDetail(doc, {
        sessionTitle: session?.title,
        sessionStartsAt: session?.startsAt ?? null,
        sessionHolds: session?.holds as Array<{
          orderId?: string;
          expiresAt: Date | string;
        }>,
        seatsLeft: seats?.available ?? null,
      })}
    />
  );
}
