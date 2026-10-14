'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  CalendarDays,
  CreditCard,
  Ticket,
  Users,
} from 'lucide-react';
import type { AdminSessionDTO } from '@/lib/sessions/serialize';
import { SkeletonDashboard, SkeletonTable, SkeletonRoot } from './skeletons';

type RecentOrder = {
  id: string;
  name: string;
  plan: string;
  amount: string;
  status: string;
  statusLabel: string;
  date: string;
  orderNumber: string;
};

function statusDotClass(status: string) {
  if (status === 'pending_verification') return 'is-low';
  if (status === 'awaiting_payment') return 'is-draft';
  if (status === 'approved') return 'is-open';
  if (status === 'rejected') return 'is-closed';
  return 'is-archived';
}

type AdminDashboardProps = {
  spotlight: AdminSessionDTO | null;
};

export function AdminDashboard({ spotlight }: AdminDashboardProps) {
  const reduceMotion = useReducedMotion();
  const seats = spotlight?.seats;
  const confirmedPct =
    seats && seats.total ? (seats.confirmed / seats.total) * 100 : 0;
  const heldPct = seats && seats.total ? (seats.held / seats.total) * 100 : 0;

  const [pendingPayments, setPendingPayments] = useState<number | null>(null);
  const [newLeadsToday, setNewLeadsToday] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/orders/dashboard');
        if (!res.ok) throw new Error('fail');
        const data = await res.json();
        if (cancelled) return;
        setPendingPayments(data.pendingPayments ?? 0);
        setNewLeadsToday(data.newLeadsToday ?? 0);
        setRecentOrders(data.recentOrders ?? []);
      } catch {
        if (!cancelled) {
          setPendingPayments(0);
          setNewLeadsToday(0);
          setRecentOrders([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statsLoading = pendingPayments == null || newLeadsToday == null;

  const needsReviewOrders = useMemo(() => {
    if (!recentOrders) return null;
    const pending = recentOrders.filter(
      (o) => o.status === 'pending_verification'
    );
    return pending.length ? pending : recentOrders.slice(0, 5);
  }, [recentOrders]);

  const showingOnlyPending =
    recentOrders != null &&
    recentOrders.some((o) => o.status === 'pending_verification');

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="space-y-6"
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          Review payments, check seats, then handle leads.
        </p>
      </div>

      <div className="admin-dash-actions" aria-label="Quick links">
        <Link
          href="/admin/orders"
          className={`admin-dash-action nav-focus${
            (pendingPayments ?? 0) > 0 ? ' is-priority' : ''
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
          Bookings
          {pendingPayments != null && pendingPayments > 0 ? (
            <span className="tabular-nums">({pendingPayments})</span>
          ) : null}
        </Link>
        <Link href="/admin/reservations" className="admin-dash-action nav-focus">
          <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
          Reservations
        </Link>
        <Link href="/admin/sessions" className="admin-dash-action nav-focus">
          <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
          Sessions
        </Link>
        <Link href="/admin/leads" className="admin-dash-action nav-focus">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          Leads
          {newLeadsToday != null && newLeadsToday > 0 ? (
            <span className="tabular-nums">({newLeadsToday})</span>
          ) : null}
        </Link>
      </div>

      {statsLoading && recentOrders == null ? (
        <SkeletonDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <Link
              href="/admin/orders"
              className="admin-card block nav-focus hover:border-[var(--border-highlight)] transition-colors"
            >
              <p className="admin-stat-label">Needs review</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {pendingPayments == null ? '…' : pendingPayments}
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Payments waiting for approve / reject
              </p>
            </Link>

            <article className="admin-card">
              <p className="admin-stat-label">Open session</p>
              {spotlight ? (
                <>
                  <p className="mt-2 font-bold text-[var(--text-main)] leading-snug">
                    {spotlight.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {spotlight.display.combined}
                  </p>
                  {seats ? (
                    <>
                      <p className="mt-3 text-2xl font-extrabold tracking-tight">
                        {seats.available}{' '}
                        <span className="text-sm font-semibold text-[var(--text-muted)]">
                          seats left
                        </span>
                      </p>
                      <div
                        className="mt-2 h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden flex"
                        role="img"
                        aria-label={`Confirmed ${seats.confirmed}, held ${seats.held}, total ${seats.total}`}
                      >
                        <span
                          className="h-full bg-[var(--primary-purple)]"
                          style={{ width: `${confirmedPct}%` }}
                        />
                        <span
                          className="h-full bg-[var(--bright-violet)] opacity-70"
                          style={{ width: `${heldPct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        {seats.confirmed} confirmed · {seats.held} held ·{' '}
                        {seats.total} total
                      </p>
                    </>
                  ) : null}
                  {spotlight.isLandingActive ? (
                    <span className="mt-2 inline-flex admin-badge admin-badge-ok">
                      Landing active
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    No open or landing session yet.
                  </p>
                  <Link
                    href="/admin/sessions/new"
                    className="inline-flex mt-3 text-sm font-semibold text-[var(--primary-purple)] nav-focus"
                  >
                    Create a session
                  </Link>
                </>
              )}
            </article>

            <Link
              href="/admin/leads"
              className="admin-card block nav-focus hover:border-[var(--border-highlight)] transition-colors"
            >
              <p className="admin-stat-label">New leads today</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {newLeadsToday == null ? '…' : newLeadsToday}
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                First seen today
              </p>
            </Link>
          </div>

          <section className="admin-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold">
                  {showingOnlyPending ? 'Needs review' : 'Recent bookings'}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {showingOnlyPending
                    ? 'Approve or reject these first'
                    : 'Latest bookings across checkout and workshops'}
                </p>
              </div>
              <Link
                href="/admin/orders"
                className="text-sm font-semibold text-[var(--primary-purple)] nav-focus shrink-0"
              >
                Open Bookings
              </Link>
            </div>
            {needsReviewOrders == null ? (
              <SkeletonRoot>
                <SkeletonTable rows={4} cols={5} />
              </SkeletonRoot>
            ) : needsReviewOrders.length === 0 ? (
              <div className="py-6 text-center">
                <p className="font-semibold">Nothing to review</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  New bookings will show up here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="admin-table min-w-[32rem] w-full">
                  <thead>
                    <tr>
                      <th scope="col">Booking</th>
                      <th scope="col">Name</th>
                      <th scope="col">Plan</th>
                      <th scope="col">Status</th>
                      <th scope="col">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needsReviewOrders.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link
                            href={`/admin/orders/${row.id}`}
                            className="font-mono text-[13px] font-semibold nav-focus"
                          >
                            {row.orderNumber}
                          </Link>
                        </td>
                        <td>{row.name}</td>
                        <td>{row.plan}</td>
                        <td>
                          <span className="admin-session-status">
                            <span
                              className={`admin-session-status-dot ${statusDotClass(row.status)}`}
                              aria-hidden="true"
                            />
                            <span className="admin-session-status-text">
                              {row.statusLabel}
                            </span>
                          </span>
                        </td>
                        <td>{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}
