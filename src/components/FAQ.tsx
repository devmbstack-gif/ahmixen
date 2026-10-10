'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FAQS } from '../data/workshopData';
import { Reveal } from './Reveal';

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="section-y bg-transparent" aria-labelledby="faq-heading">
      <div className="container-tight max-w-3xl">
        <Reveal className="text-center mb-6 sm:mb-8 space-y-2">
          <h2 id="faq-heading" className="type-title text-ink">
            Frequently Asked <span className="gradient-text-ahmixen">Questions</span>
          </h2>
        </Reveal>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openId === faq.id;
            return (
              <Reveal key={faq.id} delay={index * 0.04}>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden">
                  <button
                    type="button"
                    id={`${faq.id}-button`}
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer hover:bg-[var(--hover-fill)] transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`${faq.id}-panel`}
                  >
                    <span className="font-semibold text-ink text-sm sm:text-base">
                      {faq.question}
                    </span>
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
                        id={`${faq.id}-panel`}
                        role="region"
                        aria-labelledby={`${faq.id}-button`}
                        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{
                          duration: reduceMotion ? 0.12 : 0.28,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 type-body border-t border-line">
                          <p className="pt-3">{faq.answer}</p>
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
