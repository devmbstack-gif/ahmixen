import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AdminAuthShell } from '@/components/admin/AdminAuthShell';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { getAdminSession } from '@/lib/auth/admin-session';

export const metadata = {
  title: 'Sign in',
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect('/admin');
  }

  return (
    <AdminAuthShell>
      <Suspense
        fallback={
          <div className="admin-card w-full max-w-md p-6 text-sm text-[var(--text-muted)]">
            Loading…
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </AdminAuthShell>
  );
}
