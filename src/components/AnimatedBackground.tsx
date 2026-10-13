'use client';

import React, { useEffect, useState } from 'react';

/**
 * Decorative background — static CSS layers + soft orbs.
 * Particle / star canvas animation intentionally removed.
 */
export const AnimatedBackground: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let rafId = 0;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  const orbParallaxOffset = reducedMotion ? 0 : Math.min(scrollY * -0.06, 200);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none bg-[var(--bg-primary)] transition-colors duration-500"
    >
      <div className="absolute inset-0 tech-grid-pattern opacity-40 mix-blend-overlay pointer-events-none" />

      <div className="ahmixen-bg-ambient absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[min(100vh,900px)] pointer-events-none opacity-70" />

      <div className="hero-floor-glow absolute inset-x-0 bottom-0 h-[75%] pointer-events-none" />

      <div
        className="absolute inset-0 w-full h-full will-change-transform pointer-events-none"
        style={{
          transform: `translate3d(0, ${orbParallaxOffset}px, 0)`,
          transition: reducedMotion ? 'none' : 'transform 0.15s cubic-bezier(0, 0, 0.2, 1)',
        }}
      >
        <div
          className={`ahmixen-bg-orb ahmixen-bg-orb-1 absolute -top-20 right-[-8%] w-[580px] h-[580px] rounded-full blur-[140px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-1'
          }`}
        />
        <div
          className={`ahmixen-bg-orb ahmixen-bg-orb-2 absolute top-[35%] left-[-10%] w-[520px] h-[520px] rounded-full blur-[150px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-2'
          }`}
        />
        <div
          className={`ahmixen-bg-orb ahmixen-bg-orb-3 absolute top-[65%] right-[-5%] w-[480px] h-[480px] rounded-full blur-[140px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-3'
          }`}
        />
        <div
          className={`ahmixen-bg-orb ahmixen-bg-orb-4 absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-1'
          }`}
        />
      </div>

      <div className="ahmixen-bg-vignette absolute inset-0 pointer-events-none" />
    </div>
  );
};
