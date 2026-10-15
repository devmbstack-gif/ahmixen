import { AdminAuthShell } from '@/components/admin/AdminAuthShell';
import { AdminForgotPasswordForm } from '@/components/admin/AdminForgotPasswordForm';

export const metadata = {
  title: 'Forgot password',
};

export default function Page() {
  return (
    <AdminAuthShell>
      <AdminForgotPasswordForm />
    </AdminAuthShell>
  );
}
