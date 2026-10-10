'use client';

import { ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { WORKSHOP_CONFIG } from '../data/workshopData';
import { Reveal } from './Reveal';

interface RegistrationProps {
  onOpenRegister: () => void;
}

export const Registration: React.FC<RegistrationProps> = ({ onOpenRegister }) => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="pricing"
      className="py-10 sm:py-12 md:py-14 bg-[var(--bg-secondary)]/50 border-y border-[var(--border-subtle)]"
    >
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-6 sm:mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Reserve Your <span className="gradient-text-ahmixen">Seat</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Frontend reservation form — payment integration comes later.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-purple-500/30 bg-[var(--card-bg)] p-8 text-center space-y-6">
            <div className="inline-flex px-3 py-1 rounded-full purple-badge text-xs font-bold">
              {WORKSHOP_CONFIG.priceEarlyBird.label}
            </div>

            <div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-extrabold text-[var(--text-main)]">
                  {WORKSHOP_CONFIG.priceEarlyBird.amount}
                </span>
                <span className="text-lg text-[var(--text-muted)] line-through">
                  {WORKSHOP_CONFIG.priceEarlyBird.original}
                </span>
              </div>
              <p className="text-xs text-purple-400 font-medium mt-1">
                {WORKSHOP_CONFIG.priceEarlyBird.savings}
              </p>
            </div>

            <ul className="text-sm text-[var(--text-secondary)] space-y-2 text-left max-w-xs mx-auto">
              <li>• Live 2.5-hour session</li>
              <li>• Recording + materials access</li>
              <li>• Certificate of completion</li>
              <li>• Live Q&amp;A with instructor</li>
            </ul>

            <motion.button
              type="button"
              id="pricing-reserve-cta"
              onClick={onOpenRegister}
              className="btn-ahmixen w-full py-3.5 px-6 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              Reserve Seat
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              {WORKSHOP_CONFIG.seatsRemaining} seats left · No payment processed yet
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
