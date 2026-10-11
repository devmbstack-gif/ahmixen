import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Session } from '@/models/Session';
import { serializeAdminSession } from '@/lib/sessions/serialize';
import { SessionForm } from '@/components/admin/sessions/SessionForm';

export const metadata = { title: 'Edit session' };

type Props = { params: Promise<{ id: string }> };

export default async function EditSessionPage({ params }: Props) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectToDatabase();
  const doc = await Session.findById(id);
  if (!doc) notFound();

  return <SessionForm mode="edit" initial={serializeAdminSession(doc)} />;
}
