'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  Mail,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdminOrderDetailDTO } from '@/lib/orders/serialize';
import { formatMoneyLabel } from '@/lib/plans/money';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { AdminIconAction } from '../AdminIconAction';
import { EmailStatusBadge } from '../EmailStatusBadge';

const REJECT_REASONS = [
  'Payment not received',
  'Amount does not match',
  'Screenshot is unclear',
  'Other',
] as const;

function statusDotClass(status: AdminOrderDetailDTO['status']) {
  if (status === 'pending_verification') return 'is-low';
  if (status === 'awaiting_payment') return 'is-draft';
  if (status === 'approved') return 'is-open';
  if (status === 'rejected') return 'is-closed';
  return 'is-archived';
}

function eventLabel(type: string) {
  if (type === 'created') return 'Booking created';
  if (type === 'proof_uploaded') return 'Payment screenshot uploaded';
  if (type === 'approved') return 'Payment approved';
  if (type === 'rejected') return 'Payment rejected';
  if (type === 'expired') return 'Booking expired';
  if (type === 'cancelled') return 'Booking cancelled';
  if (type === 'note') return 'Admin note updated';
  return type;
}

function formatPkt(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrderDetailClient({ initial }: { initial: AdminOrderDetailDTO }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [order, setOrder] = useState(initial);
  const [note, setNote] = useState(initial.adminNote);
  const [savingNote, setSavingNote] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] =
    useState<(typeof REJECT_REASONS)[number]>('Payment not received');
  const [rejectNote, setRejectNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  const proofUrl = `/api/admin/orders/${order.id}/proof`;
  const canApprove = order.status === 'pending_verification';
  const canReject =
    order.status === 'pending_verification' ||
    order.status === 'awaiting_payment';
  const showActions = canApprove || canReject;
  const canSendConfirmation = order.status === 'approved';
  const confirmationTip =
    order.emailStatus === 'not_sent'
      ? 'Send confirmation email'
      : 'Resend confirmation email';

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const waHref = useMemo(() => {
    const digits = order.phoneDigits;
    if (!digits) return null;
    return `https://wa.me/${digits}`;
  }, [order.phoneDigits]);

  const sendConfirmationEmail = async () => {
    setEmailBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/resend-email`, {
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        emailStatus?: AdminOrderDetailDTO['emailStatus'];
        emailStatusLabel?: string;
        reason?: string;
      };
      if (!res.ok) {
        setToast({
          message: data.error || 'Could not send confirmation email',
          tone: 'error',
        });
        return;
      }
      setOrder((prev) => ({
        ...prev,
        emailStatus: data.emailStatus || prev.emailStatus,
        emailStatusLabel: data.emailStatusLabel || prev.emailStatusLabel,
        emailReason: data.reason || '',
      }));
      setToast({
        message:
          data.emailStatus === 'sent'
            ? 'Confirmation email sent'
            : data.emailStatus === 'skipped'
              ? data.reason || 'Confirmation email skipped'
              : data.emailStatusLabel || 'Confirmation email queued',
        tone: data.emailStatus === 'failed' ? 'error' : 'ok',
      });
      await refresh();
    } catch {
      setToast({ message: 'Could not send confirmation email', tone: 'error' });
    } finally {
      setEmailBusy(false);
    }
  };

  const refresh = async () => {
    const res = await fetch(`/api/admin/orders/${order.id}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.order) {
      setOrder(data.order);
      setNote(data.order.adminNote || '');
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ message: data.error || 'Could not save note', tone: 'error' });
        return;
      }
      setOrder(data.order);
      setToast({ message: 'Note saved' });
    } finally {
      setSavingNote(false);
    }
  };

  const runApprove = async () => {
    setBusy(true);
    setInlineError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/approve`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setToast({ message: 'Already handled', tone: 'error' });
        await refresh();
        return;
      }
      if (!res.ok) {
        const msg = data.error || 'Could not approve payment';
        setToast({ message: msg, tone: 'error' });
        setInlineError(msg);
        return;
      }
      setOrder(data.order);
      setToast({ message: 'Payment approved — seat confirmed' });
      router.refresh();
    } finally {
      setBusy(false);
      setConfirmApprove(false);
    }
  };

  const runReject = async () => {
    if (rejectReason === 'Other' && !rejectNote.trim()) {
      setToast({
        message: 'Add a short note when the reason is Other',
        tone: 'error',
      });
      return;
    }
    setBusy(true);
    setInlineError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason, note: rejectNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setToast({ message: 'Already handled', tone: 'error' });
        await refresh();
        return;
      }
      if (!res.ok) {
        setToast({ message: data.error || 'Could not reject booking', tone: 'error' });
        return;
      }
      setOrder(data.order);
      setToast({ message: 'Booking rejected — seat hold released' });
      router.refresh();
    } finally {
      setBusy(false);
      setRejectOpen(false);
    }
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto w-full max-w-5xl space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold font-mono">{order.orderNumber}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="admin-session-status" aria-label={order.statusLabel}>
              <span
                className={`admin-session-status-dot ${statusDotClass(order.status)}`}
                aria-hidden="true"
              />
              <span className="admin-session-status-text">{order.statusLabel}</span>
            </span>
            {order.seatHoldExpired ? (
              <span className="text-xs text-[var(--text-muted)]">
                Seat hold expired
              </span>
            ) : null}
            {order.isTestData ? (
              <span className="admin-coupon-popup-pill">Test</span>
            ) : null}
          </div>
        </div>
        <Link href="/admin/orders" className="admin-logout-btn nav-focus text-sm h-10">
          Back
        </Link>
      </div>

      {inlineError ? (
        <div
          className="admin-card border border-[var(--border-subtle)] text-sm"
          role="alert"
        >
          <p className="font-semibold text-[var(--text-main)]">Could not approve</p>
          <p className="mt-1 text-[var(--text-secondary)]">{inlineError}</p>
        </div>
      ) : null}

      <div className="admin-card admin-order-detail">
        <div className="admin-order-detail-grid">
          <section className="admin-order-proof min-w-0">
            <h3 className="text-sm font-semibold mb-3">Payment screenshot</h3>
            {order.hasProof ? (
              <div className="space-y-2">
                <button
                  type="button"
                  className="admin-order-proof-frame nav-focus"
                  onClick={() => setZoomOpen(true)}
                  aria-label="Zoom payment screenshot"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofUrl}
                    alt="Payment screenshot"
                    className="admin-order-proof-img"
                  />
                </button>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary-purple)] nav-focus"
                >
                  Open in new tab
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <div className="admin-order-proof-empty">
                <p className="font-medium">No screenshot uploaded yet</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  The customer still needs to send payment proof.
                </p>
              </div>
            )}
          </section>

          <section className="space-y-4 min-w-0">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">Customer</h3>
                <div className="admin-session-actions">
                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-icon-btn admin-session-icon-btn nav-focus"
                      aria-label="Message on WhatsApp"
                      title="Message on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="admin-icon-btn admin-session-icon-btn nav-focus"
                    aria-label="Email customer (opens your mail app)"
                    title="Email customer (opens your mail app)"
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <p className="mt-1 font-medium">{order.customerName}</p>
              <p className="text-sm text-[var(--text-secondary)]">{order.customerEmail}</p>
              <p className="text-sm text-[var(--text-secondary)]">{order.phone || '—'}</p>
              {order.profession ? (
                <p className="text-sm text-[var(--text-muted)]">{order.profession}</p>
              ) : null}
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Source: {order.sourceLabel || 'Direct'}
              </p>
              {order.sourceKind === 'workshop' ? (
                <p className="mt-1">
                  <span className="admin-coupon-popup-pill">Workshop</span>
                </p>
              ) : null}
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                {order.sourceKind === 'workshop'
                  ? 'Program and amounts'
                  : 'Plan and amounts'}
              </h3>
              <p className="mt-1 text-[13px] font-medium">
                {order.programTitle || order.planName}
              </p>
              {order.sourceKind === 'workshop' && order.programId ? (
                <p className="text-xs text-[var(--text-muted)]">
                  Program ID: {order.programId}
                </p>
              ) : null}
              <dl className="mt-2 space-y-1 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--text-muted)]">Base price</dt>
                  <dd>
                    {formatMoneyLabel(order.currency, order.amounts.basePrice)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-base font-bold leading-snug">
                {order.verifyHint}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Session</h3>
              <p className="mt-1 text-[13px]">{order.sessionTitle}</p>
              <p className="text-sm text-[var(--text-muted)]">{order.sessionDateLabel}</p>
              {order.seatsLeft != null ? (
                <p className="mt-1 text-sm font-medium">
                  Seats left: {order.seatsLeft}
                </p>
              ) : null}
            </div>

            {order.sourceKind === 'workshop' && order.workshopMeta ? (
              <div>
                <h3 className="text-sm font-semibold">Workshop details</h3>
                <dl className="mt-2 space-y-1 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-muted)]">City</dt>
                    <dd>{order.workshopMeta.city || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-muted)]">Skill level</dt>
                    <dd className="capitalize">
                      {order.workshopMeta.skillLevel || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Learning goals</dt>
                    <dd className="mt-0.5">
                      {order.workshopMeta.learningGoals?.length
                        ? order.workshopMeta.learningGoals
                            .map((g) => g.replace(/_/g, ' '))
                            .join(', ')
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">Confirmation email</h3>
                {canSendConfirmation ? (
                  <AdminIconAction
                    tip={confirmationTip}
                    ariaLabel={confirmationTip}
                    disabled={emailBusy}
                    onClick={() => void sendConfirmationEmail()}
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </AdminIconAction>
                ) : null}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <EmailStatusBadge
                  status={order.emailStatus}
                  label={order.emailStatusLabel}
                  reason={order.emailReason}
                />
              </div>
              {(order.emailStatus === 'failed' ||
                order.emailStatus === 'skipped') &&
              order.emailReason ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {order.emailReason}
                </p>
              ) : null}
            </div>

            <div className="admin-field">
              <label htmlFor="admin-note" className="admin-field-label">
                Admin note
              </label>
              <textarea
                id="admin-note"
                rows={3}
                className="admin-input"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for other admins"
              />
              <button
                type="button"
                className="admin-logout-btn nav-focus h-10 self-start"
                disabled={savingNote || note === order.adminNote}
                onClick={() => void saveNote()}
              >
                {savingNote ? 'Saving…' : 'Save note'}
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Timeline</h3>
              <ol className="admin-order-timeline">
                {[...order.events]
                  .slice()
                  .reverse()
                  .map((e, i) => (
                    <li key={`${e.type}-${e.at}-${i}`}>
                      <p className="font-medium text-[13px]">{eventLabel(e.type)}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatPkt(e.at)}
                      </p>
                      {e.note ? (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {e.note}
                        </p>
                      ) : null}
                    </li>
                  ))}
              </ol>
            </div>
          </section>
        </div>

        {showActions ? (
          <div className="admin-order-actions">
            {canReject ? (
              <button
                type="button"
                className="admin-order-reject-btn nav-focus"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </button>
            ) : null}
            {canApprove ? (
              <button
                type="button"
                className="btn-ahmixen h-10 min-h-10 px-5 rounded-xl font-semibold disabled:opacity-60"
                disabled={busy}
                onClick={() => setConfirmApprove(true)}
              >
                Approve payment
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {zoomOpen && order.hasProof ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--overlay-scrim)]"
            aria-label="Close zoom"
            onClick={() => setZoomOpen(false)}
          />
          <div className="admin-card relative z-10 w-full max-w-3xl p-3">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="admin-icon-btn nav-focus"
                aria-label="Close"
                onClick={() => setZoomOpen(false)}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proofUrl}
              alt="Payment screenshot zoomed"
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
            />
          </div>
        </div>
      ) : null}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />

      <AdminConfirmDialog
        open={confirmApprove}
        title="Approve this payment?"
        description={`Confirm that ${order.amountLabel} was received from ${order.customerName}. This confirms their seat.`}
        confirmLabel="Approve payment"
        onCancel={() => setConfirmApprove(false)}
        onConfirm={() => void runApprove()}
      />

      {rejectOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--overlay-scrim)]"
            aria-label="Dismiss dialog"
            onClick={() => setRejectOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
            className="admin-card relative z-10 w-full max-w-md space-y-3"
          >
            <h2 id="reject-title" className="text-lg font-bold">
              Reject this booking?
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Their seat hold will be released so someone else can book.
            </p>
            <div className="admin-field">
              <label htmlFor="reject-reason" className="admin-field-label">
                Reason
              </label>
              <select
                id="reject-reason"
                className="admin-input h-10"
                value={rejectReason}
                onChange={(e) =>
                  setRejectReason(e.target.value as (typeof REJECT_REASONS)[number])
                }
              >
                {REJECT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="reject-note" className="admin-field-label">
                Note {rejectReason === 'Other' ? '(required)' : '(optional)'}
              </label>
              <textarea
                id="reject-note"
                rows={3}
                className="admin-input"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                className="admin-logout-btn nav-focus"
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-order-reject-btn nav-focus"
                disabled={busy}
                onClick={() => void runReject()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
