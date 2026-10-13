'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shuffle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdminCouponDTO } from '@/lib/coupons/serialize';
import { generateCouponCode, normalizeCouponCode } from '@/lib/coupons/code';
import { computeTotals } from '@/lib/coupons/pricing';
import {
  digitsOnlyMoney,
  formatMoneyLabel,
  formatWholeMoney,
  parseWholeMoney,
} from '@/lib/plans/money';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';

export type PlanOption = {
  id: string;
  name: string;
  type: 'one_time' | 'installment';
  currency: 'PKR' | 'USD';
  price: number;
  installmentsCount: number | null;
  status: string;
};

type FormState = {
  code: string;
  note: string;
  discountType: 'percent' | 'fixed';
  amountStr: string;
  currency: 'PKR' | 'USD';
  planId: string;
  perEmailStr: string;
  startsAt: string;
  endsAt: string;
  usageLimitStr: string;
  status: 'active' | 'paused';
  isPopupCoupon: boolean;
};

function emptyForm(): FormState {
  return {
    code: '',
    note: '',
    discountType: 'percent',
    amountStr: '10',
    currency: 'PKR',
    planId: '',
    perEmailStr: '1',
    startsAt: '',
    endsAt: '',
    usageLimitStr: '',
    status: 'active',
    isPopupCoupon: false,
  };
}

function fromCoupon(c: AdminCouponDTO): FormState {
  return {
    code: c.code,
    note: c.note,
    discountType: c.discountType,
    amountStr: formatWholeMoney(c.discountValue),
    currency: c.currency === 'USD' ? 'USD' : 'PKR',
    planId: c.planId || '',
    perEmailStr: String(c.perEmailLimit || 1),
    startsAt: c.startsAtLocal || '',
    endsAt: c.endsAtLocal || '',
    usageLimitStr:
      c.usageLimit == null ? '' : formatWholeMoney(c.usageLimit),
    status: c.status === 'archived' ? 'paused' : c.status,
    isPopupCoupon: c.isPopupCoupon,
  };
}

type CouponFormProps = {
  mode: 'create' | 'edit';
  initial?: AdminCouponDTO | null;
  plans: PlanOption[];
  currentPopupCode?: string | null;
  usedCount?: number;
  codeLocked?: boolean;
};

export function CouponForm({
  mode,
  initial,
  plans,
  currentPopupCode = null,
  usedCount = 0,
  codeLocked = false,
}: CouponFormProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const seed = initial ? fromCoupon(initial) : emptyForm();
  const [form, setForm] = useState<FormState>(() => seed);
  const [baseline, setBaseline] = useState(() => JSON.stringify(seed));
  const version = initial?.version ?? 1;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [confirmFree, setConfirmFree] = useState(false);

  const dirty = JSON.stringify(form) !== baseline;
  const activePlans = useMemo(
    () => plans.filter((p) => p.status === 'active'),
    [plans]
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const amountNum = parseWholeMoney(form.amountStr);
  const perEmailNum = parseWholeMoney(form.perEmailStr);
  const usageLimitNum =
    form.usageLimitStr.trim() === '' ? null : parseWholeMoney(form.usageLimitStr);

  const examplePlan = useMemo(() => {
    if (form.planId) {
      return activePlans.find((p) => p.id === form.planId) ?? null;
    }
    if (form.discountType === 'fixed') {
      return (
        activePlans
          .filter((p) => p.type === 'one_time' && p.currency === form.currency)
          .sort((a, b) => a.price - b.price)[0] ?? null
      );
    }
    return [...activePlans].sort((a, b) => a.price - b.price)[0] ?? null;
  }, [activePlans, form.planId, form.discountType, form.currency]);

  const exampleLine = useMemo(() => {
    if (!examplePlan || amountNum == null) return null;
    if (form.discountType === 'fixed' && examplePlan.type === 'installment') {
      return null;
    }
    if (
      form.discountType === 'fixed' &&
      examplePlan.currency !== form.currency
    ) {
      return null;
    }
    const totals = computeTotals(
      {
        id: examplePlan.id,
        type: examplePlan.type,
        currency: examplePlan.currency,
        price: examplePlan.price,
        installmentsCount: examplePlan.installmentsCount,
      },
      {
        id: 'preview',
        code: form.code || 'PREVIEW',
        discountType: form.discountType,
        discountValue: amountNum,
        currency: form.discountType === 'fixed' ? form.currency : '',
        planId: form.planId,
        startsAt: null,
        endsAt: null,
        usageLimit: null,
        perEmailLimit: 1,
        status: 'active',
        usedCount: 0,
        emailUseCount: 0,
      }
    );
    return `Example: ${formatMoneyLabel(totals.currency, totals.basePrice)} plan → customer pays ${formatMoneyLabel(totals.currency, totals.finalPrice)}`;
  }, [examplePlan, amountNum, form]);

  const popupHint =
    form.isPopupCoupon &&
    currentPopupCode &&
    (!initial || !initial.isPopupCoupon) &&
    currentPopupCode !== form.code
      ? `This replaces the current popup coupon (${currentPopupCode})`
      : form.isPopupCoupon &&
          currentPopupCode &&
          initial?.isPopupCoupon &&
          currentPopupCode !== normalizeCouponCode(form.code)
        ? `This replaces the current popup coupon (${currentPopupCode})`
        : null;

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    const code = normalizeCouponCode(form.code);
    if (code.length < 3) next.code = 'Coupon code must be at least 3 characters';
    else if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      next.code = 'Use only letters, numbers, hyphens and underscores';
    }
    if (amountNum == null) next.amountStr = 'Enter an amount';
    else if (form.discountType === 'percent' && (amountNum < 1 || amountNum > 100)) {
      next.amountStr = 'Percent must be between 1 and 100';
    } else if (form.discountType === 'fixed' && amountNum < 1) {
      next.amountStr = 'Amount must be at least 1';
    }
    if (perEmailNum == null || perEmailNum < 1) {
      next.perEmailStr = 'Uses per email must be at least 1';
    }
    if (form.usageLimitStr.trim() !== '') {
      if (usageLimitNum == null || usageLimitNum < 1) {
        next.usageLimitStr = 'Total uses must be at least 1, or leave blank';
      } else if (usageLimitNum < usedCount) {
        next.usageLimitStr = `Total uses cannot be lower than ${usedCount}`;
      }
    }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      next.endsAt = 'End date must be after the start date';
    }
    if (form.discountType === 'fixed' && form.planId) {
      const plan = plans.find((p) => p.id === form.planId);
      if (plan?.type === 'installment') {
        next.planId = 'Fixed amount coupons cannot use an installment plan';
      } else if (plan && plan.currency !== form.currency) {
        next.currency = 'Currency must match the selected plan';
      } else if (plan && amountNum != null && amountNum >= plan.price) {
        next.amountStr = 'Fixed discount must be lower than the plan price';
      }
    }
    if (form.isPopupCoupon && form.status !== 'active') {
      next.isPopupCoupon = 'Only an active coupon can be the popup coupon';
    }
    return next;
  };

  const buildPayload = () => ({
    code: normalizeCouponCode(form.code),
    note: form.note.trim(),
    discountType: form.discountType,
    discountValue: amountNum!,
    currency: form.discountType === 'percent' ? '' : form.currency,
    planId: form.planId,
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    usageLimit: usageLimitNum,
    perEmailLimit: perEmailNum ?? 1,
    status: form.status,
    isPopupCoupon: form.isPopupCoupon,
    ...(mode === 'edit' ? { version } : {}),
  });

  const doSave = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await fetch(
        mode === 'create'
          ? '/api/admin/coupons'
          : `/api/admin/coupons/${initial!.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setToast({
          message: 'This coupon was changed elsewhere, reload',
          tone: 'error',
        });
        return;
      }
      if (!res.ok) {
        setToast({ message: data.error || 'Save failed', tone: 'error' });
        return;
      }

      const message = mode === 'create' ? 'Coupon created' : 'Coupon saved';
      const reset = emptyForm();
      setForm(reset);
      setBaseline(JSON.stringify(reset));
      try {
        sessionStorage.setItem('admin-coupons-toast', message);
      } catch {
        /* ignore */
      }
      router.replace('/admin/coupons');
      router.refresh();
    } finally {
      setSaving(false);
      setConfirmFree(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (form.discountType === 'percent' && amountNum === 100) {
      setConfirmFree(true);
      return;
    }
    await doSave();
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto w-full max-w-4xl"
    >
      <form
        onSubmit={onSubmit}
        className="admin-card admin-session-form admin-coupon-form"
        noValidate
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold leading-none">
            {mode === 'create' ? 'New coupon' : 'Edit coupon'}
          </h2>
          <Link
            href="/admin/coupons"
            className="admin-logout-btn nav-focus text-sm h-10"
          >
            Back
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-4">
          {/* Row 1: code | note */}
          <div className="admin-field sm:col-span-1 lg:col-span-6">
            <label htmlFor="coupon-code" className="admin-field-label">
              Coupon code
            </label>
            <div className="admin-input-with-action">
              <input
                id="coupon-code"
                className="admin-input h-10 admin-coupon-code-input"
                placeholder="EARLYBIRD"
                value={form.code}
                disabled={codeLocked}
                onChange={(e) =>
                  setField('code', e.target.value.toUpperCase())
                }
                onBlur={() => setField('code', normalizeCouponCode(form.code))}
                autoComplete="off"
                spellCheck={false}
              />
              {!codeLocked && (
                <button
                  type="button"
                  className="admin-input-action nav-focus"
                  aria-label="Generate code"
                  title="Generate code"
                  onClick={() => setField('code', generateCouponCode(8))}
                >
                  <Shuffle className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {codeLocked ? (
              <p className="admin-field-hint">
                Code locked after the first redemption
              </p>
            ) : null}
            {errors.code && (
              <p className="text-xs text-red-500" role="alert">
                {errors.code}
              </p>
            )}
          </div>

          <div className="admin-field sm:col-span-1 lg:col-span-6">
            <label htmlFor="coupon-note" className="admin-field-label">
              Internal note
            </label>
            <input
              id="coupon-note"
              className="admin-input h-10"
              placeholder="Optional — only admins see this"
              value={form.note}
              maxLength={120}
              onChange={(e) => setField('note', e.target.value)}
            />
          </div>

          {/* Row 2: type | amount | currency | applies */}
          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <span className="admin-field-label">Discount type</span>
            <div
              className="admin-type-toggle is-compact"
              role="group"
              aria-label="Discount type"
            >
              <button
                type="button"
                className={`admin-type-option nav-focus ${form.discountType === 'percent' ? 'is-active' : ''}`}
                aria-pressed={form.discountType === 'percent'}
                onClick={() => setField('discountType', 'percent')}
              >
                Percent
              </button>
              <button
                type="button"
                className={`admin-type-option nav-focus ${form.discountType === 'fixed' ? 'is-active' : ''}`}
                aria-pressed={form.discountType === 'fixed'}
                onClick={() => setField('discountType', 'fixed')}
              >
                Fixed
              </button>
            </div>
          </div>

          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <label htmlFor="coupon-amount" className="admin-field-label">
              Amount
            </label>
            <div className="admin-input-with-suffix">
              <input
                id="coupon-amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="admin-input admin-input-numeric h-10"
                placeholder={form.discountType === 'percent' ? '25' : '500'}
                value={form.amountStr}
                onChange={(e) =>
                  setField('amountStr', digitsOnlyMoney(e.target.value))
                }
                onBlur={() => {
                  if (amountNum != null) {
                    setField('amountStr', formatWholeMoney(amountNum));
                  }
                }}
              />
              <span className="admin-input-suffix" aria-hidden="true">
                {form.discountType === 'percent' ? '%' : form.currency}
              </span>
            </div>
            {errors.amountStr && (
              <p className="text-xs text-red-500" role="alert">
                {errors.amountStr}
              </p>
            )}
          </div>

          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <label htmlFor="coupon-currency" className="admin-field-label">
              Currency
            </label>
            <select
              id="coupon-currency"
              className="admin-input h-10"
              value={form.discountType === 'percent' ? '' : form.currency}
              disabled={form.discountType === 'percent'}
              onChange={(e) =>
                setField('currency', e.target.value as 'PKR' | 'USD')
              }
            >
              {form.discountType === 'percent' ? (
                <option value="">—</option>
              ) : (
                <>
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                </>
              )}
            </select>
            {errors.currency && (
              <p className="text-xs text-red-500" role="alert">
                {errors.currency}
              </p>
            )}
          </div>

          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <label htmlFor="coupon-plan" className="admin-field-label">
              Applies to
            </label>
            <select
              id="coupon-plan"
              className="admin-input h-10"
              value={form.planId}
              onChange={(e) => setField('planId', e.target.value)}
            >
              <option value="">All plans</option>
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.planId && (
              <p className="text-xs text-red-500" role="alert">
                {errors.planId}
              </p>
            )}
          </div>

          {/* Row 3: per email | total uses | starts | ends */}
          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <label htmlFor="coupon-per-email" className="admin-field-label">
              Uses per email
            </label>
            <input
              id="coupon-per-email"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="admin-input admin-input-numeric h-10"
              placeholder="1"
              value={form.perEmailStr}
              onChange={(e) =>
                setField('perEmailStr', digitsOnlyMoney(e.target.value))
              }
            />
            {errors.perEmailStr && (
              <p className="text-xs text-red-500" role="alert">
                {errors.perEmailStr}
              </p>
            )}
          </div>

          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <label htmlFor="coupon-limit" className="admin-field-label">
              Total uses allowed
            </label>
            <input
              id="coupon-limit"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="admin-input admin-input-numeric h-10"
              placeholder="Unlimited"
              value={form.usageLimitStr}
              onChange={(e) =>
                setField('usageLimitStr', digitsOnlyMoney(e.target.value))
              }
            />
            {errors.usageLimitStr && (
              <p className="text-xs text-red-500" role="alert">
                {errors.usageLimitStr}
              </p>
            )}
          </div>

          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <label htmlFor="coupon-starts" className="admin-field-label">
              Starts on
            </label>
            <input
              id="coupon-starts"
              type="date"
              className="admin-input h-10"
              value={form.startsAt}
              onChange={(e) => setField('startsAt', e.target.value)}
            />
          </div>

          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <label htmlFor="coupon-ends" className="admin-field-label">
              Ends on
            </label>
            <input
              id="coupon-ends"
              type="date"
              className="admin-input h-10"
              value={form.endsAt}
              onChange={(e) => setField('endsAt', e.target.value)}
            />
            {errors.endsAt && (
              <p className="text-xs text-red-500" role="alert">
                {errors.endsAt}
              </p>
            )}
          </div>

          {/* Row 4: status | popup checkbox */}
          <div className="admin-field sm:col-span-1 lg:col-span-3">
            <label htmlFor="coupon-status" className="admin-field-label">
              Status
            </label>
            <select
              id="coupon-status"
              className="admin-input h-10"
              value={form.status}
              onChange={(e) =>
                setField('status', e.target.value as FormState['status'])
              }
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="admin-field sm:col-span-1 lg:col-span-9 lg:self-end">
            <span className="admin-field-label" aria-hidden="true">
              &nbsp;
            </span>
            <label className="admin-check-field nav-focus h-10">
              <input
                type="checkbox"
                checked={form.isPopupCoupon}
                onChange={(e) => setField('isPopupCoupon', e.target.checked)}
              />
              <span>Give this coupon to people who fill the discount popup</span>
            </label>
            {popupHint ? <p className="admin-field-hint">{popupHint}</p> : null}
            {errors.isPopupCoupon && (
              <p className="text-xs text-red-500" role="alert">
                {errors.isPopupCoupon}
              </p>
            )}
          </div>
        </div>

        <div className="admin-form-footer admin-coupon-form-footer">
          <p className="admin-coupon-example">
            {exampleLine || '\u00a0'}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/admin/coupons"
              className="admin-logout-btn nav-focus text-sm h-10 px-4"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-ahmixen h-10 min-h-10 px-5 rounded-xl font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
      <AdminConfirmDialog
        open={confirmFree}
        title="Make this plan free?"
        description="This makes the plan free. Anyone with this code will pay PKR 0 or USD 0 after the discount."
        confirmLabel="Save free coupon"
        onCancel={() => setConfirmFree(false)}
        onConfirm={() => void doSave()}
      />
    </motion.div>
  );
}
