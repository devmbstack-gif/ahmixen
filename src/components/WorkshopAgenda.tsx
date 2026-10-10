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
      className="py-10 sm:py-12 md:py-14 bg-[var(--bg-secondary)]/50 border-y border-[var(--border-subtle)]"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Session <span className="gradient-text-ahmixen">Agenda</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Four modules. Tap a row for a short detail.
          </p>
        </Reveal>

        <div className="space-y-3">
          {WORKSHOP_AGENDA.map((module, index) => {
            const isOpen = openId === module.id;
            return (
              <Reveal key={module.id} delay={index * 0.05}>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : module.id)}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left cursor-pointer hover:bg-[var(--hover-fill)] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs font-mono font-bold text-purple-400 w-8 shrink-0">
                      {module.moduleNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[var(--text-main)]">{module.title}</div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {module.timeRange} · {module.durationMin}
                      </div>
                    </div>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.22 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={
                          reduceMotion ? { opacity: 1, height: 'auto' } : { height: 0, opacity: 0 }
                        }
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)]">
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
