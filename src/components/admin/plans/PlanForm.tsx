'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdminPlanDTO } from '@/lib/plans/serialize';
import {
  digitsOnlyMoney,
  formatMoneyLabel,
  formatWholeMoney,
  installmentTotal,
  parseWholeMoney,
  savingsPercent,
} from '@/lib/plans/money';
import { AdminToast } from '../AdminToast';

type SessionOption = { id: string; title: string };

type FormState = {
  name: string;
  shortDescription: string;
  type: 'one_time' | 'installment';
  currency: 'PKR' | 'USD';
  priceStr: string;
  originalStr: string;
  installmentsCount: number;
  features: string[];
  sessionId: string;
  validUntil: string;
  status: 'active' | 'hidden';
  sortOrder: number;
};

function emptyFeatures(): string[] {
  return ['', '', '', ''];
}

function emptyForm(): FormState {
  return {
    name: '',
    shortDescription: '',
    type: 'one_time',
    currency: 'PKR',
    priceStr: '',
    originalStr: '',
    installmentsCount: 3,
    features: emptyFeatures(),
    sessionId: '',
    validUntil: '',
    status: 'hidden',
    sortOrder: 0,
  };
}

function fromPlan(p: AdminPlanDTO): FormState {
  const features = [...p.features];
  while (features.length < 4) features.push('');
  return {
    name: p.name,
    shortDescription: p.shortDescription,
    type: p.type,
    currency: p.currency,
    priceStr: formatWholeMoney(p.price),
    originalStr:
      p.originalPrice != null ? formatWholeMoney(p.originalPrice) : '',
    installmentsCount: p.installmentsCount ?? 3,
    features: features.slice(0, 8),
    sessionId: p.sessionId,
    validUntil: p.validUntilLocal,
    status: p.status === 'archived' ? 'hidden' : p.status,
    sortOrder: p.sortOrder,
  };
}

type PlanFormProps = {
  mode: 'create' | 'edit';
  initial?: AdminPlanDTO | null;
  sessions: SessionOption[];
};

export function PlanForm({ mode, initial, sessions }: PlanFormProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const seed = initial ? fromPlan(initial) : emptyForm();
  const [form, setForm] = useState<FormState>(() => seed);
  const [baseline, setBaseline] = useState(() => JSON.stringify(seed));
  const version = initial?.version ?? 1;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );

  const dirty = JSON.stringify(form) !== baseline;
  const priceNum = parseWholeMoney(form.priceStr);
  const originalNum =
    form.originalStr.trim() === '' ? null : parseWholeMoney(form.originalStr);
  const savePct =
    priceNum != null ? savingsPercent(priceNum, originalNum) : null;
  const total =
    form.type === 'installment' && priceNum != null
      ? installmentTotal(priceNum, form.installmentsCount)
      : null;

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

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  const moneySummary = useMemo(() => {
    if (priceNum == null) return null;
    if (form.type === 'installment' && total != null) {
      return `Total: ${formatMoneyLabel(form.currency, total)} in ${form.installmentsCount} payments`;
    }
    if (savePct != null) return `Customers save ${savePct}%`;
    return null;
  }, [form.currency, form.installmentsCount, form.type, priceNum, savePct, total]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Enter a plan name.';
    const price = parseWholeMoney(form.priceStr);
    if (price == null || price < 1) {
      next.priceStr = 'Enter a whole-number price of at least 1.';
    }
    if (form.originalStr.trim()) {
      const orig = parseWholeMoney(form.originalStr);
      if (orig == null) {
        next.originalStr = 'Enter a whole number, or leave blank.';
      } else if (price != null && orig <= price) {
        next.originalStr = 'Original price must be greater than the current price.';
      }
    }
    if (form.type === 'installment') {
      if (form.installmentsCount < 2 || form.installmentsCount > 12) {
        next.installmentsCount = 'Choose between 2 and 12 installments.';
      }
    }
    const feats = form.features.map((f) => f.trim()).filter(Boolean);
    for (const f of feats) {
      if (f.length < 3 || f.length > 80) {
        next.features = 'Each feature must be 3–80 characters.';
        break;
      }
    }
    if (feats.length > 8) next.features = 'You can add up to 8 features.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const price = parseWholeMoney(form.priceStr)!;
    const original =
      form.originalStr.trim() === ''
        ? null
        : parseWholeMoney(form.originalStr);

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        type: form.type,
        currency: form.currency,
        price,
        originalPrice: original,
        installmentsCount:
          form.type === 'installment' ? form.installmentsCount : null,
        features: form.features.map((f) => f.trim()).filter(Boolean).slice(0, 8),
        sessionId: form.sessionId,
        validUntil: form.validUntil || null,
        status: form.status,
        sortOrder: form.sortOrder,
        ...(mode === 'edit' ? { version } : {}),
      };

      const res = await fetch(
        mode === 'create' ? '/api/admin/plans' : `/api/admin/plans/${initial!.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setToast({
          message: 'This plan was changed elsewhere, reload',
          tone: 'error',
        });
        return;
      }
      if (!res.ok) {
        setToast({ message: data.error || 'Save failed', tone: 'error' });
        return;
      }

      const message = mode === 'create' ? 'Plan created' : 'Plan saved';
      const reset = emptyForm();
      setForm(reset);
      setBaseline(JSON.stringify(reset));
      try {
        sessionStorage.setItem('admin-plans-toast', message);
      } catch {
        /* ignore */
      }
      router.replace('/admin/pricing');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (index: number, value: string) => {
    setForm((f) => {
      const features = [...f.features];
      features[index] = value;
      return { ...f, features };
    });
    setErrors((e) => {
      const next = { ...e };
      delete next.features;
      return next;
    });
  };

  const moveFeature = (index: number, dir: -1 | 1) => {
    setForm((f) => {
      const next = index + dir;
      if (next < 0 || next >= f.features.length) return f;
      const features = [...f.features];
      const tmp = features[index];
      features[index] = features[next];
      features[next] = tmp;
      return { ...f, features };
    });
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto w-full max-w-3xl"
    >
      <form onSubmit={onSubmit} className="admin-card admin-session-form space-y-5" noValidate>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">
              {mode === 'create' ? 'New plan' : 'Edit plan'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Set what customers pay and what they get.
            </p>
          </div>
          <Link href="/admin/pricing" className="admin-logout-btn nav-focus text-sm h-10">
            Back
          </Link>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Plan details</h3>
          <div className="admin-field">
            <label htmlFor="plan-name" className="admin-field-label">
              Name
            </label>
            <input
              id="plan-name"
              className="admin-input h-10"
              placeholder="Early Bird"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-red-500" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div className="admin-field">
            <label htmlFor="plan-desc" className="admin-field-label">
              Short description
            </label>
            <input
              id="plan-desc"
              className="admin-input h-10"
              placeholder="Best for first-time learners"
              value={form.shortDescription}
              onChange={(e) => setField('shortDescription', e.target.value)}
            />
          </div>
          <div className="admin-field">
            <span className="admin-field-label">Payment type</span>
            <div className="admin-type-toggle" role="group" aria-label="Payment type">
              <button
                type="button"
                className={`admin-type-option nav-focus ${form.type === 'one_time' ? 'is-active' : ''}`}
                aria-pressed={form.type === 'one_time'}
                onClick={() => setField('type', 'one_time')}
              >
                One-time payment
              </button>
              <button
                type="button"
                className={`admin-type-option nav-focus ${form.type === 'installment' ? 'is-active' : ''}`}
                aria-pressed={form.type === 'installment'}
                onClick={() => setField('type', 'installment')}
              >
                Pay in installments
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Price</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Whole numbers only — no decimals.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="admin-field">
              <label htmlFor="currency" className="admin-field-label">
                Currency
              </label>
              <select
                id="currency"
                className="admin-input h-10"
                value={form.currency}
                onChange={(e) =>
                  setField('currency', e.target.value as FormState['currency'])
                }
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="price" className="admin-field-label">
                {form.type === 'installment' ? 'Each installment' : 'Price'}
              </label>
              <input
                id="price"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="admin-input admin-input-numeric h-10"
                placeholder="2,999"
                value={form.priceStr}
                onChange={(e) =>
                  setField('priceStr', digitsOnlyMoney(e.target.value))
                }
                onBlur={() => {
                  const n = parseWholeMoney(form.priceStr);
                  if (n != null) setField('priceStr', formatWholeMoney(n));
                }}
              />
              {errors.priceStr && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.priceStr}
                </p>
              )}
            </div>
            <div className="admin-field">
              <label htmlFor="original" className="admin-field-label">
                Original price
              </label>
              <input
                id="original"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="admin-input admin-input-numeric h-10"
                placeholder="4,999"
                value={form.originalStr}
                onChange={(e) =>
                  setField('originalStr', digitsOnlyMoney(e.target.value))
                }
                onBlur={() => {
                  if (!form.originalStr.trim()) return;
                  const n = parseWholeMoney(form.originalStr);
                  if (n != null) setField('originalStr', formatWholeMoney(n));
                }}
              />
              <p className="text-xs text-[var(--text-muted)]">
                Optional. Shown crossed out when higher than the price.
              </p>
              {errors.originalStr && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.originalStr}
                </p>
              )}
            </div>
          </div>

          {form.type === 'installment' && (
            <div className="admin-field max-w-xs">
              <label htmlFor="installments" className="admin-field-label">
                Number of installments
              </label>
              <select
                id="installments"
                className="admin-input h-10"
                value={form.installmentsCount}
                onChange={(e) =>
                  setField('installmentsCount', Number(e.target.value))
                }
              >
                {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.installmentsCount && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.installmentsCount}
                </p>
              )}
            </div>
          )}

          {moneySummary && (
            <p className="text-xs text-[var(--text-muted)]">{moneySummary}</p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">What is included</h3>
            <button
              type="button"
              className="admin-logout-btn nav-focus text-sm h-10"
              disabled={form.features.length >= 8}
              onClick={() =>
                setForm((f) =>
                  f.features.length >= 8
                    ? f
                    : { ...f, features: [...f.features, ''] }
                )
              }
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Up to 8 short bullets customers will see.
          </p>
          <ul className="space-y-2">
            {form.features.map((feat, index) => (
              <li key={index} className="flex items-center gap-2">
                <input
                  className="admin-input h-10 flex-1 min-w-0"
                  placeholder="Live Q&A with the instructor"
                  value={feat}
                  onChange={(e) => updateFeature(index, e.target.value)}
                />
                <AdminIconActionLike
                  label="Move up"
                  disabled={index === 0}
                  onClick={() => moveFeature(index, -1)}
                >
                  <ArrowUp className="w-4 h-4" />
                </AdminIconActionLike>
                <AdminIconActionLike
                  label="Move down"
                  disabled={index === form.features.length - 1}
                  onClick={() => moveFeature(index, 1)}
                >
                  <ArrowDown className="w-4 h-4" />
                </AdminIconActionLike>
                <AdminIconActionLike
                  label="Remove feature"
                  danger
                  disabled={form.features.length <= 1}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      features: f.features.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </AdminIconActionLike>
              </li>
            ))}
          </ul>
          {errors.features && (
            <p className="text-xs text-red-500" role="alert">
              {errors.features}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Availability</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="admin-field sm:col-span-1">
              <label htmlFor="session" className="admin-field-label">
                Session
              </label>
              <select
                id="session"
                className="admin-input h-10"
                value={form.sessionId}
                onChange={(e) => setField('sessionId', e.target.value)}
              >
                <option value="">All sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="validUntil" className="admin-field-label">
                Offer ends
              </label>
              <input
                id="validUntil"
                type="date"
                className="admin-input h-10"
                value={form.validUntil}
                onChange={(e) => setField('validUntil', e.target.value)}
              />
              <p className="text-xs text-[var(--text-muted)]">
                Optional. Leave blank for no end date.
              </p>
            </div>
            <div className="admin-field">
              <label htmlFor="status" className="admin-field-label">
                Status
              </label>
              <select
                id="status"
                className="admin-input h-10"
                value={form.status}
                onChange={(e) =>
                  setField('status', e.target.value as FormState['status'])
                }
              >
                <option value="hidden">Hidden</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
        </section>

        <div className="admin-form-footer">
          <Link
            href="/admin/pricing"
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
      </form>

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
    </motion.div>
  );
}

/** Lightweight icon button for feature list (no portal tip needed). */
function AdminIconActionLike({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`admin-icon-btn admin-session-icon-btn nav-focus shrink-0 ${
        danger ? 'is-danger' : ''
      } ${disabled ? 'is-disabled' : ''}`}
    >
      {children}
    </button>
  );
}
