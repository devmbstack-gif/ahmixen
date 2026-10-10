'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WORKSHOP_BENEFITS } from '../data/workshopData';
import { Reveal } from './Reveal';

const benefitArt: Record<string, { dark: string; light: string; alt: string }> = {
  fundamentals: {
    dark: '/benefits/fundamentals-dark.png',
    light: '/benefits/fundamentals-light.png',
    alt: 'AI Fundamentals',
  },
  agents: {
    dark: '/benefits/agents-dark.png',
    light: '/benefits/agents-light.png',
    alt: 'AI Agents',
  },
  automation: {
    dark: '/benefits/automation-dark.png',
    light: '/benefits/automation-light.png',
    alt: 'Automation',
  },
  building: {
    dark: '/benefits/building-dark.png',
    light: '/benefits/building-light.png',
    alt: 'Build with AI',
  },
};

const INTERVAL_MS = 3400;
const EASE_FLOW: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** dir > 0 = forward (enter from right, exit to left) */
const slideVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? '28%' : '-28%',
    scale: 0.98,
  }),
  center: {
    opacity: 1,
    x: '0%',
    scale: 1,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? '-22%' : '22%',
    scale: 0.98,
  }),
};

export const Benefits: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const total = WORKSHOP_BENEFITS.length;

  const goTo = useCallback(
    (next: number, dir: number) => {
      setDirection(dir);
      setIndex(((next % total) + total) % total);
    },
    [total]
  );

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % total);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, total]);

  const benefit = WORKSHOP_BENEFITS[index];
  const art = benefitArt[benefit.id];

  return (
    <section id="benefits" className="relative py-10 sm:py-12 md:py-14 overflow-hidden bg-transparent">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            What You&apos;ll <span className="gradient-text-ahmixen">Learn</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Four practical topics — clear, focused, and ready to use at work.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            className="benefit-carousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setPaused(false);
              }
            }}
          >
            <div className="benefit-carousel-frame relative overflow-hidden rounded-2xl sm:rounded-3xl">
              <AnimatePresence initial={false} custom={direction} mode="sync">
                <motion.article
                  key={benefit.id}
                  custom={direction}
                  variants={reduceMotion ? undefined : slideVariants}
                  initial={reduceMotion ? { opacity: 0 } : 'enter'}
                  animate={reduceMotion ? { opacity: 1 } : 'center'}
                  exit={reduceMotion ? { opacity: 0 } : 'exit'}
                  transition={
                    reduceMotion
                      ? { duration: 0.2 }
                      : {
                          x: { duration: 0.85, ease: EASE_FLOW },
                          opacity: { duration: 0.7, ease: EASE_FLOW },
                          scale: { duration: 0.85, ease: EASE_FLOW },
                        }
                  }
                  className="absolute inset-0 flex flex-col bg-[var(--card-bg)]"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${total}: ${benefit.title}`}
                >
                  <div className="relative flex-1 min-h-0 benefit-carousel-art">
                    {art && (
                      <>
                        <Image
                          src={art.dark}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 720px"
                          quality={95}
                          className="benefit-art-dark object-contain object-center p-3 sm:p-4"
                          priority={index < 2}
                        />
                        <Image
                          src={art.light}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 720px"
                          quality={95}
                          className="benefit-art-light object-contain object-center p-3 sm:p-4"
                          priority={index < 2}
                        />
                      </>
                    )}
                  </div>

                  <div className="benefit-carousel-copy shrink-0 px-5 sm:px-7 pb-5 sm:pb-6 pt-1">
                    <motion.p
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12, duration: 0.45, ease: EASE_FLOW }}
                      className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-400 mb-1.5"
                    >
                      Topic {String(index + 1).padStart(2, '0')}
                    </motion.p>
                    <motion.h3
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18, duration: 0.5, ease: EASE_FLOW }}
                      className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-main)]"
                    >
                      {benefit.title}
                    </motion.h3>
                    <motion.p
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.26, duration: 0.55, ease: EASE_FLOW }}
                      className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed"
                    >
                      {benefit.description}
                    </motion.p>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>

            {!reduceMotion && (
              <div className="benefit-carousel-progress mt-3 h-0.5 rounded-full overflow-hidden">
                <motion.div
                  key={`progress-${index}-${paused}`}
                  className="h-full w-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: paused ? 0 : 1 }}
                  style={{ transformOrigin: 'left center' }}
                  transition={
                    paused
                      ? { duration: 0.3, ease: EASE_FLOW }
                      : { duration: INTERVAL_MS / 1000, ease: 'linear' }
                  }
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {WORKSHOP_BENEFITS.map((b, i) => (
                  <motion.button
                    key={b.id}
                    type="button"
                    aria-label={`Show ${b.title}`}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => goTo(i, i > index ? 1 : -1)}
                    className={`h-1.5 rounded-full cursor-pointer ${
                      i === index ? 'bg-purple-500' : 'bg-purple-500/30 hover:bg-purple-500/50'
                    }`}
                    animate={{
                      width: i === index ? 22 : 6,
                      boxShadow:
                        i === index
                          ? '0 0 12px rgba(168,85,247,0.7)'
                          : '0 0 0 rgba(0,0,0,0)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous topic"
                  onClick={prev}
                  className="community-ctrl"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next topic"
                  onClick={next}
                  className="community-ctrl"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {WORKSHOP_BENEFITS.map((b, i) => (
                <button
                  key={`chip-${b.id}`}
                  type="button"
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  className={`benefit-topic-chip ${i === index ? 'benefit-topic-chip-active' : ''}`}
                >
                  {b.title}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
