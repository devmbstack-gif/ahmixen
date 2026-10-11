'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CheckoutApiError,
  checkoutFetch,
  getAttribution,
  PHONE_HINT,
  saveCheckoutPrefill,
  setPopupDone,
} from '@/lib/checkout-client';

type Props = {
  open: boolean;
  label: string;
  onClose: () => void;
  onDone: () => void;
};

type FieldErrors = Partial<
  Record<'name' | 'email' | 'phone' | 'profession' | 'message', string>
>;

export function DiscountPopup({ open, label, onClose, onDone }: Props) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const errId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    profession: '',
    message: '',
    website: '',
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('input:not([type="hidden"]),button')
        ?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusable).filter(
        (el) => el.getAttribute('aria-hidden') !== 'true'
      );
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const validate = (blurField?: keyof FieldErrors): FieldErrors => {
    const next: FieldErrors = { ...errors };
    const check = (field: keyof FieldErrors, message: string | undefined) => {
      if (!blurField || blurField === field) {
        if (message) next[field] = message;
        else delete next[field];
      }
    };
    check(
      'name',
      form.name.trim().length < 2
        ? 'Enter your full name'
        : form.name.length > 80
          ? 'Name is too long'
          : /[<>]/.test(form.name)
            ? 'Name cannot include HTML tags'
            : undefined
    );
    check(
      'email',
      !form.email.trim()
        ? 'Enter a valid email address'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
          ? 'Enter a valid email address'
          : undefined
    );
    check(
      'phone',
      !form.phone.trim()
        ? 'Enter your WhatsApp number with country code, for example +92 300 1234567'
        : undefined
    );
    if (form.message.length > 200) {
      check('message', 'Message is too long');
    } else if (!blurField || blurField === 'message') {
      delete next.message;
    }
    setErrors(next);
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const next = validate();
    if (Object.keys(next).length) return;
    setSending(true);
    setFormError('');
    try {
      const { utm, referrer } = getAttribution();
      const data = await checkoutFetch<{
        popupCoupon: { code: string; label: string } | null;
      }>('/api/public/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          profession: form.profession.trim(),
          message: form.message.trim(),
          website: form.website,
          utm,
          referrer,
        }),
      });
      saveCheckoutPrefill({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        profession: form.profession.trim(),
        couponCode: data.popupCoupon?.code || '',
      });
      setPopupDone();
      onDone();
    } catch (err) {
      if (err instanceof CheckoutApiError) {
        setFormError(err.message);
      } else {
        setFormError('Something went wrong');
      }
    } finally {
      setSending(false);
    }
  };

  const noThanks = () => {
    setPopupDone();
    onDone();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay-soft)] backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 shadow-none"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id={titleId} className="text-xl font-bold text-[var(--text-main)]">
              Unlock {label}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Share your details and your coupon will be applied automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            style={{ clip: 'rect(0,0,0,0)' }}
          />

          <Field
            id="popup-name"
            label="Full name"
            error={errors.name}
            required
          >
            <input
              id="popup-name"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onBlur={() => validate('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'popup-name-err' : undefined}
              className="checkout-input"
            />
          </Field>

          <Field
            id="popup-phone"
            label="WhatsApp number"
            hint={PHONE_HINT}
            error={errors.phone}
            required
          >
            <input
              id="popup-phone"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              onBlur={() => validate('phone')}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? 'popup-phone-err' : 'popup-phone-hint'
              }
              className="checkout-input"
            />
          </Field>

          <Field
            id="popup-email"
            label="Email address"
            error={errors.email}
            required
          >
            <input
              id="popup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={() => validate('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'popup-email-err' : undefined}
              className="checkout-input"
            />
          </Field>

          <Field id="popup-profession" label="Profession" error={errors.profession}>
            <input
              id="popup-profession"
              name="profession"
              autoComplete="organization-title"
              value={form.profession}
              onChange={(e) =>
                setForm((f) => ({ ...f, profession: e.target.value }))
              }
              className="checkout-input"
            />
          </Field>

          <Field
            id="popup-message"
            label="Anything you'd like us to know?"
            error={errors.message}
          >
            <textarea
              id="popup-message"
              name="message"
              rows={3}
              maxLength={200}
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              onBlur={() => validate('message')}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'popup-message-err' : undefined}
              className="checkout-input min-h-[5rem] resize-y"
            />
          </Field>

          {formError ? (
            <p id={errId} role="alert" aria-live="polite" className="text-sm text-red-500">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="btn-ahmixen w-full min-h-10 py-3 rounded-xl font-semibold disabled:opacity-60"
          >
            {sending ? 'Applying…' : 'Apply my coupon'}
          </button>
          <button
            type="button"
            onClick={noThanks}
            disabled={sending}
            className="w-full min-h-10 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
          >
            No thanks, continue without discount
          </button>
        </form>
      </motion.div>
    </div>,
    document.body
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
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--text-main)] mb-1"
      >
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
