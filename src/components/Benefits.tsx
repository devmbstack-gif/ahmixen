'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
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

function readStackMetrics(el: HTMLElement) {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;height:var(--benefit-card-h)';
  const peekProbe = document.createElement('div');
  peekProbe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;height:var(--benefit-peek)';
  el.appendChild(probe);
  el.appendChild(peekProbe);
  const cardH = probe.offsetHeight || 200;
  const peek = peekProbe.offsetHeight || 40;
  el.removeChild(probe);
  el.removeChild(peekProbe);
  return { cardH, peek };
}

export const Benefits: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const stackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const [metrics, setMetrics] = useState({ cardH: 200, peek: 42 });
  const total = WORKSHOP_BENEFITS.length;

  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;

    const update = () => setMetrics(readStackMetrics(el));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const openLayer = (index: number) => {
    if (index === activeIndex) {
      setActiveIndex((prev) => (prev + 1) % total);
      return;
    }
    setActiveIndex(index);
  };

  return (
    <section id="benefits" className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
      <div className="benefit-stack-glow absolute inset-x-0 bottom-0 h-[70%] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            What You&apos;ll <span className="gradient-text-ahmixen">Learn</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Four practical topics — clear, focused, and ready to use at work.
          </p>
        </Reveal>

        <motion.div
          ref={stackRef}
          className="benefit-stack relative"
          viewport={{ once: true, amount: 0.35 }}
          onViewportEnter={() => setEntered(true)}
        >
          {WORKSHOP_BENEFITS.map((benefit, benefitIndex) => {
            const depth =
              benefitIndex === activeIndex
                ? 0
                : benefitIndex < activeIndex
                  ? total - activeIndex + benefitIndex
                  : benefitIndex - activeIndex;

            const isFront = depth === 0;
            const art = benefitArt[benefit.id];
            const top = (total - 1 - depth) * metrics.peek;
            const height = isFront ? metrics.cardH : metrics.peek + 6;
            const scale = 1 - depth * 0.016;

            return (
              <motion.article
                key={benefit.id}
                role="button"
                tabIndex={0}
                aria-pressed={isFront}
                aria-label={`${benefit.title}. ${isFront ? 'Active — tap to open next' : 'Tap to open'}`}
                onClick={() => openLayer(benefitIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLayer(benefitIndex);
                  }
                }}
                initial={false}
                animate={{
                  top,
                  height,
                  scale,
                  zIndex: total - depth,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness: 280,
                        damping: 26,
                        mass: 0.85,
                      }
                }
                whileHover={
                  reduceMotion || !isFront
                    ? undefined
                    : { scale: 1.02, transition: { duration: 0.2 } }
                }
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                className={`benefit-layer absolute left-0 right-0 cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  isFront ? 'benefit-layer-active' : ''
                }`}
                style={{ transformOrigin: 'center top' }}
              >
                <div className="touch-layer-shimmer" aria-hidden="true" />
                <motion.div
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 40,
                          x: benefitIndex % 2 === 0 ? -20 : 20,
                        }
                  }
                  animate={
                    entered || reduceMotion
                      ? { opacity: 1, y: 0, x: 0 }
                      : {
                          opacity: 0,
                          y: 40,
                          x: benefitIndex % 2 === 0 ? -20 : 20,
                        }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 260,
                          damping: 26,
                          delay: benefitIndex * 0.18,
                        }
                  }
                  className="benefit-art-frame"
                >
                  {art && (
                    <div className="benefit-art-motion absolute inset-0">
                      <Image
                        src={art.dark}
                        alt={art.alt}
                        fill
                        sizes="(max-width: 640px) 360px, 480px"
                        quality={95}
                        className="benefit-art-dark pointer-events-none select-none"
                        priority={benefitIndex < 2}
                      />
                      <Image
                        src={art.light}
                        alt={art.alt}
                        fill
                        sizes="(max-width: 640px) 360px, 480px"
                        quality={95}
                        className="benefit-art-light pointer-events-none select-none"
                        priority={benefitIndex < 2}
                      />
                    </div>
                  )}

                  <div className="benefit-layer-sheen" />

                  {!isFront && (
                    <div
                      className="absolute inset-x-0 bottom-0 h-6 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to top, color-mix(in srgb, var(--card-bg) 88%, transparent), transparent)',
                      }}
                    />
                  )}
                </motion.div>
              </motion.article>
            );
          })}
        </motion.div>

        <div className="mt-5 sm:mt-6 flex flex-col items-center gap-2.5">
          <div className="flex items-center justify-center gap-2">
            {WORKSHOP_BENEFITS.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Show ${b.title}`}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === activeIndex
                    ? 'w-5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.65)]'
                    : 'w-1.5 bg-purple-500/30 hover:bg-purple-500/50'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] text-center px-2">
            {WORKSHOP_BENEFITS[activeIndex].title}
          </p>
        </div>
      </div>
    </section>
  );
};
