import { Suspense } from 'react';
import { AdminAuthShell } from '@/components/admin/AdminAuthShell';
import { AdminVerifyOtpForm } from '@/components/admin/AdminVerifyOtpForm';

export const metadata = {
  title: 'Verify code',
};

export default function Page() {
  return (
    <AdminAuthShell>
      <Suspense
        fallback={
          <div className="admin-card w-full max-w-md p-6 text-sm text-[var(--text-muted)]">
            Loading…
          </div>
        }
      >
        <AdminVerifyOtpForm />
      </Suspense>
    </AdminAuthShell>
  );
}
