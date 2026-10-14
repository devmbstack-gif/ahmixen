'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useReserveFlow } from './checkout/ReserveFlowProvider';
import {
  checkoutFetch,
  clearCheckoutCouponCode,
  clearCouponCheckCache,
  formatPublicMoney,
  readCheckoutPrefill,
  readCouponCheckCache,
  saveCouponCheckCache,
} from '@/lib/checkout-client';
import type { PricingContentData } from '@/lib/content/landingSchemas';
import type { PublicSessionDisplay } from '@/lib/sessions/publicShared';

const EASE = [0.16, 1, 0.3, 1] as const;

interface RegistrationProps {
  session: PublicSessionDisplay;
  content: PricingContentData;
}

type CouponTotals = {
  code: string;
  currency: string;
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
};

export const Registration: React.FC<RegistrationProps> = ({
  session,
  content,
}) => {
  const reduceMotion = useReducedMotion();
  const { startReserveFlow, reserveCta, config, configLoading } =
    useReserveFlow();

  const plan = useMemo(() => {
    if (!config?.plans?.length) return null;
    if (config.landingPlanId) {
      return (
        config.plans.find((p) => p.id === config.landingPlanId) ||
        config.plans[0] ||
        null
      );
    }
    return config.plans[0] || null;
  }, [config]);

  const [coupon, setCoupon] = useState<CouponTotals | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!plan) {
        setCoupon(null);
        return;
      }
      const prefill = readCheckoutPrefill();
      const code = (prefill?.couponCode || '').trim();
      const email = (prefill?.email || '').trim();
      if (!code || !email) {
        setCoupon(null);
        return;
      }

      const cached = readCouponCheckCache(code, plan.id);
      if (cached) {
        if (!cancelled) {
          setCoupon({
            code: cached.code,
            currency: cached.currency,
            basePrice: cached.basePrice,
            discountAmount: cached.discountAmount,
            finalPrice: cached.finalPrice,
          });
        }
        return;
      }

      try {
        const data = await checkoutFetch<{
          currency: string;
          basePrice: number;
          discountAmount: number;
          finalPrice: number;
        }>('/api/public/coupons/check', {
          method: 'POST',
          body: JSON.stringify({ code, planId: plan.id, email }),
        });
        if (cancelled) return;
        saveCouponCheckCache({
          code,
          planId: plan.id,
          currency: data.currency,
          basePrice: data.basePrice,
          discountAmount: data.discountAmount,
          finalPrice: data.finalPrice,
        });
        setCoupon({
          code,
          currency: data.currency,
          basePrice: data.basePrice,
          discountAmount: data.discountAmount,
          finalPrice: data.finalPrice,
        });
      } catch {
        if (!cancelled) setCoupon(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan]);

  const removeCoupon = () => {
    clearCheckoutCouponCode();
    clearCouponCheckCache();
    setCoupon(null);
  };

  const closedNoPlan = !configLoading && !plan;
  const buttonDisabled = closedNoPlan || reserveCta.disabled;
  const buttonLabel = closedNoPlan
    ? 'Reservations closed'
    : reserveCta.label === 'Reserve'
      ? 'ENROLL NOW'
      : reserveCta.label === 'Reserve Seat'
        ? 'ENROLL NOW'
        : reserveCta.label;
  const showPrice = Boolean(plan) && Boolean(config?.reservationsOpen);

  const displayCurrency = coupon?.currency || plan?.currency || 'PKR';
  const displayPrice = coupon ? coupon.finalPrice : plan?.price ?? 0;
  const originalForStrike = coupon
    ? coupon.basePrice
    : plan?.originalPrice != null && plan.originalPrice > plan.price
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
          {coupon ? (
            <div className="pricing-coupon-banner">
              <p className="pricing-coupon-text m-0">
                <span aria-hidden="true">✓ </span>
                Coupon <span className="font-semibold">{coupon.code}</span>{' '}
                applied — discount unlocked
              </p>
              <button
                type="button"
                className="pricing-coupon-remove nav-focus"
                onClick={removeCoupon}
              >
                Remove
              </button>
            </div>
          ) : null}

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
                if (!buttonDisabled) startReserveFlow();
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
