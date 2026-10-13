'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
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
          Overview of sessions, seats, and recent bookings.
        </p>
      </div>

      {statsLoading && recentOrders == null ? (
        <SkeletonDashboard />
      ) : (
        <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <article className="admin-card">
          <p className="admin-stat-label">Upcoming session</p>
          {spotlight ? (
            <>
              <p className="mt-2 font-bold text-[var(--text-main)] leading-snug">
                {spotlight.title}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {spotlight.display.combined}
              </p>
              {spotlight.isLandingActive && (
                <span className="mt-2 inline-flex admin-badge admin-badge-ok">
                  Landing active
                </span>
              )}
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

        <article className="admin-card">
          <p className="admin-stat-label">Seats left</p>
          {seats ? (
            <>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {seats.available}
              </p>
              <div
                className="mt-3 h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden flex"
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
                {seats.confirmed} confirmed · {seats.held} held · {seats.total} total
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">No session data</p>
          )}
        </article>

        <Link
          href="/admin/orders"
          className="admin-card block nav-focus hover:border-[var(--border-highlight)] transition-colors"
        >
          <p className="admin-stat-label">Pending payments</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">
            {pendingPayments == null ? '…' : pendingPayments}
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Needs review — open Bookings
          </p>
        </Link>

        <Link
          href="/admin/leads"
          className="admin-card block nav-focus hover:border-[var(--border-highlight)] transition-colors"
        >
          <p className="admin-stat-label">New leads today</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">
            {newLeadsToday == null ? '…' : newLeadsToday}
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            First seen today — open Leads
          </p>
        </Link>
      </div>

      <section className="admin-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-bold">Recent bookings</h2>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-[var(--primary-purple)] nav-focus"
            >
              View all
            </Link>
          </div>
          {recentOrders == null ? (
            <SkeletonRoot>
              <SkeletonTable rows={5} cols={6} />
            </SkeletonRoot>
          ) : recentOrders.length === 0 ? (
            <div className="py-6 text-center">
              <p className="font-semibold">No bookings yet</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                New reservations will show up here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="admin-table min-w-[36rem] w-full">
                <thead>
                  <tr>
                    <th scope="col">Booking</th>
                    <th scope="col">Name</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((row) => (
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
                      <td>{row.amount}</td>
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
