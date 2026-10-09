'use client';

import { ArrowRight, Calendar, Clock, Hourglass, Video } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface HeroProps {
  onOpenRegister: () => void;
  onExploreWorkshop: () => void;
}

const metaItems = [
  { icon: Calendar, label: `On ${WORKSHOP_CONFIG.dateShort}` },
  { icon: Hourglass, label: WORKSHOP_CONFIG.durationLabel },
  { icon: Video, label: WORKSHOP_CONFIG.sessionLabel },
  { icon: Clock, label: WORKSHOP_CONFIG.time },
];

export const Hero: React.FC<HeroProps> = ({ onOpenRegister, onExploreWorkshop }) => {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: reduceMotion ? 0 : 0.04,
      },
    },
  };

  const item = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex items-center overflow-hidden pt-24 pb-16 md:pt-28 md:pb-20"
    >
      <div className="hero-floor-glow absolute inset-x-0 bottom-0 h-[58%] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[380px] ambient-purple-radial pointer-events-none opacity-70" />

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.p
          variants={item}
          className="text-sm sm:text-base md:text-lg font-medium text-[var(--text-secondary)] mb-6 md:mb-8"
        >
          {WORKSHOP_CONFIG.eyebrow}
        </motion.p>

        <motion.h1
          variants={item}
          className="font-extrabold uppercase tracking-tight leading-[0.92] text-[clamp(1.75rem,5.4vw,4.5rem)]"
        >
          <span className="block text-[var(--text-main)] sm:whitespace-nowrap">
            {WORKSHOP_CONFIG.titlePrefix}{' '}
            <span className="whitespace-nowrap">{WORKSHOP_CONFIG.titleDuration}</span>
          </span>
          <span className="block hero-accent mt-1 sm:mt-2">{WORKSHOP_CONFIG.titleHighlight}</span>
        </motion.h1>

        <motion.div
          variants={item}
          className="mt-7 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
        >
          <span className="inline-flex items-center bg-[var(--primary-purple)] text-white font-extrabold text-base sm:text-xl md:text-2xl px-3.5 sm:px-4 py-1.5 rounded-md leading-tight">
            {WORKSHOP_CONFIG.calloutQuestion}
          </span>
          <span className="hero-accent font-extrabold text-base sm:text-xl md:text-2xl leading-tight">
            {WORKSHOP_CONFIG.calloutAnswer}
          </span>
        </motion.div>

        <motion.p
          variants={item}
          className="mt-6 md:mt-7 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-3xl mx-auto"
        >
          {WORKSHOP_CONFIG.subtitle}
        </motion.p>

        <motion.ul
          variants={item}
          className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {metaItems.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="hero-meta-pill inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm sm:text-[15px] font-semibold"
            >
              <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] hero-accent shrink-0" strokeWidth={2.25} />
              {label}
            </li>
          ))}
        </motion.ul>

        <motion.div variants={item} className="mt-8 md:mt-10 flex flex-col items-center gap-4">
          <motion.button
            type="button"
            id="hero-reserve-cta"
            onClick={onOpenRegister}
            className="btn-ahmixen py-3.5 px-8 sm:px-10 rounded-full font-bold text-base sm:text-lg inline-flex items-center justify-center gap-2 cursor-pointer"
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            Reserve My Seat
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <button
            type="button"
            id="hero-explore-cta"
            onClick={onExploreWorkshop}
            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] underline-offset-4 hover:underline cursor-pointer"
          >
            Watch preview
          </button>
        </motion.div>

        <motion.p variants={item} className="mt-6 text-xs sm:text-sm text-[var(--text-muted)]">
          {WORKSHOP_CONFIG.trustLine}
        </motion.p>
      </motion.div>
    </section>
  );
};
