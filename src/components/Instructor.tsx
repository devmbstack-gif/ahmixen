'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import type { Instructor as InstructorData } from '../data/instructor';

const EASE = [0.16, 1, 0.3, 1] as const;

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

function useCountUp(target: number, active: boolean, reduceMotion: boolean | null) {
  const [value, setValue] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    if (!active) return;

    const duration = 1100;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduceMotion, target]);

  return value;
}

function formatCount(n: number) {
  return n.toLocaleString('en-US');
}

function StatBlock({
  value,
  suffix,
  label,
  active,
  reduceMotion,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  reduceMotion: boolean | null;
  delay: number;
}) {
  const count = useCountUp(value, active, reduceMotion);

  return (
    <motion.div
      className="instructor-stat"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.45, delay: reduceMotion ? 0 : delay, ease: EASE }}
    >
      <span className="instructor-stat-number">
        {formatCount(count)}
        {suffix}
      </span>
      <span className="instructor-stat-label">{label}</span>
    </motion.div>
  );
}

function InstructorPortrait({ data }: { data: InstructorData }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.05, margin: '80px 0px' });
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setForceShow(true);
      return;
    }
    const t = window.setTimeout(() => setForceShow(true), 1000);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  const show = Boolean(reduceMotion || inView || forceShow);

  return (
    <motion.div
      ref={ref}
      className="instructor-photo-wrap"
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 22 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.55, ease: EASE }}
    >
      <div className="instructor-photo-frame">
        <Image
          src={encodeURI(data.photo)}
          alt={data.name}
          fill
          sizes="(max-width: 768px) 416px, (max-width: 1024px) 480px, 544px"
          className="instructor-photo-img"
          priority
          unoptimized
        />
      </div>
    </motion.div>
  );
}

export const Instructor: React.FC<{ data: InstructorData }> = ({ data }) => {
  const reduceMotion = useReducedMotion();
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [statsActive, setStatsActive] = useState(false);
  const visibleInstructorStats = data.stats.filter((s) => s.visible);

  const nameParts = data.name.split(' ').filter(Boolean);
  const lastName = nameParts[nameParts.length - 1] ?? data.name;
  const nameBefore = nameParts.slice(0, -1).join(' ');

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStatsActive(true);
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
      id="instructor"
      className="relative section-y instructor-section bg-transparent"
      aria-labelledby="instructor-heading"
    >
      <div className="relative container-narrow instructor-container">
        <h2 id="instructor-heading" className="sr-only">
          Your Instructor
        </h2>

        <div className="instructor-panel grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="order-2 md:order-1 text-center md:text-left space-y-5">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.5, delay: reduceMotion ? 0 : 0.12, ease: EASE }}
            >
              <h3 className="instructor-name">
                {nameBefore ? `${nameBefore} ` : ''}
                <span className="gradient-text-ahmixen">{lastName}</span>
              </h3>
              <p className="instructor-title mt-1">
                {data.title}
              </p>
            </motion.div>

            <motion.p
              className="instructor-bio text-[var(--text-secondary)] leading-relaxed"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.5, delay: reduceMotion ? 0 : 0.2, ease: EASE }}
            >
              {data.bio}
            </motion.p>

            <div ref={statsRef} className="instructor-stats">
              {visibleInstructorStats.map((stat, i) => (
                <StatBlock
                  key={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  active={statsActive}
                  reduceMotion={reduceMotion}
                  delay={0.26 + i * 0.08}
                />
              ))}
            </div>

            <motion.div
              className="instructor-chip inline-flex"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.45, delay: reduceMotion ? 0 : 0.42, ease: EASE }}
            >
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
              <span>{data.chip}</span>
            </motion.div>

            <div className="pt-1 flex items-center justify-center md:justify-start gap-3">
              <motion.a
                href={data.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${data.name} on LinkedIn`}
                className="instructor-social"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.06 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              >
                <LinkedInIcon className="w-5 h-5" />
              </motion.a>
              <motion.a
                href={data.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${data.name} on Instagram`}
                className="instructor-social"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.06 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              >
                <InstagramIcon className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          <div className="order-1 md:order-2 flex justify-center md:justify-end">
            <InstructorPortrait data={data} />
          </div>
        </div>
      </div>
    </section>
  );
};
