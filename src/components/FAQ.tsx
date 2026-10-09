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
    <section id="faq" className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-12 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
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
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer hover:bg-[var(--hover-fill)] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-[var(--text-main)] text-sm sm:text-base">
                      {faq.question}
                    </span>
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
                        transition={{
                          duration: reduceMotion ? 0.12 : 0.28,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)]">
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
