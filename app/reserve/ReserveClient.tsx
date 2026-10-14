'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { PublicCheckoutShell } from '@/components/checkout/PublicCheckoutShell';
import {
  CheckoutApiError,
  checkoutFetch,
  formatPublicMoney,
  formatSessionPktLine,
  getAttribution,
  PHONE_HINT,
  readCheckoutPrefill,
  type PublicCheckoutConfig,
} from '@/lib/checkout-client';

type CouponPreview = {
  code: string;
  discountAmount: number;
  finalPrice: number;
  currency: string;
  basePrice: number;
};

export function ReserveClient() {
  const router = useRouter();
  const [config, setConfig] = useState<PublicCheckoutConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoCouponTried, setAutoCouponTried] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await checkoutFetch<PublicCheckoutConfig>(
          '/api/public/checkout'
        );
        if (cancelled) return;
        setConfig(data);
        const prefill = readCheckoutPrefill();
        if (prefill) {
          setName(prefill.name);
          setEmail(prefill.email);
          setPhone(prefill.phone);
          if (prefill.couponCode) setCouponInput(prefill.couponCode);
        }
        const preferred =
          (data.landingPlanId &&
            data.plans.find((p) => p.id === data.landingPlanId)?.id) ||
          data.plans[0]?.id;
        if (preferred) setPlanId(preferred);
      } catch (err) {
        if (!cancelled) {
          setAlert(
            err instanceof CheckoutApiError
              ? err.message
              : 'Something went wrong'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPlan = useMemo(
    () => config?.plans.find((p) => p.id === planId) || null,
    [config, planId]
  );

  const applyCoupon = async (code: string, silent = false) => {
    if (!selectedPlan || !email.trim() || !code.trim()) return;
    setCouponBusy(true);
    if (!silent) setCouponError('');
    try {
      const data = await checkoutFetch<{
        currency: string;
        basePrice: number;
        discountAmount: number;
        finalPrice: number;
      }>('/api/public/coupons/check', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim(),
          planId: selectedPlan.id,
          email: email.trim(),
        }),
      });
      setCoupon({
        code: code.trim().toUpperCase(),
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
        currency: data.currency,
        basePrice: data.basePrice,
      });
      setCouponInput(code.trim().toUpperCase());
      setCouponError('');
    } catch (err) {
      setCoupon(null);
      if (!silent) {
        setCouponError(
          err instanceof CheckoutApiError
            ? err.message
            : 'This coupon code is not valid'
        );
      }
    } finally {
      setCouponBusy(false);
    }
  };

  useEffect(() => {
    if (!config || autoCouponTried || !selectedPlan) return;
    const code = couponInput.trim();
    if (!code || !email.trim()) {
      setAutoCouponTried(true);
      return;
    }
    setAutoCouponTried(true);
    void applyCoupon(code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, selectedPlan, email, autoCouponTried]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!phone.trim()) {
      next.phone =
        'Enter your WhatsApp number with country code, for example +92 300 1234567';
    }
    if (!planId) next.planId = 'Choose a plan';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAlert('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { utm } = getAttribution();
      const data = await checkoutFetch<{
        publicToken: string;
        alreadyExisted?: boolean;
      }>('/api/public/orders', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          profession: '',
          couponCode: coupon?.code || '',
          utm,
          website,
        }),
      });
      router.push(`/pay/${data.publicToken}`);
    } catch (err) {
      if (err instanceof CheckoutApiError) {
        if (err.code === 'sold_out') {
          setAlert('Sorry, all seats are taken.');
        } else {
          setAlert(err.message);
        }
      } else {
        setAlert('Something went wrong');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicCheckoutShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="checkout-skeleton h-8 w-2/3" />
          <div className="checkout-skeleton h-4 w-full" />
          <div className="checkout-card space-y-3">
            <div className="checkout-skeleton h-10" />
            <div className="checkout-skeleton h-10" />
            <div className="checkout-skeleton h-10" />
          </div>
        </div>
      </PublicCheckoutShell>
    );
  }

  if (!config?.reservationsOpen) {
    return (
      <PublicCheckoutShell>
        <ClosedState message="Reservations are closed right now." />
      </PublicCheckoutShell>
    );
  }

  if (config.session?.soldOut) {
    return (
      <PublicCheckoutShell>
        <ClosedState message="Sorry, all seats are taken." />
      </PublicCheckoutShell>
    );
  }

  const currency = coupon?.currency || selectedPlan?.currency || 'PKR';
  const price = selectedPlan?.price ?? 0;
  const total = coupon ? coupon.finalPrice : price;
  const holdMinutes = config.holdMinutes || 30;

  return (
    <PublicCheckoutShell>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
            Reserve your seat
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
            Takes about 2 minutes. You pay by JazzCash / Easypaisa on the next step.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
          noValidate
        >
          <div className="space-y-6 max-w-2xl lg:max-w-none">
            <section className="checkout-card space-y-3" aria-labelledby="details-heading">
              <h2 id="details-heading" className="text-base font-semibold">
                Your details
              </h2>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
                style={{ clip: 'rect(0,0,0,0)' }}
              />
              <Field label="Full name" id="res-name" error={fieldErrors.name} required>
                <input
                  id="res-name"
                  className="checkout-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'res-name-err' : undefined}
                />
              </Field>
              <Field label="Email address" id="res-email" error={fieldErrors.email} required>
                <input
                  id="res-email"
                  type="email"
                  className="checkout-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'res-email-err' : undefined}
                />
              </Field>
              <Field
                label="WhatsApp number"
                id="res-phone"
                hint={PHONE_HINT}
                error={fieldErrors.phone}
                required
              >
                <input
                  id="res-phone"
                  className="checkout-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={
                    fieldErrors.phone ? 'res-phone-err' : 'res-phone-hint'
                  }
                />
              </Field>
            </section>

            <section className="checkout-card space-y-3" aria-labelledby="plan-heading">
              <h2 id="plan-heading" className="text-base font-semibold">
                Your plan
              </h2>
              {config.plans.length === 1 && selectedPlan ? (
                <div className="rounded-xl border border-[var(--border-subtle)] p-4 text-left">
                  <p className="font-semibold">{selectedPlan.name}</p>
                  <p className="mt-1 text-[var(--text-main)]">
                    {formatPublicMoney(selectedPlan.currency, selectedPlan.price)}
                    {selectedPlan.originalPrice != null ? (
                      <span className="ml-2 text-sm text-[var(--text-muted)] line-through">
                        {formatPublicMoney(
                          selectedPlan.currency,
                          selectedPlan.originalPrice
                        )}
                      </span>
                    ) : null}
                  </p>
                  {selectedPlan.savingsPercent != null ? (
                    <p className="text-sm text-purple-400 mt-1">
                      Save {selectedPlan.savingsPercent}%
                    </p>
                  ) : null}
                  {selectedPlan.features.length > 0 ? (
                    <ul className="mt-2 text-sm text-[var(--text-secondary)] space-y-1">
                      {selectedPlan.features.map((f) => (
                        <li key={f}>• {f}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2" role="radiogroup" aria-labelledby="plan-heading">
                  {config.plans.map((p) => {
                    const selected = p.id === planId;
                    return (
                      <label
                        key={p.id}
                        className={`block rounded-xl border p-4 cursor-pointer min-h-10 ${
                          selected
                            ? 'border-purple-500'
                            : 'border-[var(--border-subtle)]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="planId"
                            value={p.id}
                            checked={selected}
                            onChange={() => {
                              setPlanId(p.id);
                              setCoupon(null);
                            }}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p>
                              {formatPublicMoney(p.currency, p.price)}
                              {p.originalPrice != null ? (
                                <span className="ml-2 text-sm text-[var(--text-muted)] line-through">
                                  {formatPublicMoney(p.currency, p.originalPrice)}
                                </span>
                              ) : null}
                            </p>
                            {p.savingsPercent != null ? (
                              <p className="text-sm text-purple-400">
                                Save {p.savingsPercent}%
                              </p>
                            ) : null}
                            {p.features.length > 0 ? (
                              <ul className="mt-2 text-sm text-[var(--text-secondary)] space-y-1">
                                {p.features.map((f) => (
                                  <li key={f}>• {f}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="checkout-card space-y-3" aria-labelledby="coupon-heading">
              <h2 id="coupon-heading" className="text-base font-semibold">
                Coupon
              </h2>
              {coupon ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p>
                    Coupon {coupon.code} applied. You save{' '}
                    {formatPublicMoney(coupon.currency, coupon.discountAmount)}
                  </p>
                  <button
                    type="button"
                    className="text-sm font-medium text-purple-400 underline-offset-2 hover:underline min-h-10 px-2"
                    onClick={() => {
                      setCoupon(null);
                      setCouponInput('');
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="res-coupon"
                    className="checkout-input"
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    aria-invalid={Boolean(couponError)}
                    aria-describedby={couponError ? 'res-coupon-err' : undefined}
                  />
                  <button
                    type="button"
                    disabled={couponBusy || !couponInput.trim()}
                    onClick={() => void applyCoupon(couponInput)}
                    className="btn-ahmixen min-h-10 px-4 rounded-xl font-semibold disabled:opacity-60"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError ? (
                <p
                  id="res-coupon-err"
                  role="alert"
                  aria-live="polite"
                  className="text-sm text-red-500"
                >
                  {couponError}
                </p>
              ) : null}
            </section>

            {alert ? (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500"
              >
                {alert}
              </p>
            ) : null}

            <div className="lg:hidden">
              <SummaryCard
                planName={selectedPlan?.name || ''}
                currency={currency}
                price={price}
                discount={coupon?.discountAmount ?? 0}
                total={total}
                sessionLine={
                  config.session
                    ? formatSessionPktLine(
                        config.session.startsAt,
                        config.session.timezone
                      )
                    : ''
                }
                seatsLeft={
                  config.session?.showLimitedSeatsBadge
                    ? config.session.seatsAvailable
                    : null
                }
                holdMinutes={holdMinutes}
                submitting={submitting}
              />
            </div>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-24">
            <SummaryCard
              planName={selectedPlan?.name || ''}
              currency={currency}
              price={price}
              discount={coupon?.discountAmount ?? 0}
              total={total}
              sessionLine={
                config.session
                  ? formatSessionPktLine(
                      config.session.startsAt,
                      config.session.timezone
                    )
                  : ''
              }
              seatsLeft={
                config.session?.showLimitedSeatsBadge
                  ? config.session.seatsAvailable
                  : null
              }
              holdMinutes={holdMinutes}
              submitting={submitting}
            />
          </aside>
        </form>
      </div>
    </PublicCheckoutShell>
  );
}

function ClosedState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md text-center checkout-card space-y-4">
      <p className="text-base text-[var(--text-main)]">{message}</p>
      <Link href="/" className="btn-ahmixen inline-flex min-h-10 px-5 py-2.5 rounded-xl font-semibold">
        Back to home
      </Link>
    </div>
  );
}

function SummaryCard({
  planName,
  currency,
  price,
  discount,
  total,
  sessionLine,
  seatsLeft,
  holdMinutes,
  submitting,
}: {
  planName: string;
  currency: string;
  price: number;
  discount: number;
  total: number;
  sessionLine: string;
  seatsLeft: number | null;
  holdMinutes: number;
  submitting: boolean;
}) {
  return (
    <div className="checkout-card space-y-3">
      <h2 className="text-base font-semibold">Booking summary</h2>
      <p className="text-sm text-[var(--text-secondary)]">{planName}</p>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-muted)]">Price</dt>
          <dd>{formatPublicMoney(currency, price)}</dd>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--text-muted)]">Coupon discount</dt>
            <dd>-{formatPublicMoney(currency, discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <dt className="font-semibold">Total payable</dt>
          <dd className="text-lg font-bold">
            {formatPublicMoney(currency, total)}
          </dd>
        </div>
      </dl>
      {sessionLine ? (
        <p className="text-sm text-[var(--text-secondary)]">{sessionLine}</p>
      ) : null}
      {seatsLeft != null ? (
        <p className="text-xs text-[var(--text-muted)]">{seatsLeft} seats left</p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="btn-ahmixen w-full min-h-10 py-3 rounded-xl font-semibold disabled:opacity-60"
      >
        {submitting ? 'Continuing…' : 'Continue to payment'}
      </button>
      <p className="text-xs text-[var(--text-muted)]">
        Your seat is held for {holdMinutes} minutes after you continue.
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
        {required ? <span className="text-purple-400"> *</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-err`}
          role="alert"
          aria-live="polite"
          className="mt-1 text-xs text-red-500"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
