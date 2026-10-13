'use client';

import dynamic from 'next/dynamic';

const AnimatedBackground = dynamic(
  () =>
    import('@/components/AnimatedBackground').then((m) => ({
      default: m.AnimatedBackground,
    })),
  { ssr: false, loading: () => null }
);

/** Shared landing-style ambient background for admin surfaces. */
export function AdminAtmosphere() {
  return <AnimatedBackground />;
}
