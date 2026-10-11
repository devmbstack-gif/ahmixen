import { redirect } from 'next/navigation';
import { AhmiXenLogo } from '@/components/AhmiXenLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <AhmiXenLogo className="text-xl" />
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <AdminLoginForm />
      </div>
    </div>
  );
}
