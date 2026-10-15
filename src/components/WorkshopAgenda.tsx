'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AGENDA_CATEGORY_DEFAULT,
  AGENDA_INSTRUCTOR_NAME,
  AGENDA_MODULE_IMAGE,
  WORKSHOP_AGENDA,
} from '../data/workshopData';
import type { AgendaContentData } from '@/lib/content/landingSchemas';
import { Reveal } from './Reveal';

const EASE = [0.16, 1, 0.3, 1] as const;

type AgendaItem = AgendaContentData['items'][number] & {
  category?: string;
  image?: string;
};

function resolveItems(content?: AgendaContentData): AgendaItem[] {
  const raw = content?.items?.length ? content.items : WORKSHOP_AGENDA;
  return raw.map((item) => ({
    ...item,
    category:
      ('category' in item && item.category?.trim()) || AGENDA_CATEGORY_DEFAULT,
    // Unified thumbnail for every module card.
    image: AGENDA_MODULE_IMAGE,
  }));
}

export const WorkshopAgenda: React.FC<{ content?: AgendaContentData }> = ({
  content,
}) => {
  const reduceMotion = useReducedMotion();
  const items = resolveItems(content);
  const heading = content?.heading ?? 'Session Agenda';
  const headingParts = heading.split(/\s+/);
  const last = headingParts[headingParts.length - 1] || '';
  const before = headingParts.slice(0, -1).join(' ');

  return (
    <section
      id="agenda"
      className="pt-10 pb-[var(--section-y)] md:pt-12 bg-transparent"
      aria-labelledby="agenda-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <h2 id="agenda-heading" className="type-title text-ink">
            {before ? `${before} ` : ''}
            <span className="gradient-text-ahmixen">{last}</span>
          </h2>
          <p className="type-body mt-3 max-w-xl mx-auto">
            Practical Modules of AI Automation
          </p>
        </Reveal>

        <ul className="agenda-roadmap" aria-label="Workshop curriculum">
          {items.map((module, index) => (
            <li key={module.id}>
              <Reveal delay={index * 0.05}>
                <motion.article
                  className="agenda-roadmap-card"
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { y: -2, transition: { duration: 0.25, ease: EASE } }
                  }
                >
                  <div className="agenda-roadmap-thumb">
                    <Image
                      src={encodeURI(AGENDA_MODULE_IMAGE)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 76px, 96px"
                      className="object-cover object-center"
                      loading="lazy"
                    />
                    <span
                      className="agenda-roadmap-thumb-badge"
                      aria-hidden="true"
                    >
                      {module.moduleNumber ||
                        String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="agenda-roadmap-body">
                    <div className="agenda-roadmap-meta">
                      <span className="agenda-roadmap-cat">
                        {module.category || AGENDA_CATEGORY_DEFAULT}
                      </span>
                      <span className="agenda-roadmap-instructor">
                        {AGENDA_INSTRUCTOR_NAME}
                      </span>
                    </div>
                    <h3 className="agenda-roadmap-title">{module.title}</h3>
                    <p className="agenda-roadmap-desc">{module.summary}</p>
                  </div>
                </motion.article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
