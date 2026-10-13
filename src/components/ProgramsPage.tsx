'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { GraduationCap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import type { PublicSessionDisplay } from '../lib/sessions/publicShared';
import type { ProgramCardPublic } from '@/lib/content/landingPublic';

const AnimatedBackground = dynamic(
  () => import('./AnimatedBackground').then((m) => ({ default: m.AnimatedBackground })),
  { ssr: false, loading: () => null }
);

const EASE = [0.16, 1, 0.3, 1] as const;

export const ProgramsPage: React.FC<{
  publicSession: PublicSessionDisplay;
  cards: ProgramCardPublic[];
}> = ({ publicSession, cards }) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink transition-colors duration-300 antialiased selection:bg-brand selection:text-white relative">
      <AnimatedBackground />

      <Navbar />

      <main className="programs-page flex-1">
        <div className="container-narrow programs-page-inner">
          <h1 className="programs-heading purple-badge">Programs</h1>

          <ul className="programs-grid">
            {cards.map((program, index) => {
              const badges = program.badges.map((badge, badgeIndex) =>
                badgeIndex === 0 ? publicSession.durationLabel : badge
              );

              return (
                <motion.li
                  key={program.id}
                  className="programs-grid-item"
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.5,
                    delay: reduceMotion ? 0 : index * 0.06,
                    ease: EASE,
                  }}
                >
                  <Link href={program.href} className="program-card nav-focus">
                    <div className="program-card-media">
                      <Image
                        src={program.posterUrl}
                        alt={program.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
                        className="program-card-img object-cover object-[50%_28%]"
                        loading="lazy"
                      />
                      <div className="program-card-media-fade" aria-hidden="true" />
                      <div className="program-card-badges">
                        {badges.map((badge) => (
                          <span key={badge} className="program-card-badge">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="program-card-body">
                      <span className="program-card-avatar" aria-hidden="true">
                        <GraduationCap className="w-4 h-4" />
                      </span>
                      <div className="program-card-meta">
                        <div className="program-card-title-row">
                          <h2 className="program-card-title">{program.title}</h2>
                          <span className="program-card-price">
                            {program.priceLabel}
                          </span>
                        </div>
                        <p className="program-card-instructor">
                          Instructor: {program.instructorLine}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
};
