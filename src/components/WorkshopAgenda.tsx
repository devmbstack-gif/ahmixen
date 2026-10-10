'use client';

import React, { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { WORKSHOP_AGENDA } from '../data/workshopData';
import { Reveal } from './Reveal';

export const WorkshopAgenda: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="agenda"
      className="section-y bg-transparent"
      aria-labelledby="agenda-heading"
    >
      <div className="container-tight max-w-3xl">
        <Reveal className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2">
          <h2 id="agenda-heading" className="type-title text-ink">
            Session <span className="gradient-text-ahmixen">Agenda</span>
          </h2>
          <p className="type-body">Four modules. Tap a row for a short detail.</p>
        </Reveal>

        <div className="space-y-3">
          {WORKSHOP_AGENDA.map((module, index) => {
            const isOpen = openId === module.id;
            return (
              <Reveal key={module.id} delay={index * 0.05}>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden">
                  <button
                    type="button"
                    id={`${module.id}-button`}
                    onClick={() => setOpenId(isOpen ? null : module.id)}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left cursor-pointer hover:bg-[var(--hover-fill)] transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`${module.id}-panel`}
                  >
                    <span className="text-xs font-mono font-bold text-brand-soft w-8 shrink-0">
                      {module.moduleNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-ink">{module.title}</div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-1">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {module.timeRange} · {module.durationMin}
                      </div>
                    </div>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.22 }}
                      className="shrink-0"
                      aria-hidden="true"
                    >
                      <ChevronDown className="w-5 h-5 text-ink-muted" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        id={`${module.id}-panel`}
                        role="region"
                        aria-labelledby={`${module.id}-button`}
                        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 type-body border-t border-line">
                          <p className="pt-3 pl-12">{module.summary}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
