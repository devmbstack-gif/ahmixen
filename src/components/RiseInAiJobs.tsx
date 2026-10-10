'use client';

import { ArrowRight, Briefcase, TrendingUp, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from './Reveal';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface RiseInAiJobsProps {
  onOpenRegister: () => void;
}

const STATS = [
  {
    id: 'demand',
    value: '3×',
    label: 'Higher demand',
    detail: 'For AI-ready professionals vs traditional roles',
    icon: TrendingUp,
  },
  {
    id: 'roles',
    value: '40%',
    label: 'Roles shifting',
    detail: 'Work is moving toward AI-enabled skills by 2027',
    icon: Briefcase,
  },
  {
    id: 'learners',
    value: '1,250+',
    label: 'Already learning',
    detail: 'Founders, marketers & builders joining AhmiXen cohorts',
    icon: Users,
  },
] as const;

export const RiseInAiJobs: React.FC<RiseInAiJobsProps> = ({ onOpenRegister }) => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="rise-ai-jobs"
      className="section-y-lg relative overflow-hidden bg-transparent"
      aria-labelledby="rise-ai-jobs-heading"
    >
      <div className="relative container-narrow">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
          <p className="inline-flex px-3.5 py-1.5 rounded-full purple-badge type-micro">
            The AI job shift
          </p>
          <h2 id="rise-ai-jobs-heading" className="type-title text-ink">
            Jobs are moving to{' '}
            <span className="gradient-text-ahmixen">AI-ready people</span>
          </h2>
          <p className="type-body">
            Become AI-ready in one focused live session — fundamentals, agents, automation, and
            building with AI.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
          {STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Reveal key={stat.id} delay={index * 0.06}>
                <div className="h-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold text-[var(--text-main)]">{stat.label}</div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {stat.detail}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.12} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button
            type="button"
            onClick={onOpenRegister}
            className="btn-ahmixen py-3.5 px-8 rounded-2xl font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <span>Reserve Your Seat — {WORKSHOP_CONFIG.priceEarlyBird.amount}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <p className="text-xs text-[var(--text-muted)] sm:ml-1">
            {WORKSHOP_CONFIG.dateShort} · {WORKSHOP_CONFIG.time}
          </p>
        </Reveal>
      </div>
    </section>
  );
};
