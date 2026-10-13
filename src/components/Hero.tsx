'use client';

import { useMemo } from 'react';
import { ArrowRight, Calendar, Clock, Hourglass, Video } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { WORKSHOP_CONFIG } from '../data/workshopData';
import type { PublicSessionDisplay } from '../lib/sessions/publicShared';
import type { HeroContentData } from '@/lib/content/landingSchemas';
import { Countdown } from './Countdown';
import { useReserveFlow } from './checkout/ReserveFlowProvider';

interface HeroProps {
  onExploreWorkshop: () => void;
  session: PublicSessionDisplay;
  content: HeroContentData & { headlineLine1Resolved: string };
}

const EASE = [0.16, 1, 0.3, 1] as const;

function splitWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

export const Hero: React.FC<HeroProps> = ({
  onExploreWorkshop,
  session,
  content,
}) => {
  const reduceMotion = useReducedMotion();
  const { startReserveFlow, reserveCta } = useReserveFlow();
  const heroCtaLabel =
    reserveCta.label === 'Reserve'
      ? content.primaryCtaLabel
      : reserveCta.label;

  const line1Words = useMemo(
    () => splitWords(content.headlineLine1Resolved),
    [content.headlineLine1Resolved]
  );
  const line2Words = useMemo(
    () => splitWords(content.headlineLine2),
    [content.headlineLine2]
  );

  const metaItems = useMemo(
    () => [
      { icon: Calendar, label: `On ${session.dateShort}`, live: false },
      { icon: Hourglass, label: session.durationLabel, live: false },
      { icon: Video, label: WORKSHOP_CONFIG.sessionLabel, live: true },
      { icon: Clock, label: session.timeLabel, live: false },
    ],
    [session.dateShort, session.durationLabel, session.timeLabel]
  );

  const wordInitial = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 };
  const wordAnimate = { opacity: 1, y: 0 };

  const blockVariants = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: EASE },
    },
  };

  return (
    <section
      id="hero"
      className="hero-premium relative flex items-center py-16 md:py-20 lg:py-24 bg-transparent overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="relative z-10 w-full container-page text-center">
        <h2 id="hero-heading" className="type-display uppercase">
          <span className="block sm:whitespace-nowrap">
            {line1Words.map((word, i) => (
              <motion.span
                key={`l1-${word}-${i}`}
                initial={wordInitial}
                animate={wordAnimate}
                transition={{
                  duration: reduceMotion ? 0 : 0.55,
                  delay: reduceMotion ? 0 : 0.06 + i * 0.08,
                  ease: EASE,
                }}
                className="inline-block text-[var(--text-main)] mr-[0.28em] last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </span>
          <span className="block mt-1 sm:mt-2">
            {line2Words.map((word, i) => (
              <motion.span
                key={`l2-${word}-${i}`}
                initial={wordInitial}
                animate={wordAnimate}
                transition={{
                  duration: reduceMotion ? 0 : 0.55,
                  delay: reduceMotion
                    ? 0
                    : 0.06 + (line1Words.length + i) * 0.08,
                  ease: EASE,
                }}
                className="hero-gradient-text inline-block mr-[0.28em] last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h2>

        <motion.div
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.55 }}
          className="mt-7 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
        >
          <span className="inline-flex items-center bg-[var(--primary-purple)] text-white font-extrabold text-base sm:text-xl md:text-2xl px-3.5 sm:px-4 py-1.5 rounded-md leading-tight shadow-[0_8px_28px_-8px_rgba(124,58,237,0.65)]">
            {content.badgeText}
          </span>
          <span className="hero-gradient-text font-extrabold text-base sm:text-xl md:text-2xl leading-tight">
            {content.badgeSuffix}
          </span>
        </motion.div>

        <motion.ul
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.7 }}
          className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {metaItems.map(({ icon: Icon, label, live }) => (
            <li
              key={label}
              className="hero-meta-pill inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm sm:text-[15px] font-semibold cursor-default"
            >
              {live ? (
                <span className="hero-live-dot" aria-hidden="true" />
              ) : (
                <Icon
                  className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-fuchsia-300 shrink-0"
                  strokeWidth={2.25}
                />
              )}
              {label}
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.78 }}
          className="mt-7 md:mt-8 flex flex-col items-center gap-3"
        >
          {session.showLimitedSeatsBadge && (
            <span className="hero-urgency-badge">
              <span className="hero-urgency-dot" aria-hidden="true" />
              {session.seatsAvailable > 0
                ? `Limited seats · ${session.seatsAvailable} left`
                : 'Sold out'}
            </span>
          )}
          <Countdown startsAt={session.startsAt} />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.9 }}
          className="mt-7 md:mt-8 flex flex-col items-center gap-4"
        >
          <motion.button
            type="button"
            id="hero-reserve-cta"
            onClick={() => {
              if (!reserveCta.disabled) startReserveFlow();
            }}
            disabled={reserveCta.disabled}
            aria-disabled={reserveCta.disabled}
            className="btn-ahmixen relative py-3.5 px-8 sm:px-10 rounded-full font-bold text-base sm:text-lg inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="relative z-[2] inline-flex items-center gap-2">
              {heroCtaLabel}
              {!reserveCta.disabled ? <ArrowRight className="w-5 h-5" /> : null}
            </span>
          </motion.button>
          <button
            type="button"
            id="hero-explore-cta"
            onClick={onExploreWorkshop}
            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] underline-offset-4 hover:underline cursor-pointer"
          >
            {content.secondaryLinkLabel}
          </button>
        </motion.div>
      </div>
    </section>
  );
};
