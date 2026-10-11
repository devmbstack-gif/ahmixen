import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/auth/admin-session';

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    redirect('/admin/login');
  }

  return <AdminShell adminName={session.name}>{children}</AdminShell>;
}
