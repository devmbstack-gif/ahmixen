import Link from 'next/link';
import { AhmiXenLogo } from '@/components/AhmiXenLogo';
import { AdminAtmosphere } from './AdminAtmosphere';

export function AdminAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen text-[var(--text-main)] flex flex-col">
      <AdminAtmosphere />
      <div className="relative z-10 flex items-center px-4 sm:px-6 py-4">
        <Link href="/" className="nav-focus inline-flex" aria-label="AhmiXen home">
          <AhmiXenLogo className="text-xl" />
        </Link>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </div>
    </div>
  );
}
