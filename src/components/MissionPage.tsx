'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ArrowUpRight, GraduationCap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MISSION } from '../data/mission';
import { instructor, visibleInstructorStats } from '../data/instructor';

const AnimatedBackground = dynamic(
  () => import('./AnimatedBackground').then((m) => ({ default: m.AnimatedBackground })),
  { ssr: false, loading: () => null }
);

const RegistrationModal = dynamic(
  () => import('./RegistrationModal').then((m) => ({ default: m.RegistrationModal })),
  { ssr: false }
);

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, amount: 0.1 } as const;

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

function useCountUp(target: number, active: boolean, reduceMotion: boolean) {
  // Start at the final value so static→motion swap never flashes 0; count only after active.
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    if (!active) {
      setValue(target);
      return;
    }

    setValue(0);
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

function ArcGroupStatic({ className, sizes }: { className: string; sizes: string[] }) {
  return (
    <div className={className} aria-hidden="true">
      {sizes.map((size, i) => (
        <span
          key={size}
          className={`mission-arc mission-arc-${i + 1}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

function ArcGroupMotion({ className, sizes }: { className: string; sizes: string[] }) {
  return (
    <motion.div
      className={className}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: EASE }}
    >
      {sizes.map((size, i) => (
        <span
          key={size}
          className={`mission-arc mission-arc-${i + 1}`}
          style={{ width: size, height: size }}
        />
      ))}
    </motion.div>
  );
}

function MissionIdentity() {
  const nameParts = instructor.name.split(' ').filter(Boolean);
  const lastName = nameParts[nameParts.length - 1] ?? instructor.name;
  const nameBefore = nameParts.slice(0, -1).join(' ');

  return (
    <>
      <h2 className="mission-instructor-name">
        {nameBefore ? `${nameBefore} ` : ''}
        <span className="gradient-text-ahmixen">{lastName}</span>
      </h2>
      <p className="mission-instructor-title">{instructor.title}</p>
    </>
  );
}

function MissionStory() {
  return (
    <>
      <p className="mission-story-text">{MISSION.story.text}</p>
      <a
        href={MISSION.story.link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mission-story-link nav-focus"
      >
        {MISSION.story.link.label}
        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    </>
  );
}

function MissionSocials() {
  return (
    <div className="mission-socials">
      <a
        href={instructor.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${instructor.name} on LinkedIn`}
        className="instructor-social nav-focus"
      >
        <LinkedInIcon className="w-5 h-5" />
      </a>
      <a
        href={instructor.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${instructor.name} on Instagram`}
        className="instructor-social nav-focus"
      >
        <InstagramIcon className="w-5 h-5" />
      </a>
    </div>
  );
}

function MissionPhoto() {
  return (
    <div className="mission-photo-frame">
      <Image
        src={encodeURI(instructor.photo)}
        alt={instructor.name}
        fill
        sizes="(max-width: 1023px) 100vw, 33vw"
        className="mission-photo-img"
        priority
        unoptimized
      />
    </div>
  );
}

/** Plain HTML for SSR + first client paint — identical on both sides. */
function MissionEditorialStatic() {
  const titleLines = MISSION.title.split(' ');
  const [featuredStat, ...otherStats] = visibleInstructorStats;

  return (
    <div className="mission-editorial-inner">
      <ArcGroupStatic
        className="mission-arcs mission-arcs-tl"
        sizes={['43.75rem', '34rem', '24rem']}
      />
      <ArcGroupStatic
        className="mission-arcs mission-arcs-br"
        sizes={['37.5rem', '28rem', '19rem']}
      />

      <div className="container-narrow mission-grid">
        <div className="mission-col mission-col-1">
          <div className="mission-left-stack">
            <div className="mission-title-block">
              <h1 id="mission-hero-heading" className="mission-title">
                {titleLines.map((line) => (
                  <span key={line} className="mission-title-mask">
                    <span className="mission-title-line">{line}</span>
                  </span>
                ))}
              </h1>
              <div className="mission-title-rule" aria-hidden="true" />
              <p className="mission-sub">{MISSION.sub}</p>
              <p className="mission-accent">{MISSION.accentLine}</p>
            </div>

            <div className="mission-story-rule" aria-hidden="true" />
            <div className="mission-story-block">
              <MissionStory />
            </div>
          </div>
        </div>

        <div className="mission-col mission-col-2">
          <div className="mission-identity">
            <MissionIdentity />
          </div>

          <div className="mission-bio-stat">
            <p className="mission-short-bio">{instructor.shortBio}</p>
            {featuredStat && (
              <div className="mission-featured-stat">
                <span className="mission-featured-shape" aria-hidden="true" />
                <p
                  className="mission-featured-number"
                  aria-label={`${featuredStat.value}${featuredStat.suffix} ${featuredStat.label}`}
                >
                  <span aria-hidden="true">
                    {featuredStat.value}
                    {featuredStat.suffix}
                  </span>
                </p>
                <p className="mission-featured-label">{featuredStat.label}</p>
              </div>
            )}
          </div>

          {otherStats.length > 0 && (
            <>
              <div className="mission-stats-rule" aria-hidden="true" />
              <ul className="mission-other-stats">
                {otherStats.map((stat) => (
                  <li key={stat.label} className="mission-other-stat">
                    <span className="mission-other-stat-num">
                      {stat.value}
                      {stat.suffix}
                    </span>
                    <span className="mission-other-stat-label">{stat.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mission-seminars">
            <p className="mission-seminars-label">
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>{instructor.seminars.label}</span>
            </p>
            <ul className="mission-seminar-chips">
              {instructor.seminars.places.map((place) => (
                <li key={place} className="mission-seminar-chip">
                  {place}
                </li>
              ))}
            </ul>
          </div>

          <MissionSocials />
        </div>

        <div className="mission-col mission-col-3">
          <div className="mission-photo-block">
            <MissionPhoto />
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionEditorialMotion({ reduceMotion }: { reduceMotion: boolean }) {
  const playMotion = !reduceMotion;
  const [statsActive, setStatsActive] = useState(reduceMotion);
  const titleLines = MISSION.title.split(' ');
  const [featuredStat, ...otherStats] = visibleInstructorStats;
  const featuredCount = useCountUp(
    featuredStat?.value ?? 0,
    statsActive && !!featuredStat,
    reduceMotion
  );

  useEffect(() => {
    if (reduceMotion) {
      setStatsActive(true);
      return;
    }
    const t = window.setTimeout(() => setStatsActive(true), 700);
    const fallback = window.setTimeout(() => setStatsActive(true), 2000);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(fallback);
    };
  }, [reduceMotion]);

  return (
    <div className="mission-editorial-inner">
      {playMotion ? (
        <>
          <ArcGroupMotion
            className="mission-arcs mission-arcs-tl"
            sizes={['43.75rem', '34rem', '24rem']}
          />
          <ArcGroupMotion
            className="mission-arcs mission-arcs-br"
            sizes={['37.5rem', '28rem', '19rem']}
          />
        </>
      ) : (
        <>
          <ArcGroupStatic
            className="mission-arcs mission-arcs-tl"
            sizes={['43.75rem', '34rem', '24rem']}
          />
          <ArcGroupStatic
            className="mission-arcs mission-arcs-br"
            sizes={['37.5rem', '28rem', '19rem']}
          />
        </>
      )}

      <div className="container-narrow mission-grid">
        <div className="mission-col mission-col-1">
          <div className="mission-left-stack">
            <div className="mission-title-block">
              <h1 id="mission-hero-heading" className="mission-title">
                {titleLines.map((line, i) => (
                  <span key={line} className="mission-title-mask">
                    <motion.span
                      className="mission-title-line"
                      initial={playMotion ? { y: '100%' } : false}
                      animate={{ y: 0 }}
                      transition={{
                        duration: playMotion ? 0.55 : 0.01,
                        delay: playMotion ? i * 0.08 : 0,
                        ease: EASE,
                      }}
                    >
                      {line}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.div
                className="mission-title-rule"
                aria-hidden="true"
                initial={playMotion ? { scaleX: 0 } : false}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: playMotion ? 0.55 : 0.01,
                  delay: playMotion ? 0.2 : 0,
                  ease: EASE,
                }}
              />

              <motion.p
                className="mission-sub"
                initial={playMotion ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: playMotion ? 0.45 : 0.01,
                  delay: playMotion ? 0.28 : 0,
                  ease: EASE,
                }}
              >
                {MISSION.sub}
              </motion.p>

              <motion.p
                className="mission-accent"
                initial={playMotion ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: playMotion ? 0.45 : 0.01,
                  delay: playMotion ? 0.36 : 0,
                  ease: EASE,
                }}
              >
                {MISSION.accentLine}
              </motion.p>
            </div>

            <div className="mission-story-rule" aria-hidden="true" />
            <motion.div
              className="mission-story-block"
              initial={playMotion ? { opacity: 0, y: 14 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: playMotion ? 0.4 : 0.01, ease: EASE }}
            >
              <MissionStory />
            </motion.div>
          </div>
        </div>

        <div className="mission-col mission-col-2">
          <motion.div
            className="mission-identity"
            initial={playMotion ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: playMotion ? 0.45 : 0.01,
              delay: playMotion ? 0.28 : 0,
              ease: EASE,
            }}
          >
            <MissionIdentity />
          </motion.div>

          <div className="mission-bio-stat">
            <motion.p
              className="mission-short-bio"
              initial={playMotion ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: playMotion ? 0.4 : 0.01,
                delay: playMotion ? 0.34 : 0,
                ease: EASE,
              }}
            >
              {instructor.shortBio}
            </motion.p>

            {featuredStat && (
              <div className="mission-featured-stat">
                <motion.span
                  className="mission-featured-shape"
                  aria-hidden="true"
                  initial={playMotion ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: playMotion ? 0.55 : 0.01,
                    delay: playMotion ? 0.4 : 0,
                    ease: EASE,
                  }}
                />
                <p
                  className="mission-featured-number"
                  aria-label={`${featuredStat.value}${featuredStat.suffix} ${featuredStat.label}`}
                >
                  <span aria-hidden="true">
                    {featuredCount}
                    {featuredStat.suffix}
                  </span>
                </p>
                <p className="mission-featured-label">{featuredStat.label}</p>
              </div>
            )}
          </div>

          {otherStats.length > 0 && (
            <>
              <div className="mission-stats-rule" aria-hidden="true" />
              <ul className="mission-other-stats">
                {otherStats.map((stat, i) => (
                  <OtherStat
                    key={stat.label}
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                    active={statsActive}
                    reduceMotion={reduceMotion}
                    playMotion={playMotion}
                    delay={0.5 + i * 0.08}
                  />
                ))}
              </ul>
            </>
          )}

          <div className="mission-seminars">
            <p className="mission-seminars-label">
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>{instructor.seminars.label}</span>
            </p>
            <ul className="mission-seminar-chips">
              {instructor.seminars.places.map((place, i) => (
                <motion.li
                  key={place}
                  className="mission-seminar-chip"
                  initial={playMotion ? { opacity: 0, y: 8 } : false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: playMotion ? 0.35 : 0.01,
                    delay: playMotion ? 0.55 + i * 0.06 : 0,
                    ease: EASE,
                  }}
                >
                  {place}
                </motion.li>
              ))}
            </ul>
          </div>

          <MissionSocials />
        </div>

        <div className="mission-col mission-col-3">
          <div className="mission-photo-block">
            <motion.div
              className="mission-photo-frame"
              initial={playMotion ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: playMotion ? 0.55 : 0.01,
                delay: playMotion ? 0.2 : 0,
                ease: EASE,
              }}
            >
              <Image
                src={encodeURI(instructor.photo)}
                alt={instructor.name}
                fill
                sizes="(max-width: 1023px) 100vw, 33vw"
                className="mission-photo-img"
                priority
                unoptimized
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OtherStat({
  value,
  suffix,
  label,
  active,
  reduceMotion,
  playMotion,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  reduceMotion: boolean;
  playMotion: boolean;
  delay: number;
}) {
  const count = useCountUp(value, active, reduceMotion);

  return (
    <motion.li
      className="mission-other-stat"
      initial={playMotion ? { opacity: 0, y: 10 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: playMotion ? 0.4 : 0.01, delay: playMotion ? delay : 0, ease: EASE }}
    >
      <span className="mission-other-stat-num">
        {count}
        {suffix}
      </span>
      <span className="mission-other-stat-label">{label}</span>
    </motion.li>
  );
}

export const MissionPage: React.FC = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink transition-colors duration-300 antialiased selection:bg-brand selection:text-white relative">
      <AnimatedBackground />
      <Navbar onOpenRegister={() => setRegisterOpen(true)} />

      <main className="mission-page flex-1">
        <section className="mission-editorial" aria-labelledby="mission-hero-heading">
          {/* Static shell hydrates 1:1; motion mounts only after client ready */}
          {!mounted ? (
            <MissionEditorialStatic />
          ) : (
            <MissionEditorialMotion reduceMotion={!!reduceMotion} />
          )}
        </section>
      </main>

      <Footer />

      {registerOpen && (
        <RegistrationModal
          isOpen={registerOpen}
          onClose={() => setRegisterOpen(false)}
        />
      )}
    </div>
  );
};
