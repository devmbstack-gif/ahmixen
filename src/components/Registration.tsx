'use client';

import { ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from './Reveal';
import { useReserveFlow } from './checkout/ReserveFlowProvider';
import { formatPublicMoney } from '@/lib/checkout-client';

interface RegistrationProps {
  seatsAvailable: number;
  showLimitedSeatsBadge?: boolean;
  durationLabel: string;
}

export const Registration: React.FC<RegistrationProps> = ({
  seatsAvailable,
  showLimitedSeatsBadge = true,
  durationLabel,
}) => {
  const reduceMotion = useReducedMotion();
  const { startReserveFlow, reserveCta, config, configLoading } = useReserveFlow();

  const plans = config?.plans ?? [];
  const plan =
    plans.length > 0
      ? [...plans].sort((a, b) => a.price - b.price)[0]
      : null;

  const buttonLabel =
    reserveCta.label === 'Reserve' ? 'Reserve Seat' : reserveCta.label;
  const showPrice = Boolean(plan) && config?.reservationsOpen;

  return (
    <section
      id="pricing"
      className="section-y bg-transparent"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-lg page-x">
        <Reveal className="text-center mb-6 sm:mb-8 space-y-2">
          <h2 id="pricing-heading" className="type-title text-ink">
            Reserve Your <span className="gradient-text-ahmixen">Seat</span>
          </h2>
          <p className="type-caption">
            Takes about 2 minutes. You pay by bank transfer on the next step.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-purple-500/30 bg-[var(--card-bg)] p-8 text-center space-y-6">
            {showPrice && plan ? (
              <>
                <div className="inline-flex px-3 py-1 rounded-full purple-badge text-xs font-bold">
                  {plan.name}
                </div>

                <div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-extrabold text-[var(--text-main)]">
                      {formatPublicMoney(plan.currency, plan.price)}
                    </span>
                    {plan.originalPrice != null ? (
                      <span className="text-lg text-[var(--text-muted)] line-through">
                        {formatPublicMoney(plan.currency, plan.originalPrice)}
                      </span>
                    ) : null}
                  </div>
                  {plan.savingsPercent != null ? (
                    <p className="text-xs text-purple-400 font-medium mt-1">
                      Save {plan.savingsPercent}%
                    </p>
                  ) : null}
                </div>

                <ul className="text-sm text-[var(--text-secondary)] space-y-2 text-left max-w-xs mx-auto">
                  {plan.features.length > 0 ? (
                    plan.features.map((f) => <li key={f}>• {f}</li>)
                  ) : (
                    <>
                      <li>• Live {durationLabel} session</li>
                      <li>• Recording + materials access</li>
                      <li>• Certificate of completion</li>
                      <li>• Live Q&amp;A with instructor</li>
                    </>
                  )}
                </ul>
              </>
            ) : (
              !configLoading && (
                <p className="text-sm text-[var(--text-secondary)]">
                  Reservations are closed right now.
                </p>
              )
            )}

            <motion.button
              type="button"
              id="pricing-reserve-cta"
              onClick={() => {
                if (!reserveCta.disabled) startReserveFlow();
              }}
              disabled={reserveCta.disabled}
              aria-disabled={reserveCta.disabled}
              className="btn-ahmixen w-full py-3.5 px-6 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              whileHover={
                reduceMotion || reserveCta.disabled
                  ? undefined
                  : { scale: 1.02 }
              }
              whileTap={
                reduceMotion || reserveCta.disabled
                  ? undefined
                  : { scale: 0.98 }
              }
            >
              {buttonLabel}
              {!reserveCta.disabled ? <ArrowRight className="w-5 h-5" /> : null}
            </motion.button>

            {showLimitedSeatsBadge && showPrice ? (
              <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                {seatsAvailable} seats left
              </p>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
