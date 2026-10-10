'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Calendar, Clock, Hourglass, Video } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import { WORKSHOP_CONFIG } from '../data/workshopData';
import { Countdown } from './Countdown';

interface HeroProps {
  onOpenRegister: () => void;
  onExploreWorkshop: () => void;
}

const metaItems = [
  { icon: Calendar, label: `On ${WORKSHOP_CONFIG.dateShort}`, live: false },
  { icon: Hourglass, label: WORKSHOP_CONFIG.durationLabel, live: false },
  { icon: Video, label: WORKSHOP_CONFIG.sessionLabel, live: true },
  { icon: Clock, label: WORKSHOP_CONFIG.time, live: false },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function splitWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

export const Hero: React.FC<HeroProps> = ({ onOpenRegister, onExploreWorkshop }) => {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const spotX = useMotionValue(50);
  const spotY = useMotionValue(40);
  const smoothX = useSpring(spotX, { stiffness: 80, damping: 22, mass: 0.4 });
  const smoothY = useSpring(spotY, { stiffness: 80, damping: 22, mass: 0.4 });
  const spotlightBg = useMotionTemplate`radial-gradient(560px circle at ${smoothX}% ${smoothY}%, rgba(192, 132, 252, 0.22) 0%, rgba(147, 51, 234, 0.1) 28%, transparent 58%)`;

  const magX = useMotionValue(0);
  const magY = useMotionValue(0);
  const magSpringX = useSpring(magX, { stiffness: 220, damping: 18, mass: 0.35 });
  const magSpringY = useSpring(magY, { stiffness: 220, damping: 18, mass: 0.35 });
  const magScale = useMotionValue(1);
  const magSpringScale = useSpring(magScale, { stiffness: 260, damping: 20, mass: 0.3 });

  const line1Words = useMemo(
    () => splitWords(`${WORKSHOP_CONFIG.titlePrefix} ${WORKSHOP_CONFIG.titleDuration}`),
    []
  );
  const line2Words = useMemo(
    () => splitWords(WORKSHOP_CONFIG.titleHighlight),
    []
  );

  const [particleCount, setParticleCount] = useState(10);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setParticleCount(mq.matches ? 16 : 8);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 11) % 100}%`,
        top: `${(i * 53 + 7) % 100}%`,
        size: 2 + (i % 3),
        delay: (i % 8) * 0.35,
        duration: 6 + (i % 5),
      })),
    [particleCount]
  );

  useEffect(() => {
    if (reduceMotion) return;
    const el = sectionRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      spotX.set(Math.max(0, Math.min(100, x)));
      spotY.set(Math.max(0, Math.min(100, y)));
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, [reduceMotion, spotX, spotY]);

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
      ref={sectionRef}
      id="hero"
      className="hero-premium relative min-h-[100svh] flex items-center pt-24 pb-8 md:pt-28 md:pb-10 bg-transparent overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Aurora / mesh blobs */}
      <div className="hero-aurora pointer-events-none absolute inset-0" aria-hidden="true">
        <motion.div
          className="hero-aurora-blob hero-aurora-blob-a"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.96, 1] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero-aurora-blob hero-aurora-blob-b"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -50, 30, 0], y: [0, 40, -25, 0], scale: [1, 0.94, 1.1, 1] }
          }
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero-aurora-blob hero-aurora-blob-c"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 25, -35, 0], y: [0, -20, 35, 0], scale: [1, 1.12, 0.98, 1] }
          }
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating particles */}
      {mounted && !reduceMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="hero-float-particle absolute rounded-full"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
              }}
              animate={{
                y: [0, -18, 8, 0],
                x: [0, 10, -6, 0],
                opacity: [0.15, 0.55, 0.25, 0.15],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Mouse-follow spotlight */}
      {!reduceMotion && (
        <motion.div
          className="hero-spotlight pointer-events-none absolute inset-0"
          style={{ background: spotlightBg }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 w-full container-page text-center">
        <h1
          id="hero-heading"
          className="type-display uppercase"
        >
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
                  delay: reduceMotion ? 0 : 0.06 + (line1Words.length + i) * 0.08,
                  ease: EASE,
                }}
                className="hero-gradient-text inline-block mr-[0.28em] last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.div
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.55 }}
          className="mt-7 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
        >
          <span className="inline-flex items-center bg-[var(--primary-purple)] text-white font-extrabold text-base sm:text-xl md:text-2xl px-3.5 sm:px-4 py-1.5 rounded-md leading-tight shadow-[0_8px_28px_-8px_rgba(124,58,237,0.65)]">
            {WORKSHOP_CONFIG.calloutQuestion}
          </span>
          <span className="hero-gradient-text font-extrabold text-base sm:text-xl md:text-2xl leading-tight">
            {WORKSHOP_CONFIG.calloutAnswer}
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
          <span className="hero-urgency-badge">
            <span className="hero-urgency-dot" aria-hidden="true" />
            Limited seats · {WORKSHOP_CONFIG.seatsRemaining} left
          </span>
          <Countdown />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.9 }}
          className="mt-7 md:mt-8 flex flex-col items-center gap-4"
        >
          <motion.button
            ref={ctaRef}
            type="button"
            id="hero-reserve-cta"
            onClick={onOpenRegister}
            className="btn-ahmixen btn-magnetic relative py-3.5 px-8 sm:px-10 rounded-full font-bold text-base sm:text-lg inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_12px_40px_-10px_rgba(168,85,247,0.75)]"
            style={
              reduceMotion
                ? undefined
                : { x: magSpringX, y: magSpringY, scale: magSpringScale }
            }
            onMouseMove={(e) => {
              if (reduceMotion || !ctaRef.current) return;
              const rect = ctaRef.current.getBoundingClientRect();
              const offsetX = e.clientX - (rect.left + rect.width / 2);
              const offsetY = e.clientY - (rect.top + rect.height / 2);
              magX.set(offsetX * 0.32);
              magY.set(offsetY * 0.32);
              magScale.set(1.06);
            }}
            onMouseLeave={() => {
              magX.set(0);
              magY.set(0);
              magScale.set(1);
            }}
            onPointerDown={() => {
              if (!reduceMotion) magScale.set(0.97);
            }}
            onPointerUp={() => {
              if (!reduceMotion) magScale.set(1.06);
            }}
          >
            <span className="relative z-[2] inline-flex items-center gap-2">
              Reserve My Seat
              <ArrowRight className="w-5 h-5" />
            </span>
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
      </div>
    </section>
  );
};
