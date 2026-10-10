'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { WORKSHOP_CONFIG } from '../data/workshopData';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

const EASE = [0.16, 1, 0.3, 1] as const;
const TARGET_MS = new Date(WORKSHOP_CONFIG.startsAt).getTime();

function getTimeLeft(now = Date.now()): TimeLeft {
  const diff = Math.max(0, TARGET_MS - now);
  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    done: diff <= 0,
  };
}

function FlipValue({ value, pad = 2 }: { value: number; pad?: number }) {
  const reduceMotion = useReducedMotion();
  const display = String(value).padStart(pad, '0');

  if (reduceMotion) {
    return <span className="hero-countdown-value tabular-nums">{display}</span>;
  }

  return (
    <span className="hero-countdown-flip relative inline-flex overflow-hidden">
      <span className="invisible tabular-nums select-none" aria-hidden="true">
        {display}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          className="hero-countdown-value absolute inset-0 flex items-center justify-center tabular-nums"
          initial={{ y: '-85%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '85%', opacity: 0 }}
          transition={{ duration: 0.38, ease: EASE }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const units: { key: keyof Omit<TimeLeft, 'done'>; label: string }[] = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Min' },
  { key: 'seconds', label: 'Sec' },
];

export const Countdown: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(getTimeLeft());
    const id = window.setInterval(() => setTime(getTimeLeft()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className={`hero-countdown ${className}`} aria-hidden="true">
        <div className="hero-countdown-grid">
          {units.map(({ key, label }) => (
            <div key={key} className="hero-countdown-unit">
              <span className="hero-countdown-value tabular-nums">--</span>
              <span className="hero-countdown-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (time.done) {
    return (
      <p className={`hero-countdown-live text-sm font-semibold ${className}`}>
        Workshop is live — join now
      </p>
    );
  }

  return (
    <div
      className={`hero-countdown ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={`Countdown to workshop: ${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds`}
    >
      <div className="hero-countdown-grid">
        {units.map(({ key, label }, i) => (
          <div key={key} className="contents">
            {i > 0 && <span className="hero-countdown-sep" aria-hidden="true">:</span>}
            <div className="hero-countdown-unit">
              <FlipValue value={time[key]} pad={key === 'days' && time.days > 99 ? 3 : 2} />
              <span className="hero-countdown-label">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
