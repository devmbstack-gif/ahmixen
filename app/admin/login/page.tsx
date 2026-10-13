import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AhmiXenLogo } from '@/components/AhmiXenLogo';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminAtmosphere } from '@/components/admin/AdminAtmosphere';
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
    <div className="relative min-h-screen text-[var(--text-main)] flex flex-col">
      <AdminAtmosphere />
      <div className="relative z-10 flex items-center px-4 sm:px-6 py-4">
        <Link href="/" className="nav-focus inline-flex" aria-label="AhmiXen home">
          <AhmiXenLogo className="text-xl" />
        </Link>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <AdminLoginForm />
      </div>
    </div>
  );
}
