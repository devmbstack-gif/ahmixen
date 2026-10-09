'use client';

import { ArrowRight, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AI_JOB_HEADLINES,
  AI_JOB_LOSS_STATS,
  WORKSHOP_CONFIG,
  type AiJobHeadline,
  type JobLossStat,
} from '../data/workshopData';
import { Reveal } from './Reveal';
import { TouchLayerStack } from './TouchLayerStack';

interface AiJobImpactProps {
  onOpenRegister: () => void;
}

const NEWS_HEADER: Record<string, string> = {
  forbes: 'bg-[#F3E0D0] text-[#1a1a1a]',
  bi: 'bg-[#D7E8F5] text-[#1a1a1a]',
  cnbc: 'bg-[#D8EFE3] text-[#1a1a1a]',
};

const fadeUp = {
  initial: { opacity: 0, y: 14, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
};

export const AiJobImpact: React.FC<AiJobImpactProps> = ({ onOpenRegister }) => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="why-ai"
      className="relative py-16 md:py-20 overflow-hidden border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40"
    >
      <div className="job-impact-glow absolute inset-0 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 md:space-y-16">
        <div>
          <Reveal className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full purple-badge text-xs font-semibold">
              <TrendingDown className="w-3.5 h-3.5" />
              Market signal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Total Job Losses Predicted by Top Firms{' '}
              <span className="gradient-text-ahmixen">Because of AI</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">
              Tap each layer to explore the research — then get AI-ready.
            </p>
          </Reveal>

          <TouchLayerStack<JobLossStat>
            items={AI_JOB_LOSS_STATS}
            getKey={(item) => item.id}
            stackClassName="loss-stack"
            hint="Tap a firm layer · tap front for next"
            renderCard={(stat, isFront) => (
              <div className="h-full flex flex-col relative">
                <div className="flex items-center gap-3 px-4 sm:px-5 pt-3.5 pb-2 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/25 to-fuchsia-500/15 border border-purple-500/30 flex items-center justify-center text-[10px] font-extrabold text-purple-300 ${
                      isFront && !reduceMotion ? 'layer-icon-alive' : ''
                    }`}
                  >
                    {stat.orgShort}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-main)] truncate">
                      {stat.org}
                    </p>
                    {!isFront && (
                      <p className="text-xs text-fuchsia-400 font-semibold">{stat.figure}</p>
                    )}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isFront && (
                    <motion.div
                      key={`loss-body-${stat.id}`}
                      initial={reduceMotion ? false : fadeUp.initial}
                      animate={fadeUp.animate}
                      exit={reduceMotion ? undefined : fadeUp.exit}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="px-4 sm:px-5 pb-5 pt-1 flex-1 flex flex-col justify-center text-center"
                    >
                      <motion.p
                        className={`text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 via-violet-400 to-purple-500 ${
                          reduceMotion ? '' : 'layer-figure-alive'
                        }`}
                        initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.05 }}
                      >
                        {stat.figure}
                      </motion.p>
                      <motion.p
                        className="mt-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)]"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.28 }}
                      >
                        {stat.label}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          />
        </div>

        <div>
          <Reveal className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full purple-badge text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              The other side
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Rise in <span className="gradient-text-ahmixen">AI-Related Jobs</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">
              Swipe through the headlines — opportunity follows AI-enabled people.
            </p>
          </Reveal>

          <TouchLayerStack<AiJobHeadline>
            items={AI_JOB_HEADLINES}
            getKey={(item) => item.id}
            stackClassName="news-stack"
            hint="Tap a headline layer · tap front for next"
            renderCard={(item, isFront) => (
              <div className="h-full flex flex-col bg-[var(--card-bg)]">
                <div
                  className={`shrink-0 flex items-center gap-2 px-4 sm:px-5 py-3 ${
                    NEWS_HEADER[item.id] ?? 'bg-purple-100 text-[#1a1a1a]'
                  }`}
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 text-purple-600 shrink-0 ${
                      isFront && !reduceMotion ? 'layer-spark-alive' : ''
                    }`}
                  />
                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider truncate">
                    {item.source}
                  </span>
                </div>

                <div className="px-4 sm:px-5 py-3 sm:py-4 flex-1 min-h-0">
                  <motion.h3
                    layout
                    className={`font-bold text-[var(--text-main)] leading-snug ${
                      isFront ? 'text-base sm:text-lg' : 'text-sm line-clamp-1'
                    }`}
                  >
                    {item.title}
                  </motion.h3>

                  <AnimatePresence mode="wait">
                    {isFront && (
                      <motion.p
                        key={`news-blurb-${item.id}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
                        className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed"
                      >
                        {item.blurb}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          />
        </div>

        <Reveal delay={0.1}>
          <motion.div
            className="job-cta-band relative rounded-2xl border border-purple-500/30 bg-[var(--card-bg)] px-5 py-6 sm:px-8 sm:py-7 text-center overflow-hidden"
            whileInView={reduceMotion ? undefined : { scale: [0.98, 1] }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.18),transparent_70%)]" />
            <p className="relative text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Jobs are moving toward{' '}
              <span className="font-semibold text-[var(--text-main)]">AI-enabled people</span>.
              Join our {WORKSHOP_CONFIG.durationLabel.toLowerCase()} live workshop and become
              AI-ready today.
            </p>
            <motion.button
              type="button"
              onClick={onOpenRegister}
              className="btn-ahmixen relative mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold cursor-pointer"
              whileHover={reduceMotion ? undefined : { scale: 1.03, x: 2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            >
              Reserve My Seat
              <motion.span
                animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </motion.button>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
};
