'use client';

import { useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useReserveFlow } from './checkout/ReserveFlowProvider';
import {
  formatPublicMoney,
  type PublicCheckoutConfig,
} from '@/lib/checkout-client';
import type { PricingContentData } from '@/lib/content/landingSchemas';
import type { PublicSessionDisplay } from '@/lib/sessions/publicShared';

const EASE = [0.16, 1, 0.3, 1] as const;

type OfferPlan = PublicCheckoutConfig['plans'][number];

interface RegistrationProps {
  session: PublicSessionDisplay;
  content: PricingContentData;
}

function orderOfferPlans(
  plans: OfferPlan[],
  workshopPlanId: string | null | undefined,
  mentorshipPlanId: string | null | undefined
): OfferPlan[] {
  const byId = new Map(plans.map((p) => [p.id, p]));
  const ordered: OfferPlan[] = [];
  const push = (id: string | null | undefined) => {
    if (!id) return;
    const p = byId.get(id);
    if (p && !ordered.some((o) => o.id === p.id)) ordered.push(p);
  };
  push(workshopPlanId);
  push(mentorshipPlanId);
  const rest = plans
    .filter((p) => !ordered.some((o) => o.id === p.id))
    .slice()
    .sort((a, b) => a.price - b.price);
  return [...ordered, ...rest];
}

export const Registration: React.FC<RegistrationProps> = ({
  session,
  content,
}) => {
  const reduceMotion = useReducedMotion();
  const { startPlanReserveFlow, config, configLoading, workshopCta, mentorshipCta } =
    useReserveFlow();

  const mentorshipId = config?.mentorshipPlanId || config?.landingPlanId || null;

  const offerPlans = useMemo(() => {
    if (!config?.plans?.length) return [];
    return orderOfferPlans(
      config.plans,
      config.workshopPlanId,
      mentorshipId
    );
  }, [config, mentorshipId]);

  const closedNoPlans = !configLoading && offerPlans.length === 0;
  const globalBlocked =
    !configLoading &&
    Boolean(config && (!config.reservationsOpen || config.session?.soldOut));

  const workshopWhenLine = useMemo(() => {
    const long = session.dateLong?.trim() || '';
    const weekday = long.split(',')[0]?.trim();
    // "Sat, Oct 24, 2026 · 10:00 PM PKT"
    const shortWeekday = weekday ? weekday.slice(0, 3) : 'Sat';
    if (session.dateShort && session.timeLabel) {
      return `${shortWeekday}, ${session.dateShort} · ${session.timeLabel}`;
    }
    return 'Sat, Oct 24, 2026 · 10:00 PM PKT';
  }, [session.dateLong, session.dateShort, session.timeLabel]);

  const workshopSeatsVisible =
    Boolean(
      config?.session?.showLimitedSeatsBadge ?? session.showLimitedSeatsBadge
    ) &&
    (config?.session?.seatsAvailable ?? session.seatsAvailable) > 0 &&
    Boolean(config?.reservationsOpen);
  const seatsLeft = config?.session?.seatsAvailable ?? session.seatsAvailable;

  const planSchedule = (
    plan: OfferPlan,
    isWorkshop: boolean,
    isMentorship: boolean
  ) => {
    if (isWorkshop) {
      return { dateLine: workshopWhenLine, showSeats: workshopSeatsVisible };
    }
    if (isMentorship) {
      return { dateLine: 'Starts Nov 1, 2026', showSeats: false };
    }
    if (/generalist|accelerator/i.test(plan.name)) {
      return { dateLine: 'Starts Nov 15, 2026', showSeats: false };
    }
    return { dateLine: workshopWhenLine, showSeats: false };
  };

  const fade = {
    initial: reduceMotion ? false : ({ opacity: 0, y: 12 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 as const },
    transition: {
      duration: reduceMotion ? 0.01 : 0.45,
      ease: EASE,
    },
  };

  const enrollLabel = (plan: OfferPlan) => {
    const isMentorship = mentorshipId != null && plan.id === mentorshipId;
    const cta = isMentorship ? mentorshipCta : workshopCta;
    if (cta.disabled) return cta.label;
    if (cta.label === 'Reserve' || cta.label === 'Reserve Seat') {
      return 'ENROLL NOW';
    }
    return cta.label;
  };

  return (
    <section
      id="pricing"
      className="section-y bg-transparent"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-6xl page-x">
        <motion.div className="pricing-header text-center mb-6 space-y-2.5" {...fade}>
          <span className="pricing-badge">{content.badge}</span>
          <h2 id="pricing-heading" className="pricing-title">
            <span className="pricing-title-lead">{content.headingLine1}</span>{' '}
            <span className="gradient-text-ahmixen">{content.headingLine2}</span>
          </h2>
          {content.subtext ? (
            <p className="pricing-subtext m-0">{content.subtext}</p>
          ) : null}
        </motion.div>

        {configLoading && offerPlans.length === 0 ? (
          <div className="pricing-loading">
            <Loader2
              className="w-5 h-5 animate-spin text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <span className="sr-only">Loading pricing</span>
          </div>
        ) : null}

        {closedNoPlans ? (
          <p className="pricing-closed m-0">
            Reservations are closed right now.
          </p>
        ) : (
          <ul className="pricing-grid">
            {offerPlans.map((plan, index) => {
              const isMentorship =
                mentorshipId != null && plan.id === mentorshipId;
              const isWorkshop =
                Boolean(config?.workshopPlanId) &&
                plan.id === config?.workshopPlanId;
              const schedule = planSchedule(plan, isWorkshop, isMentorship);
              const originalForStrike =
                plan.originalPrice != null && plan.originalPrice > plan.price
                  ? plan.originalPrice
                  : null;
              const disabled = globalBlocked;
              const label = closedNoPlans
                ? 'Reservations closed'
                : enrollLabel(plan);

              return (
                <motion.li
                  key={plan.id}
                  className={
                    isMentorship
                      ? 'pricing-grid-item pricing-grid-item-featured'
                      : 'pricing-grid-item'
                  }
                  {...fade}
                  transition={{
                    ...fade.transition,
                    delay: reduceMotion ? 0 : 0.05 + index * 0.05,
                  }}
                >
                  <article className="pricing-card h-full">
                    <div className="pricing-card-body">
                      <div className="pricing-plan-name-block">
                        <p className="pricing-plan-name m-0">{plan.name}</p>
                        {plan.shortDescription ? (
                          <p className="pricing-plan-desc m-0">
                            {plan.shortDescription}
                          </p>
                        ) : null}
                      </div>

                      <div className="pricing-price-block">
                        {originalForStrike != null ? (
                          <p className="pricing-was m-0">
                            The Price was -{' '}
                            {formatPublicMoney(plan.currency, originalForStrike)}
                          </p>
                        ) : null}
                        <p className="pricing-amount m-0">
                          {formatPublicMoney(plan.currency, plan.price)}
                        </p>
                        <p className="pricing-once m-0">One-time payment</p>
                      </div>

                      {plan.features.length > 0 ? (
                        <ul className="pricing-features pricing-features-stack">
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
                        <p className="m-0">{schedule.dateLine}</p>
                        {schedule.showSeats ? (
                          <p className="pricing-seats m-0">
                            {seatsLeft} seats left
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        id={
                          isMentorship
                            ? 'pricing-reserve-cta'
                            : `pricing-enroll-${plan.id}`
                        }
                        onClick={() => {
                          if (!disabled) {
                            startPlanReserveFlow(plan.id, {
                              forTitle: plan.name,
                            });
                          }
                        }}
                        disabled={disabled}
                        aria-disabled={disabled}
                        className="pricing-cta nav-focus"
                      >
                        {label}
                      </button>
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </ul>
        )}

        <p className="pricing-helper">
          You pay by JazzCash / Easypaisa on the next step.
        </p>
      </div>
    </section>
  );
};
