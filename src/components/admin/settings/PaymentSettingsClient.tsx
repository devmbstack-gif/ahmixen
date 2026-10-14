'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { PaymentSettingsDTO } from '@/lib/settings/serialize';
import { AdminToast } from '../AdminToast';

type FormState = {
  bankTransferEnabled: boolean;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  paymentInstructions: string;
  cardPaymentEnabled: boolean;
};

function fromDto(s: PaymentSettingsDTO): FormState {
  return {
    bankTransferEnabled: s.bankTransferEnabled,
    bankName: s.bankName,
    accountTitle: s.accountTitle,
    accountNumber: s.accountNumber,
    iban: s.iban,
    paymentInstructions: s.paymentInstructions,
    cardPaymentEnabled: false,
  };
}

export function PaymentSettingsClient({
  initial,
}: {
  initial: PaymentSettingsDTO;
}) {
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState(() => fromDto(initial));
  const [version, setVersion] = useState(initial.version);
  const [baseline, setBaseline] = useState(() => JSON.stringify(fromDto(initial)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );

  const dirty = JSON.stringify(form) !== baseline;

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
    const t = window.setTimeout(() => setToast(null), 3200);
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

  const validate = () => {
    const next: Record<string, string> = {};
    const iban = form.iban.replace(/\s+/g, '').toUpperCase();
    if (iban && !/^[A-Z0-9]{15,34}$/.test(iban)) {
      next.iban = 'IBAN must be 15–34 letters and digits (no spaces).';
    }
    if (
      form.accountNumber &&
      !/^[0-9-]{6,30}$/.test(form.accountNumber.trim())
    ) {
      next.accountNumber = 'Account number must be 6–30 digits or dashes.';
    }
    if (form.bankTransferEnabled) {
      if (!form.bankName.trim()) next.bankName = 'Enter the bank name.';
      if (!form.accountTitle.trim()) next.accountTitle = 'Enter the account title.';
      if (!form.accountNumber.trim() && !iban) {
        next.accountNumber = 'Enter an account number or IBAN.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          iban: form.iban.replace(/\s+/g, '').toUpperCase(),
          cardPaymentEnabled: false,
          version,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setToast({
          message: 'These settings were changed elsewhere, reload',
          tone: 'error',
        });
        return;
      }
      if (!res.ok) {
        setToast({ message: data.error || 'Save failed', tone: 'error' });
        return;
      }
      const settings = data.settings as PaymentSettingsDTO;
      const next = fromDto(settings);
      setForm(next);
      setBaseline(JSON.stringify(next));
      setVersion(settings.version);
      setToast({ message: 'Payment settings saved' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto w-full max-w-3xl space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          How customers pay for a seat. Start with bank transfer details.
        </p>
      </div>

      <div className="admin-banner" role="note">
        Bank details are saved for later. Customers currently see JazzCash /
        Easypaisa on the pay page (bank UI is hidden for now).
        Double-check the account number.
      </div>

      <form onSubmit={onSubmit} className="admin-card admin-session-form space-y-4" noValidate>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Bank transfer</h3>
          <label className="admin-check-field nav-focus sm:max-w-xs">
            <input
              type="checkbox"
              checked={form.bankTransferEnabled}
              onChange={(e) => setField('bankTransferEnabled', e.target.checked)}
            />
            <span>Enable bank transfer</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <div className="admin-field">
            <label htmlFor="bankName" className="admin-field-label">
              Bank name
            </label>
            <input
              id="bankName"
              className="admin-input h-10"
              placeholder="HBL"
              value={form.bankName}
              onChange={(e) => setField('bankName', e.target.value)}
            />
            <p className="text-xs text-[var(--text-muted)]">
              The bank customers should send money to.
            </p>
            {errors.bankName && (
              <p className="text-xs text-red-500" role="alert">
                {errors.bankName}
              </p>
            )}
          </div>

          <div className="admin-field">
            <label htmlFor="accountTitle" className="admin-field-label">
              Account title
            </label>
            <input
              id="accountTitle"
              className="admin-input h-10"
              placeholder="AhmiXen Workshops"
              value={form.accountTitle}
              onChange={(e) => setField('accountTitle', e.target.value)}
            />
            <p className="text-xs text-[var(--text-muted)]">
              The name on the bank account.
            </p>
            {errors.accountTitle && (
              <p className="text-xs text-red-500" role="alert">
                {errors.accountTitle}
              </p>
            )}
          </div>

          <div className="admin-field">
            <label htmlFor="accountNumber" className="admin-field-label">
              Account number
            </label>
            <input
              id="accountNumber"
              className="admin-input h-10"
              placeholder="0123456789012"
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', e.target.value)}
            />
            <p className="text-xs text-[var(--text-muted)]">
              Digits and dashes only, 6–30 characters.
            </p>
            {errors.accountNumber && (
              <p className="text-xs text-red-500" role="alert">
                {errors.accountNumber}
              </p>
            )}
          </div>

          <div className="admin-field">
            <label htmlFor="iban" className="admin-field-label">
              IBAN
            </label>
            <input
              id="iban"
              className="admin-input h-10"
              placeholder="PK36HABB0000001234567890"
              value={form.iban}
              onChange={(e) => setField('iban', e.target.value.toUpperCase())}
              onBlur={() =>
                setField('iban', form.iban.replace(/\s+/g, '').toUpperCase())
              }
            />
            <p className="text-xs text-[var(--text-muted)]">
              Letters and digits only, 15–34 characters. Spaces are removed.
            </p>
            {errors.iban && (
              <p className="text-xs text-red-500" role="alert">
                {errors.iban}
              </p>
            )}
          </div>

          <div className="admin-field sm:col-span-2">
            <label htmlFor="instructions" className="admin-field-label">
              Payment instructions
            </label>
            <textarea
              id="instructions"
              rows={3}
              className="admin-input"
              placeholder="Transfer the fee and upload your receipt on the next step."
              value={form.paymentInstructions}
              onChange={(e) => setField('paymentInstructions', e.target.value)}
            />
            <p className="text-xs text-[var(--text-muted)]">
              Optional short note shown on the payment step.
            </p>
          </div>
        </div>

        <div className="admin-field opacity-70">
          <span className="admin-field-label">Card payment</span>
          <label className="admin-check-field is-disabled" aria-disabled="true">
            <input type="checkbox" checked={false} disabled readOnly />
            <span>Accept card payments</span>
          </label>
          <p className="text-xs text-[var(--text-muted)]">Coming later</p>
        </div>

        <div className="admin-form-footer">
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
