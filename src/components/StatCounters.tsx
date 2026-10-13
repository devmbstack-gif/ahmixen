'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LANDING_STATS, type LandingStat } from '../data/workshopData';
import type { StatsContentData } from '@/lib/content/landingSchemas';
import { Reveal } from './Reveal';

function formatStat(stat: LandingStat, current: number) {
  const decimals = stat.decimals ?? 0;
  const num = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString();
  return `${stat.prefix ?? ''}${num}${stat.suffix}`;
}

function useCountUp(stat: LandingStat, active: boolean, reduceMotion: boolean | null) {
  const [display, setDisplay] = useState(() =>
    reduceMotion ? formatStat(stat, stat.value) : formatStat(stat, 0)
  );

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(formatStat(stat, stat.value));
      return;
    }
    if (!active) return;

    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const target = stat.value;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(formatStat(stat, target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduceMotion, stat.id, stat.value, stat.decimals, stat.suffix, stat.prefix]);

  return display;
}

const StatCell: React.FC<{
  stat: LandingStat;
  active: boolean;
  reduceMotion: boolean | null;
}> = ({ stat, active, reduceMotion }) => {
  const value = useCountUp(stat, active, reduceMotion);

  return (
    <div className="stat-counter-cell text-center px-3 py-5 sm:py-6">
      <div className="stat-counter-value tabular-nums">{value}</div>
      <div className="stat-counter-label">{stat.label}</div>
    </div>
  );
};

export const StatCounters: React.FC<{ content?: StatsContentData }> = ({
  content,
}) => {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const stats = (content?.items as LandingStat[]) || LANDING_STATS;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="stats"
      className="section-y-sm bg-transparent"
      aria-label="Workshop stats"
    >
      <div className="container-narrow">
        <Reveal>
          <div className="stat-counter-row grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {stats.map((stat) => (
              <StatCell
                key={stat.id}
                stat={stat}
                active={active}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
