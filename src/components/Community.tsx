'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Reveal } from './Reveal';

const SLIDES = [
  {
    src: '/community/workshop-01.jpg',
    alt: 'Speaking at the Agentic AI & vibe coding workshop',
  },
  {
    src: '/community/workshop-02.jpg',
    alt: 'Workshop hosts with Mukabbir University leadership',
  },
  {
    src: '/community/workshop-03.jpg',
    alt: 'Live n8n automation demo on stage',
  },
  {
    src: '/community/workshop-04.jpg',
    alt: 'AhmiXen speaking and training collage',
  },
  {
    src: '/community/workshop-05.jpg',
    alt: 'Full room at the Agentic AI workshop',
  },
  {
    src: '/community/workshop-06.jpg',
    alt: 'Audience during the live AI session',
  },
  {
    src: '/community/workshop-07.jpg',
    alt: 'Instructor addressing the community',
  },
] as const;

/** Time each slide stays fully visible before the next fade begins */
const INTERVAL_MS = 3200;
const EASE_FLOW: [number, number, number, number] = [0.22, 1, 0.36, 1];

const slideVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 56 : -56,
    scale: 1.045,
    filter: 'blur(8px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -40 : 40,
    scale: 0.985,
    filter: 'blur(6px)',
  }),
};

export const Community: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const total = SLIDES.length;

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

  const slide = SLIDES[index];

  return (
    <section
      id="community"
      className="community-section relative py-10 sm:py-12 md:py-14 overflow-hidden border-t border-[var(--border-subtle)]"
      aria-label="Our growing community"
    >
      <div className="community-section-glow pointer-events-none absolute inset-0" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-6 sm:mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Our <span className="gradient-text-ahmixen">Community</span> Is Growing Fast
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Real workshops · Real people · Building AI skills together
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            className="community-slider relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setPaused(false);
              }
            }}
          >
            <div className="community-slider-frame relative rounded-2xl sm:rounded-3xl overflow-hidden">
              <AnimatePresence initial={false} custom={direction} mode="sync">
                <motion.div
                  key={slide.src}
                  custom={direction}
                  variants={reduceMotion ? undefined : slideVariants}
                  initial={reduceMotion ? { opacity: 0 } : 'enter'}
                  animate={reduceMotion ? { opacity: 1 } : 'center'}
                  exit={reduceMotion ? { opacity: 0 } : 'exit'}
                  transition={
                    reduceMotion
                      ? { duration: 0.2 }
                      : {
                          opacity: { duration: 0.95, ease: EASE_FLOW },
                          x: { duration: 1.05, ease: EASE_FLOW },
                          scale: { duration: 1.1, ease: EASE_FLOW },
                          filter: { duration: 0.85, ease: EASE_FLOW },
                        }
                  }
                  className="absolute inset-0 p-2 sm:p-3 will-change-transform"
                >
                  <motion.div
                    className="relative h-full w-full overflow-hidden rounded-xl"
                    initial={false}
                    animate={
                      reduceMotion || paused
                        ? { scale: 1 }
                        : { scale: [1, 1.035] }
                    }
                    transition={
                      reduceMotion || paused
                        ? { duration: 0.4 }
                        : {
                            duration: INTERVAL_MS / 1000,
                            ease: 'linear',
                          }
                    }
                  >
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      priority={index < 2}
                      sizes="(max-width: 768px) 100vw, 896px"
                      className="object-contain object-center"
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 px-0.5 min-h-[1.25rem]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={slide.alt}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.45, ease: EASE_FLOW }}
                  className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium min-w-0 truncate"
                >
                  {slide.alt}
                </motion.p>
              </AnimatePresence>
              <span className="community-counter shrink-0 text-[11px] font-mono">
                {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </div>

            {!reduceMotion && (
              <div className="community-progress mt-3 h-0.5 rounded-full overflow-hidden">
                <motion.div
                  key={`progress-${index}-${paused}`}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: paused ? 0 : 1 }}
                  style={{ transformOrigin: 'left center' }}
                  transition={
                    paused
                      ? { duration: 0.35, ease: EASE_FLOW }
                      : { duration: INTERVAL_MS / 1000, ease: 'linear' }
                  }
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {SLIDES.map((s, i) => (
                  <motion.button
                    key={s.src}
                    type="button"
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => goTo(i, i > index ? 1 : -1)}
                    className={`h-1.5 rounded-full cursor-pointer ${
                      i === index ? 'bg-purple-500' : 'community-dot'
                    }`}
                    animate={{
                      width: i === index ? 24 : 6,
                      boxShadow:
                        i === index
                          ? '0 0 10px rgba(168,85,247,0.65)'
                          : '0 0 0 rgba(0,0,0,0)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}
                  onClick={() => setPaused((p) => !p)}
                  className="community-ctrl"
                >
                  {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={prev}
                  className="community-ctrl"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={next}
                  className="community-ctrl"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5">
              {SLIDES.map((s, i) => (
                <motion.button
                  key={`thumb-${s.src}`}
                  type="button"
                  aria-label={`Jump to photo ${i + 1}`}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  className={`community-thumb relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer ${
                    i === index
                      ? 'border-purple-500/70 ring-2 ring-purple-500/35'
                      : 'opacity-60 hover:opacity-95'
                  }`}
                  animate={{
                    opacity: i === index ? 1 : 0.6,
                    scale: i === index ? 1.04 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  whileHover={reduceMotion ? undefined : { scale: i === index ? 1.04 : 1.03 }}
                >
                  <Image
                    src={s.src}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-contain p-0.5"
                  />
                </motion.button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
