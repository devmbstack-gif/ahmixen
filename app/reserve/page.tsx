import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReserveClient } from './ReserveClient';

export const metadata: Metadata = {
  title: 'Reserve your seat - AhmiXen',
  robots: { index: false, follow: false },
};

export default function ReservePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading…
        </div>
      }
    >
      <ReserveClient />
    </Suspense>
  );
}
