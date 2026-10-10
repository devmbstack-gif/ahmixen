'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

type ScrollToOptions = {
  offset?: number;
  immediate?: boolean;
};

type SmoothScrollApi = {
  scrollTo: (target: string | HTMLElement, options?: ScrollToOptions) => void;
};

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

const NAV_OFFSET = -80;

/** Site-wide smooth scrolling via Lenis. Respects prefers-reduced-motion. */
export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setReady(true);
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.1,
    });
    lenisRef.current = lenis;
    setReady(true);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const api = useMemo<SmoothScrollApi>(
    () => ({
      scrollTo: (target, options = {}) => {
        const el =
          typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
        if (!el) return;

        const offset = options.offset ?? NAV_OFFSET;
        const lenis = lenisRef.current;

        if (lenis) {
          lenis.scrollTo(el, { offset, immediate: options.immediate ?? false });
          return;
        }

        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: options.immediate ? 'auto' : 'smooth' });
      },
    }),
    [ready]
  );

  return (
    <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>
  );
};
