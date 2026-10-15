'use client';

import { useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useReserveFlow } from './checkout/ReserveFlowProvider';
import { formatPublicMoney } from '@/lib/checkout-client';
import type { PricingContentData } from '@/lib/content/landingSchemas';
import type { PublicSessionDisplay } from '@/lib/sessions/publicShared';

const EASE = [0.16, 1, 0.3, 1] as const;

interface RegistrationProps {
  session: PublicSessionDisplay;
  content: PricingContentData;
}

export const Registration: React.FC<RegistrationProps> = ({
  session,
  content,
}) => {
  const reduceMotion = useReducedMotion();
  const { startMentorshipReserveFlow, mentorshipCta, config, configLoading } =
    useReserveFlow();

  const plan = useMemo(() => {
    if (!config?.plans?.length) return null;
    const mentorshipId = config.mentorshipPlanId || config.landingPlanId;
    if (mentorshipId) {
      return config.plans.find((p) => p.id === mentorshipId) || null;
    }
    return null;
  }, [config]);

  const closedNoPlan = !configLoading && !plan;
  const buttonDisabled = closedNoPlan || mentorshipCta.disabled;
  const buttonLabel = closedNoPlan
    ? 'Reservations closed'
    : mentorshipCta.label === 'Reserve'
      ? 'ENROLL NOW'
      : mentorshipCta.label === 'Reserve Seat'
        ? 'ENROLL NOW'
        : mentorshipCta.label;
  const showPrice = Boolean(plan) && Boolean(config?.reservationsOpen);

  const displayCurrency = plan?.currency || 'PKR';
  const displayPrice = plan?.price ?? 0;
  const originalForStrike =
    plan?.originalPrice != null && plan.originalPrice > plan.price
      ? plan.originalPrice
      : null;

  const sessionLine = `${session.dateShort} · ${session.timeLabel}`;
  const showSeats =
    Boolean(
      config?.session?.showLimitedSeatsBadge ?? session.showLimitedSeatsBadge
    ) &&
    (config?.session?.seatsAvailable ?? session.seatsAvailable) > 0 &&
    showPrice;
  const seatsLeft = config?.session?.seatsAvailable ?? session.seatsAvailable;

  const fade = {
    initial: reduceMotion ? false : ({ opacity: 0, y: 12 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 as const },
    transition: {
      duration: reduceMotion ? 0.01 : 0.45,
      ease: EASE,
    },
  };

  return (
    <section
      id="pricing"
      className="section-y bg-transparent"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-3xl page-x">
        <motion.div className="pricing-header text-center mb-6 space-y-2.5" {...fade}>
          <span className="pricing-badge">{content.badge}</span>
          <h2 id="pricing-heading" className="pricing-title">
            <span className="pricing-title-lead">{content.headingLine1}</span>{' '}
            <span className="gradient-text-ahmixen">{content.headingLine2}</span>
          </h2>
        </motion.div>

        <motion.div
          className="pricing-card"
          {...fade}
          transition={{
            ...fade.transition,
            delay: reduceMotion ? 0 : 0.06,
          }}
        >
          <div className="pricing-card-body">
            {showPrice && plan ? (
              <>
                <div className="pricing-price-block">
                  {originalForStrike != null ? (
                    <p className="pricing-was m-0">
                      The Price was -{' '}
                      {formatPublicMoney(displayCurrency, originalForStrike)}
                    </p>
                  ) : null}
                  <p className="pricing-amount m-0">
                    {formatPublicMoney(displayCurrency, displayPrice)}
                  </p>
                  <p className="pricing-once m-0">One-time payment</p>
                </div>

                {plan.features.length > 0 ? (
                  <ul className="pricing-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Check
                          className="pricing-feature-check"
                          aria-hidden="true"
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="pricing-session-meta">
                  <p className="m-0">{sessionLine}</p>
                  {showSeats ? (
                    <p className="pricing-seats m-0">{seatsLeft} seats left</p>
                  ) : null}
                </div>
              </>
            ) : (
              !configLoading && (
                <p className="pricing-closed m-0">
                  Reservations are closed right now.
                </p>
              )
            )}

            {configLoading && !plan ? (
              <div className="pricing-loading">
                <Loader2
                  className="w-5 h-5 animate-spin text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <span className="sr-only">Loading pricing</span>
              </div>
            ) : null}

            <button
              type="button"
              id="pricing-reserve-cta"
              onClick={() => {
                if (!buttonDisabled) {
                  startMentorshipReserveFlow({
                    forTitle:
                      plan?.name ||
                      [content.headingLine1, content.headingLine2]
                        .filter(Boolean)
                        .join(' ')
                        .trim() ||
                      'Mentorship',
                  });
                }
              }}
              disabled={buttonDisabled}
              aria-disabled={buttonDisabled}
              className="pricing-cta nav-focus"
            >
              {buttonLabel}
            </button>
          </div>
        </motion.div>

        <p className="pricing-helper">
          You pay by JazzCash / Easypaisa on the next step.
        </p>
      </div>
    </section>
  );
};
