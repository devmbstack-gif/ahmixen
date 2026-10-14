'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, Upload, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  WORKSHOP_LEARNING_GOALS,
  WORKSHOP_PAYMENT,
  WORKSHOP_SKILL_LEVELS,
} from '@/data/workshopRegistration';

const EASE = [0.16, 1, 0.3, 1] as const;
const MAX_BYTES = 10 * 1024 * 1024;

type WorkshopRegisterModalProps = {
  open: boolean;
  onClose: () => void;
  programId: string;
  programTitle: string;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  profession: string;
  city: string;
  skillLevel: string;
  learningGoals: string[];
  paidConfirmed: boolean;
};

const emptyForm: FormState = {
  name: '',
  phone: '',
  email: '',
  profession: '',
  city: '',
  skillLevel: '',
  learningGoals: [],
  paidConfirmed: false,
};

export function WorkshopRegisterModal({
  open,
  onClose,
  programId,
  programTitle,
}: WorkshopRegisterModalProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setFile(null);
    setError(null);
    setFieldErrors({});
    setDone(false);
    setSubmitting(false);
  }, [open]);

  // Lock background page scroll while the modal is open (incl. iOS/touch).
  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
    };

    const scrollbarGap = Math.max(0, window.innerWidth - html.clientWidth);

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }
    html.classList.add('workshop-modal-open');

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      body.style.paddingRight = prev.bodyPaddingRight;
      html.classList.remove('workshop-modal-open');
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Keep touch gestures on the page from scrolling the background; allow
  // native finger scroll only inside the modal's scroll wrapper.
  useEffect(() => {
    if (!open) return;

    const isInsideScroll = (target: EventTarget | null) => {
      const el = scrollRef.current;
      if (!el || !(target instanceof Node)) return false;
      return el.contains(target);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isInsideScroll(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const toggleGoal = (id: string) => {
    setForm((prev) => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(id)
        ? prev.learningGoals.filter((g) => g !== id)
        : [...prev.learningGoals, id],
    }));
  };

  const validateClient = (): boolean => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!form.phone.trim()) next.phone = 'Enter your WhatsApp number';
    if (!form.email.trim() || !form.email.includes('@')) {
      next.email = 'Enter a valid email';
    }
    if (form.profession.trim().length < 2) {
      next.profession = 'Enter your education or profession';
    }
    if (form.city.trim().length < 2) next.city = 'Enter your city';
    if (!form.skillLevel) next.skillLevel = 'Choose your AI skill level';
    if (form.learningGoals.length === 0) {
      next.learningGoals = 'Select at least one learning goal';
    }
    if (!form.paidConfirmed) next.paidConfirmed = 'Confirm that you have paid';
    if (!file) next.proof = 'Upload your payment screenshot';
    else if (file.size > MAX_BYTES) {
      next.proof = 'The image is too large. Use a file under 10 MB';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setError(null);
    if (!validateClient() || !file) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      body.set('name', form.name.trim());
      body.set('phone', form.phone.trim());
      body.set('email', form.email.trim());
      body.set('profession', form.profession.trim());
      body.set('city', form.city.trim());
      body.set('skillLevel', form.skillLevel);
      body.set('learningGoals', JSON.stringify(form.learningGoals));
      body.set('paidConfirmed', form.paidConfirmed ? 'true' : 'false');
      body.set('programId', programId);
      body.set('programTitle', programTitle);
      body.set('referrer', typeof document !== 'undefined' ? document.referrer : '');
      body.set('website', '');
      body.set('proof', file);

      const res = await fetch('/api/public/workshop-register', {
        method: 'POST',
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string | { code?: string; message?: string };
        data?: { message?: string };
      };
      if (!res.ok || data.ok === false) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || 'Could not submit registration';
        setError(msg);
        return;
      }
      setDone(true);
    } catch {
      setError('Could not submit registration. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="workshop-modal-root" role="presentation">
      <button
        type="button"
        className="workshop-modal-backdrop"
        aria-label="Close registration form"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="workshop-modal"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
      >
        <div className="workshop-modal-header">
          <div className="min-w-0">
            <p className="workshop-modal-kicker">Workshop registration</p>
            <h2 id={titleId} className="workshop-modal-title">
              {programTitle}
            </h2>
          </div>
          <button
            type="button"
            className="workshop-modal-close nav-focus"
            aria-label="Close"
            disabled={submitting}
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="workshop-modal-scroll"
          data-workshop-scroll=""
        >
        {done ? (
          <div className="workshop-modal-success" role="status">
            <CheckCircle2 className="h-10 w-10 text-[var(--primary-purple)]" />
            <h3>Submission successful</h3>
            <p>
              Thanks — we received your registration and payment screenshot.
              Your seat will be confirmed after we verify payment of{' '}
              {WORKSHOP_PAYMENT.amountLabel}.
            </p>
            <button
              type="button"
              className="btn-ahmixen workshop-modal-submit"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="workshop-modal-body">
            <label className="workshop-field">
              <span>Full Name *</span>
              <input
                className="admin-input"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                autoComplete="name"
                maxLength={80}
                required
              />
              {fieldErrors.name ? (
                <em className="workshop-field-error">{fieldErrors.name}</em>
              ) : null}
            </label>

            <label className="workshop-field">
              <span>WhatsApp Number *</span>
              <input
                className="admin-input"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                autoComplete="tel"
                required
              />
              {fieldErrors.phone ? (
                <em className="workshop-field-error">{fieldErrors.phone}</em>
              ) : null}
            </label>

            <label className="workshop-field">
              <span>Email *</span>
              <input
                className="admin-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                required
              />
              {fieldErrors.email ? (
                <em className="workshop-field-error">{fieldErrors.email}</em>
              ) : null}
            </label>

            <label className="workshop-field">
              <span>Education / Profession *</span>
              <input
                className="admin-input"
                value={form.profession}
                onChange={(e) =>
                  setForm((p) => ({ ...p, profession: e.target.value }))
                }
                autoComplete="organization-title"
                maxLength={80}
                required
              />
              {fieldErrors.profession ? (
                <em className="workshop-field-error">{fieldErrors.profession}</em>
              ) : null}
            </label>

            <label className="workshop-field">
              <span>City *</span>
              <input
                className="admin-input"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                autoComplete="address-level2"
                maxLength={80}
                required
              />
              {fieldErrors.city ? (
                <em className="workshop-field-error">{fieldErrors.city}</em>
              ) : null}
            </label>

            <fieldset className="workshop-field">
              <legend>AI Skill Level *</legend>
              <div className="workshop-radio-row">
                {WORKSHOP_SKILL_LEVELS.map((level) => (
                  <label key={level.id} className="workshop-check">
                    <input
                      type="radio"
                      name="skillLevel"
                      checked={form.skillLevel === level.id}
                      onChange={() =>
                        setForm((p) => ({ ...p, skillLevel: level.id }))
                      }
                    />
                    <span>{level.label}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.skillLevel ? (
                <em className="workshop-field-error">{fieldErrors.skillLevel}</em>
              ) : null}
            </fieldset>

            <fieldset className="workshop-field">
              <legend>What do you want to learn? *</legend>
              <div className="workshop-check-grid">
                {WORKSHOP_LEARNING_GOALS.map((goal) => (
                  <label key={goal.id} className="workshop-check">
                    <input
                      type="checkbox"
                      checked={form.learningGoals.includes(goal.id)}
                      onChange={() => toggleGoal(goal.id)}
                    />
                    <span>{goal.label}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.learningGoals ? (
                <em className="workshop-field-error">
                  {fieldErrors.learningGoals}
                </em>
              ) : null}
            </fieldset>

            <div className="workshop-pay-block">
              <p className="workshop-pay-info">
                I understand that my seat will only be confirmed after payment of{' '}
                <strong>{WORKSHOP_PAYMENT.amountLabel}</strong>.
              </p>
              <div className="workshop-pay-box">
                <p>
                  <span>Account Name</span>
                  <strong>{WORKSHOP_PAYMENT.accountName}</strong>
                </p>
                <p>
                  <span>{WORKSHOP_PAYMENT.walletLabel}</span>
                  <strong>{WORKSHOP_PAYMENT.walletNumber}</strong>
                </p>
              </div>
              <label className="workshop-check workshop-check-paid">
                <input
                  type="checkbox"
                  checked={form.paidConfirmed}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, paidConfirmed: e.target.checked }))
                  }
                />
                <span>Yes Paid</span>
              </label>
              {fieldErrors.paidConfirmed ? (
                <em className="workshop-field-error">
                  {fieldErrors.paidConfirmed}
                </em>
              ) : null}
            </div>

            <div className="workshop-field">
              <span>Payment Screenshot Upload *</span>
              <button
                type="button"
                className="workshop-upload nav-focus"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {file ? file.name : 'Choose image (JPEG, PNG, WebP · max 10 MB)'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const next = e.target.files?.[0] || null;
                  setFile(next);
                }}
              />
              {fieldErrors.proof ? (
                <em className="workshop-field-error">{fieldErrors.proof}</em>
              ) : null}
            </div>

            {error ? (
              <p className="workshop-form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              className="btn-ahmixen workshop-modal-submit"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? 'Submitting…' : 'Submit registration'}
            </button>
          </div>
        )}
        </div>
      </motion.div>
    </div>
  );
}
