import { AdminAuthShell } from '@/components/admin/AdminAuthShell';
import { AdminResetPasswordForm } from '@/components/admin/AdminResetPasswordForm';

export const metadata = {
  title: 'Reset password',
};

export default function Page() {
  return (
    <AdminAuthShell>
      <AdminResetPasswordForm />
    </AdminAuthShell>
  );
}
