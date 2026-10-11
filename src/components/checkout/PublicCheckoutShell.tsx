'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const AnimatedBackground = dynamic(
  () =>
    import('@/components/AnimatedBackground').then((m) => ({
      default: m.AnimatedBackground,
    })),
  { ssr: false, loading: () => null }
);

export function PublicCheckoutShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink transition-colors duration-300 antialiased relative">
      <AnimatedBackground />
      <Navbar />
      <main className="flex-1 page-x py-8 sm:py-10">{children}</main>
      <Footer />
    </div>
  );
}
