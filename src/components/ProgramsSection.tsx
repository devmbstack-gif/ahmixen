'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GraduationCap, Lock } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { PublicSessionDisplay } from '../lib/sessions/publicShared';
import type { ProgramCardPublic } from '@/lib/content/landingPublic';
import { WorkshopRegisterModal } from './WorkshopRegisterModal';

const EASE = [0.16, 1, 0.3, 1] as const;

type ProgramsSectionProps = {
  publicSession: PublicSessionDisplay;
  cards: ProgramCardPublic[];
  /** Page-level H1 vs section H2 */
  headingAs?: 'h1' | 'h2';
  className?: string;
};

export function ProgramsSection({
  publicSession,
  cards,
  headingAs = 'h2',
  className = '',
}: ProgramsSectionProps) {
  const reduceMotion = useReducedMotion();
  const HeadingTag = headingAs;
  const [registerOpen, setRegisterOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<ProgramCardPublic | null>(
    null
  );

  return (
    <section
      id="programs"
      className={`programs-section ${className}`.trim()}
      aria-labelledby="programs-heading"
    >
      <div className="container-narrow programs-page-inner">
        <HeadingTag id="programs-heading" className="programs-heading purple-badge">
          Programs
        </HeadingTag>

        <ul className="programs-grid">
          {cards.map((program, index) => {
            const locked = program.status === 'locked';
            const badges = program.badges.map((badge, badgeIndex) =>
              badgeIndex === 0 ? publicSession.durationLabel : badge
            );

            const media = (
              <>
                <div className="program-card-media">
                  <Image
                    src={encodeURI(program.posterUrl)}
                    alt={program.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
                    className="program-card-img object-cover object-[50%_28%]"
                    loading="lazy"
                  />
                  <div className="program-card-media-fade" aria-hidden="true" />
                  <div className="program-card-badges">
                    {locked ? (
                      <span className="program-card-badge program-card-badge-locked">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Locked
                      </span>
                    ) : (
                      <span className="program-card-badge program-card-badge-open">
                        Open
                      </span>
                    )}
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
                      <h3 className="program-card-title">{program.title}</h3>
                      <span className="program-card-price-slot">
                        {program.priceLabel || '\u00a0'}
                      </span>
                    </div>
                    <p className="program-card-instructor">
                      Instructor: {program.instructorLine}
                    </p>
                  </div>
                </div>
              </>
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
                {locked ? (
                  <div
                    className="program-card program-card-locked"
                    aria-disabled="true"
                    aria-label={`${program.title} — locked, coming soon`}
                  >
                    {media}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="program-card program-card-open nav-focus"
                    aria-label={`Register for ${program.title}`}
                    onClick={() => {
                      setActiveProgram(program);
                      setRegisterOpen(true);
                    }}
                  >
                    {media}
                  </button>
                )}
              </motion.li>
            );
          })}
        </ul>
      </div>

      {activeProgram ? (
        <WorkshopRegisterModal
          open={registerOpen}
          onClose={() => {
            setRegisterOpen(false);
            setActiveProgram(null);
          }}
          programId={activeProgram.id}
          programTitle={activeProgram.title}
        />
      ) : null}
    </section>
  );
}
