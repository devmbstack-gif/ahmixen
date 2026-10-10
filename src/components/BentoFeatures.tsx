'use client';

import {
  Award,
  Bot,
  Code2,
  Cpu,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { BENTO_FEATURES } from '../data/workshopData';
import { Reveal } from './Reveal';

const ICONS: Record<string, LucideIcon> = {
  Cpu,
  Bot,
  Sparkles,
  Code2,
  MessageCircle,
  Award,
};

const spanClass: Record<string, string> = {
  lg: 'bento-span-lg',
  md: 'bento-span-md',
  sm: 'bento-span-sm',
  wide: 'bento-span-wide',
};

export const BentoFeatures: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="benefits"
      className="relative section-y overflow-hidden bg-transparent"
      aria-labelledby="bento-heading"
    >
      <div className="container-page">
        <Reveal className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-2">
          <p className="inline-flex px-3.5 py-1.5 rounded-full purple-badge type-micro">
            What you&apos;ll learn
          </p>
          <h2 id="bento-heading" className="type-title text-ink">
            Skills that stick —{' '}
            <span className="gradient-text-ahmixen">in one live session</span>
          </h2>
          <p className="type-body">
            Four core tracks plus live Q&A and a completion certificate.
          </p>
        </Reveal>

        <div className="bento-grid">
          {BENTO_FEATURES.map((feature, index) => {
            const Icon = ICONS[feature.iconName] ?? Sparkles;
            return (
              <Reveal key={feature.id} delay={index * 0.05} className={spanClass[feature.span]}>
                <motion.article
                  className="bento-card group h-full"
                  whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent ?? 'from-purple-500/15 to-transparent'} opacity-80`}
                    aria-hidden="true"
                  />
                  <div className="relative z-[1] flex h-full flex-col gap-3 p-5 sm:p-6">
                    <div className="bento-icon">
                      <Icon className="w-5 h-5" strokeWidth={2.25} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-main)]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                      {feature.description}
                    </p>
                  </div>
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
