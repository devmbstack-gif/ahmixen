'use client';

import { useRef, type MouseEvent } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { INSTRUCTOR_DATA } from '../data/workshopData';
import { Reveal } from './Reveal';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function InstructorPhoto() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 18 });
  const springY = useSpring(y, { stiffness: 180, damping: 18 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-9, 9]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] md:max-w-none [perspective:1000px]">
      <motion.div
        ref={ref}
        className="instructor-photo-wrap relative"
        style={
          reduceMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }
        }
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={
          reduceMotion
            ? undefined
            : { y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } }
        }
      >
        <div className="instructor-photo-frame relative aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-3xl">
          <Image
            src={INSTRUCTOR_DATA.photo}
            alt={INSTRUCTOR_DATA.name}
            fill
            sizes="(max-width: 640px) 280px, 360px"
            className="object-cover object-top"
            priority
          />
          <div className="instructor-photo-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
        </div>
      </motion.div>
    </div>
  );
}

export const Instructor: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section id="instructor" className="relative py-10 sm:py-12 md:py-14 overflow-hidden">
      <div className="instructor-glow pointer-events-none absolute inset-0" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-6 sm:mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Your <span className="gradient-text-ahmixen">Instructor</span>
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="instructor-panel grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)]">
            <div className="order-2 md:order-1 text-center md:text-left space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)]">
                  {INSTRUCTOR_DATA.name}
                </h3>
                <p className="text-sm font-medium text-purple-400 mt-0.5">
                  {INSTRUCTOR_DATA.title}
                </p>
              </div>
              <p className="text-sm sm:text-[15px] text-[var(--text-secondary)] leading-relaxed">
                {INSTRUCTOR_DATA.bio}
              </p>
              <ul className="space-y-2">
                {INSTRUCTOR_DATA.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-center md:justify-start gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
                <motion.a
                  href={INSTRUCTOR_DATA.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${INSTRUCTOR_DATA.name} on LinkedIn`}
                  className="instructor-social"
                  whileHover={reduceMotion ? undefined : { y: -3, scale: 1.06 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, -3, 0] }
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : {
                          y: {
                            duration: 3.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: 0.2,
                          },
                        }
                  }
                >
                  <LinkedInIcon className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href={INSTRUCTOR_DATA.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${INSTRUCTOR_DATA.name} on Instagram`}
                  className="instructor-social"
                  whileHover={reduceMotion ? undefined : { y: -3, scale: 1.06 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, -3, 0] }
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : {
                          y: {
                            duration: 3.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: 0.7,
                          },
                        }
                  }
                >
                  <InstagramIcon className="w-5 h-5" />
                </motion.a>
              </div>
            </div>

            <div className="order-1 md:order-2 flex justify-center md:justify-end">
              <InstructorPhoto />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
