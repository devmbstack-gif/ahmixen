'use client';

import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface HeroProps {
  onOpenRegister: () => void;
  onExploreWorkshop: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenRegister, onExploreWorkshop }) => {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.09,
        delayChildren: reduceMotion ? 0 : 0.06,
      },
    },
  };

  const item = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section id="hero" className="relative pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[420px] ambient-purple-radial pointer-events-none -z-10 opacity-60" />

      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={item}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full purple-badge text-xs font-semibold tracking-wide uppercase"
        >
          <span className="w-2 h-2 rounded-full bg-violet-500 ahmixen-live-dot" />
          {WORKSHOP_CONFIG.badgeText}
        </motion.div>

        <motion.h1
          variants={item}
          className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.15]"
        >
          <span className="text-[var(--text-main)]">{WORKSHOP_CONFIG.titlePrefix} </span>
          <span className="gradient-text-ahmixen">{WORKSHOP_CONFIG.titleHighlight}</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto"
        >
          {WORKSHOP_CONFIG.subtitle}
        </motion.p>

        <motion.div
          variants={item}
          className="flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--text-secondary)]"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)]">
            <Calendar className="w-4 h-4 text-purple-400" />
            {WORKSHOP_CONFIG.date}
          </span>
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)]">
            <Clock className="w-4 h-4 text-purple-400" />
            {WORKSHOP_CONFIG.time} · {WORKSHOP_CONFIG.duration}
          </span>
        </motion.div>

        <motion.p variants={item} className="text-sm text-[var(--text-muted)]">
          {WORKSHOP_CONFIG.trustLine}
        </motion.p>

        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2"
        >
          <motion.button
            type="button"
            id="hero-reserve-cta"
            onClick={onOpenRegister}
            className="btn-ahmixen py-3.5 px-8 rounded-2xl font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <span>Reserve Your Seat — {WORKSHOP_CONFIG.priceEarlyBird.amount}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <button
            type="button"
            id="hero-explore-cta"
            onClick={onExploreWorkshop}
            className="py-3.5 px-7 rounded-2xl font-semibold text-base text-[var(--text-main)] border border-[var(--border-subtle)] bg-[var(--card-bg)] hover:border-[var(--bright-violet)] hover:bg-[var(--hover-fill)] transition-all cursor-pointer"
          >
            Watch Preview
          </button>
        </motion.div>

        <motion.p variants={item} className="text-xs text-[var(--text-muted)]">
          Only {WORKSHOP_CONFIG.seatsRemaining} seats left of {WORKSHOP_CONFIG.seatsTotal}
        </motion.p>
      </motion.div>
    </section>
  );
};
