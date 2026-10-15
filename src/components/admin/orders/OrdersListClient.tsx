'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { SearchInput } from '../SearchInput';
import { SkeletonListPage } from '../skeletons';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdminOrderListDTO } from '@/lib/orders/serialize';
import { AdminIconAction } from '../AdminIconAction';
import { AdminToast } from '../AdminToast';

type Counts = {
  needs_review: number;
  awaiting_payment: number;
  approved: number;
  rejected: number;
  expired_cancelled: number;
  all: number;
};

type SessionOption = { id: string; title: string };

function statusDotClass(status: AdminOrderListDTO['status']) {
  if (status === 'pending_verification') return 'is-low';
  if (status === 'awaiting_payment') return 'is-draft';
  if (status === 'approved') return 'is-open';
  if (status === 'rejected') return 'is-closed';
  return 'is-archived';
}

const TABS: Array<{ key: string; label: string; countKey: keyof Counts }> = [
  { key: 'needs_review', label: 'Needs review', countKey: 'needs_review' },
  { key: 'awaiting_payment', label: 'Awaiting payment', countKey: 'awaiting_payment' },
  { key: 'approved', label: 'Approved', countKey: 'approved' },
  { key: 'rejected', label: 'Rejected', countKey: 'rejected' },
  { key: 'all', label: 'All', countKey: 'all' },
  {
    key: 'expired_cancelled',
    label: 'Expired and cancelled',
    countKey: 'expired_cancelled',
  },
];

export function OrdersListClient({ sessions }: { sessions: SessionOption[] }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState('needs_review');
  const [q, setQ] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<AdminOrderListDTO[]>([]);
  const [counts, setCounts] = useState<Counts>({
    needs_review: 0,
    awaiting_payment: 0,
    approved: 0,
    rejected: 0,
    expired_cancelled: 0,
    all: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );

  const load = useCallback(async () => {
    if (hasLoadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', status);
      params.set('page', String(page));
      params.set('limit', '20');
      if (q.trim()) params.set('q', q.trim());
      if (sessionId) params.set('sessionId', sessionId);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setOrders(data.orders ?? []);
      setCounts(data.counts ?? counts);
      setTotalPages(data.totalPages ?? 1);
      hasLoadedOnce.current = true;
    } catch {
      setToast({ message: 'Could not load bookings', tone: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, q, sessionId]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const emptyCopy =
    status === 'needs_review'
      ? 'No payments waiting for review.'
      : status === 'awaiting_payment'
        ? 'No bookings are waiting for a payment screenshot.'
        : status === 'approved'
          ? 'No approved bookings yet.'
          : status === 'rejected'
            ? 'No rejected bookings.'
            : status === 'expired_cancelled'
              ? 'No expired or cancelled bookings.'
              : 'No bookings yet.';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="space-y-4"
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">Bookings & Payments</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          Review payment screenshots and confirm seats.
        </p>
      </div>

      <div
        className="admin-orders-tabs"
        role="tablist"
        aria-label="Booking status"
      >
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`admin-orders-tab nav-focus ${active ? 'is-active' : ''} ${tab.key === 'needs_review' ? 'is-review' : ''}`}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
            >
              <span>{tab.label}</span>
              <span className="admin-orders-tab-count">{counts[tab.countKey]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <SearchInput
          className="flex-1"
          value={q}
          onChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          aria-label="Search bookings"
        />
        <label className="sm:w-56">
          <span className="sr-only">Filter by session</span>
          <select
            className="admin-input"
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <SkeletonListPage showTabs rows={6} cols={6} />}

      {!loading && orders.length === 0 && (
        <div className="admin-card text-center py-10">
          <p className="font-semibold">{emptyCopy}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            New bookings will show up here when customers reserve a seat.
          </p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <section
          className={`admin-card admin-sessions-section p-4${
            refreshing ? ' admin-list-dimmed' : ''
          }`}
        >
          <div className="hidden lg:block">
            <div className="admin-sessions-table-wrap">
              <table className="admin-table admin-sessions-table admin-orders-table">
                <colgroup>
                  <col className="admin-orders-col-order" />
                  <col className="admin-orders-col-customer" />
                  <col className="admin-orders-col-plan" />
                  <col className="admin-orders-col-session" />
                  <col className="admin-orders-col-status" />
                  <col className="admin-orders-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Booking</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Plan and amount</th>
                    <th scope="col">Session</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      className="admin-orders-row"
                      tabIndex={0}
                      onClick={() => router.push(`/admin/orders/${o.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/admin/orders/${o.id}`);
                        }
                      }}
                    >
                      <td>
                        <p className="admin-session-title font-mono text-[13px]">
                          {o.orderNumber}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {o.createdLabel}
                        </p>
                      </td>
                      <td>
                        <p className="admin-session-title" title={o.customerName}>
                          {o.customerName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {o.customerEmail}
                        </p>
                      </td>
                      <td>
                        <p className="text-[13px] font-medium">{o.planName}</p>
                        <p className="text-[13px]">
                          {o.installmentLabel || o.amountLabel}
                        </p>
                        {o.sourceKind === 'workshop' ? (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Workshop · {o.programTitle || o.planName}
                          </p>
                        ) : null}
                      </td>
                      <td>
                        <p className="text-[13px] truncate" title={o.sessionTitle}>
                          {o.sessionTitle}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {o.sessionDateLabel}
                        </p>
                      </td>
                      <td>
                        <span
                          className="admin-session-status"
                          aria-label={o.statusLabel}
                        >
                          <span
                            className={`admin-session-status-dot ${statusDotClass(o.status)}`}
                            aria-hidden="true"
                          />
                          <span className="admin-session-status-text">
                            {o.statusLabel}
                          </span>
                        </span>
                        {o.seatHoldExpired ? (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Seat hold expired
                          </p>
                        ) : null}
                        {o.sourceKind === 'workshop' ? (
                          <span className="admin-coupon-popup-pill">Workshop</span>
                        ) : null}
                        {o.isTestData ? (
                          <span className="admin-coupon-popup-pill">Test</span>
                        ) : null}
                      </td>
                      <td
                        className="admin-sessions-actions-cell"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <div className="admin-session-actions">
                          <AdminIconAction
                            tip="View booking"
                            ariaLabel="View booking"
                            href={`/admin/orders/${o.id}`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </AdminIconAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="lg:hidden space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="admin-card admin-session-card block space-y-2 nav-focus"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-[13px] font-semibold">
                      {o.orderNumber}
                    </span>
                    <span className="admin-session-status">
                      <span
                        className={`admin-session-status-dot ${statusDotClass(o.status)}`}
                        aria-hidden="true"
                      />
                      <span className="admin-session-status-text">
                        {o.statusLabel}
                      </span>
                    </span>
                  </div>
                  <p className="font-medium">{o.customerName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{o.customerEmail}</p>
                  <p className="text-[13px]">
                    {o.planName} · {o.installmentLabel || o.amountLabel}
                  </p>
                  {o.sourceKind === 'workshop' ? (
                    <p className="text-xs text-[var(--text-muted)]">
                      Workshop booking
                    </p>
                  ) : null}
                  <p className="text-xs text-[var(--text-muted)]">
                    {o.sessionTitle} · {o.sessionDateLabel}
                  </p>
                  {o.seatHoldExpired ? (
                    <p className="text-xs text-[var(--text-muted)]">
                      Seat hold expired
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                className="admin-logout-btn nav-focus h-10"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm text-[var(--text-muted)]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="admin-logout-btn nav-focus h-10"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </section>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
    </motion.div>
  );
}
