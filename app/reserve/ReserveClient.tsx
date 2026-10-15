'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  WORKSHOP_LEARNING_GOALS,
  WORKSHOP_SKILL_LEVELS,
} from '@/data/workshopRegistration';

export function ReserveClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<PublicCheckoutConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [city, setCity] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [website, setWebsite] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const intentParam = (searchParams.get('intent') || '').toLowerCase();
  const planParam = (searchParams.get('plan') || '').trim();
  const programParam = (searchParams.get('program') || '').trim();
  const forTitleParam = (searchParams.get('for') || '').trim();

  const isWorkshopIntent =
    intentParam === 'workshop' || Boolean(programParam);
  const isMentorshipIntent = intentParam === 'mentorship';

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
          if (prefill.profession) setProfession(prefill.profession);
        }

        const hasPlan = (id: string | null | undefined) =>
          Boolean(id && data.plans.some((p) => p.id === id));

        let preferred: string | undefined;
        if (planParam && hasPlan(planParam)) {
          preferred = planParam;
        } else if (intentParam === 'workshop') {
          if (hasPlan(data.workshopPlanId)) preferred = data.workshopPlanId!;
        } else if (intentParam === 'mentorship') {
          const mentorshipId = data.mentorshipPlanId || data.landingPlanId;
          if (hasPlan(mentorshipId)) preferred = mentorshipId!;
        } else if (hasPlan(data.workshopPlanId)) {
          preferred = data.workshopPlanId!;
        } else if (hasPlan(data.mentorshipPlanId || data.landingPlanId)) {
          preferred = (data.mentorshipPlanId || data.landingPlanId)!;
        } else {
          preferred = data.plans[0]?.id;
        }
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
  }, [intentParam, planParam]);

  const selectedPlan = useMemo(
    () => config?.plans.find((p) => p.id === planId) || null,
    [config, planId]
  );

  const visiblePlans = useMemo(() => {
    if (!config?.plans?.length) return [];
    // Lock to the intended plan so applicants see the correct price only.
    if (planId && config.plans.some((p) => p.id === planId)) {
      return config.plans.filter((p) => p.id === planId);
    }
    if (isMentorshipIntent) {
      const mid = config.mentorshipPlanId || config.landingPlanId;
      const mentorship = mid
        ? config.plans.filter((p) => p.id === mid)
        : [];
      return mentorship.length ? mentorship : config.plans;
    }
    if (isWorkshopIntent) {
      const workshop = config.workshopPlanId
        ? config.plans.filter((p) => p.id === config.workshopPlanId)
        : [];
      return workshop.length ? workshop : config.plans;
    }
    return config.plans;
  }, [config, planId, isMentorshipIntent, isWorkshopIntent]);

  const applyingFor =
    forTitleParam ||
    selectedPlan?.name ||
    (isMentorshipIntent ? 'Mentorship' : isWorkshopIntent ? 'Live Workshop' : '');

  const toggleGoal = (id: string) => {
    setLearningGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

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
    if (isWorkshopIntent) {
      if (profession.trim().length < 2) {
        next.profession = 'Enter your education or profession';
      }
      if (city.trim().length < 2) next.city = 'Enter your city';
      if (!skillLevel) next.skillLevel = 'Choose your AI skill level';
      if (learningGoals.length < 1) {
        next.learningGoals = 'Select at least one learning goal';
      }
    }
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
          profession: isWorkshopIntent ? profession.trim() : '',
          sourceKind: isWorkshopIntent ? 'workshop' : 'checkout',
          programId: isWorkshopIntent ? programParam : '',
          programTitle: isWorkshopIntent ? applyingFor : '',
          city: isWorkshopIntent ? city.trim() : '',
          skillLevel: isWorkshopIntent ? skillLevel : '',
          learningGoals: isWorkshopIntent ? learningGoals : [],
          utm,
          website,
        }),
      });
      router.push(`/pay/${data.publicToken}`);
    } catch (err) {
      if (err instanceof CheckoutApiError) {
        if (err.code === 'sold_out') {
          setAlert('Sorry, all seats are taken.');
        } else if (
          err.code === 'already_submitted' ||
          err.code === 'already_confirmed'
        ) {
          setAlert(
            err.message ||
              'You already submitted your form. Admin will shortly review your payment details and send you a seat confirmation email.'
          );
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

  const currency = selectedPlan?.currency || 'PKR';
  const total = selectedPlan?.price ?? 0;
  const holdMinutes = config.holdMinutes || 30;

  return (
    <PublicCheckoutShell>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
            Reserve your seat
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
            Takes about 2 minutes. You pay by JazzCash / Easypaisa on the next
            step.
          </p>
          {applyingFor ? (
            <p
              className="mt-4 rounded-xl border border-purple-500/35 bg-purple-500/10 px-4 py-3 text-sm text-[var(--text-main)]"
              role="status"
            >
              Applying for:{' '}
              <span className="font-semibold text-purple-300">{applyingFor}</span>
            </p>
          ) : null}
        </header>

        <form
          onSubmit={submit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
          noValidate
        >
          <div className="space-y-6 max-w-2xl lg:max-w-none">
            <section
              className="checkout-card space-y-3"
              aria-labelledby="details-heading"
            >
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
                style={{ clip: 'rect(0, 0, 0, 0)' }}
              />
              <Field
                label="Full name"
                id="res-name"
                error={fieldErrors.name}
                required
              >
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
              <Field
                label="Email address"
                id="res-email"
                error={fieldErrors.email}
                required
              >
                <input
                  id="res-email"
                  type="email"
                  className="checkout-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? 'res-email-err' : undefined
                  }
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

              {isWorkshopIntent ? (
                <>
                  <Field
                    label="Education / Profession"
                    id="res-profession"
                    error={fieldErrors.profession}
                    required
                  >
                    <input
                      id="res-profession"
                      className="checkout-input"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      autoComplete="organization-title"
                      maxLength={80}
                      aria-invalid={Boolean(fieldErrors.profession)}
                    />
                  </Field>
                  <Field
                    label="City"
                    id="res-city"
                    error={fieldErrors.city}
                    required
                  >
                    <input
                      id="res-city"
                      className="checkout-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      autoComplete="address-level2"
                      maxLength={80}
                      aria-invalid={Boolean(fieldErrors.city)}
                    />
                  </Field>

                  <fieldset>
                    <legend className="block text-sm font-medium mb-2">
                      AI Skill Level <span className="text-purple-400">*</span>
                    </legend>
                    <div className="flex flex-wrap gap-3">
                      {WORKSHOP_SKILL_LEVELS.map((level) => (
                        <label
                          key={level.id}
                          className="inline-flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="skillLevel"
                            checked={skillLevel === level.id}
                            onChange={() => setSkillLevel(level.id)}
                          />
                          <span>{level.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.skillLevel ? (
                      <p
                        role="alert"
                        className="mt-1 text-xs text-red-500"
                      >
                        {fieldErrors.skillLevel}
                      </p>
                    ) : null}
                  </fieldset>

                  <fieldset>
                    <legend className="block text-sm font-medium mb-2">
                      What do you want to learn?{' '}
                      <span className="text-purple-400">*</span>
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {WORKSHOP_LEARNING_GOALS.map((goal) => (
                        <label
                          key={goal.id}
                          className="inline-flex items-start gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={learningGoals.includes(goal.id)}
                            onChange={() => toggleGoal(goal.id)}
                          />
                          <span>{goal.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.learningGoals ? (
                      <p
                        role="alert"
                        className="mt-1 text-xs text-red-500"
                      >
                        {fieldErrors.learningGoals}
                      </p>
                    ) : null}
                  </fieldset>
                </>
              ) : null}
            </section>

            <section
              className="checkout-card space-y-3"
              aria-labelledby="plan-heading"
            >
              <h2 id="plan-heading" className="text-base font-semibold">
                Your plan
              </h2>
              {visiblePlans.length === 1 && selectedPlan ? (
                <div className="rounded-xl border border-purple-500/50 p-4 text-left">
                  <p className="font-semibold">{selectedPlan.name}</p>
                  <p className="mt-1 text-[var(--text-main)]">
                    {formatPublicMoney(
                      selectedPlan.currency,
                      selectedPlan.price
                    )}
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
                <div
                  className="space-y-2"
                  role="radiogroup"
                  aria-labelledby="plan-heading"
                >
                  {visiblePlans.map((p) => {
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
                            onChange={() => setPlanId(p.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p>
                              {formatPublicMoney(p.currency, p.price)}
                              {p.originalPrice != null ? (
                                <span className="ml-2 text-sm text-[var(--text-muted)] line-through">
                                  {formatPublicMoney(
                                    p.currency,
                                    p.originalPrice
                                  )}
                                </span>
                              ) : null}
                            </p>
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
              {fieldErrors.planId ? (
                <p role="alert" className="text-xs text-red-500">
                  {fieldErrors.planId}
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
                applyingFor={applyingFor}
                planName={selectedPlan?.name || ''}
                currency={currency}
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
              applyingFor={applyingFor}
              planName={selectedPlan?.name || ''}
              currency={currency}
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
      <Link
        href="/"
        className="btn-ahmixen inline-flex min-h-10 px-5 py-2.5 rounded-xl font-semibold"
      >
        Back to home
      </Link>
    </div>
  );
}

function SummaryCard({
  applyingFor,
  planName,
  currency,
  total,
  sessionLine,
  seatsLeft,
  holdMinutes,
  submitting,
}: {
  applyingFor: string;
  planName: string;
  currency: string;
  total: number;
  sessionLine: string;
  seatsLeft: number | null;
  holdMinutes: number;
  submitting: boolean;
}) {
  return (
    <div className="checkout-card space-y-3">
      <h2 className="text-base font-semibold">Booking summary</h2>
      {applyingFor ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Applying for:{' '}
          <span className="font-medium text-[var(--text-main)]">
            {applyingFor}
          </span>
        </p>
      ) : null}
      <p className="text-sm text-[var(--text-secondary)]">{planName}</p>
      <dl className="space-y-2 text-sm">
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
