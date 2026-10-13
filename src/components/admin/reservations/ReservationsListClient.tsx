'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, Eye, MessageCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { SearchInput } from '../SearchInput';
import { SkeletonListPage } from '../skeletons';
import { AdminIconAction } from '../AdminIconAction';
import { AdminToast } from '../AdminToast';
import type { AdminReservationDTO } from '@/lib/reservations/serialize';

type SessionOption = {
  id: string;
  title: string;
  startsAt: string | null;
  dateLabel: string;
  isLandingActive: boolean;
};

type Summary = {
  total: number;
  confirmed: number;
  held: number;
  available: number;
};

type Collected = {
  currency: string;
  total: number;
  label: string;
};

export function ReservationsListClient() {
  const reduceMotion = useReducedMotion();
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminReservationDTO[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    confirmed: 0,
    held: 0,
    available: 0,
  });
  const [collected, setCollected] = useState<Collected[]>([]);
  const [allEmails, setAllEmails] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (hasLoadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (sessionId) params.set('sessionId', sessionId);
      if (q.trim()) params.set('q', q.trim().slice(0, 80));
      const res = await fetch(`/api/admin/reservations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setSessionId(data.sessionId || '');
      setRows(data.reservations ?? []);
      setSummary(data.summary ?? summary);
      setCollected(data.collected ?? []);
      setAllEmails(data.allEmails ?? '');
      setTotalPages(data.totalPages ?? 1);
      hasLoadedOnce.current = true;
    } catch {
      setToast({
        message: 'Could not load reservations — refresh and try again',
        tone: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, page, q]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function exportCsv() {
    if (!sessionId) {
      setToast({ message: 'Choose a session first', tone: 'error' });
      return;
    }
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('sessionId', sessionId);
      if (q.trim()) params.set('q', q.trim().slice(0, 80));
      const res = await fetch(`/api/admin/reservations/export?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setToast({
          message: data.error || 'Could not export CSV',
          tone: 'error',
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const session = sessions.find((s) => s.id === sessionId);
      a.href = url;
      a.download = `reservations-${session?.dateLabel || 'session'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'CSV downloaded' });
    } catch {
      setToast({ message: 'Could not export CSV', tone: 'error' });
    } finally {
      setExporting(false);
    }
  }

  async function copyEmails() {
    if (!allEmails) {
      setToast({ message: 'No emails to copy for this session', tone: 'error' });
      return;
    }
    try {
      await navigator.clipboard.writeText(allEmails);
      setToast({ message: 'Copied' });
    } catch {
      setToast({ message: 'Could not copy — allow clipboard access', tone: 'error' });
    }
  }

  const collectedLabel =
    collected.length === 0
      ? '—'
      : collected.map((c) => c.label).join(' · ');

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Reservations</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Confirmed attendees for each session.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            className="admin-logout-btn nav-focus h-10 text-sm inline-flex items-center gap-2"
            onClick={() => void copyEmails()}
            disabled={!allEmails}
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            Copy all emails
          </button>
          <button
            type="button"
            className="btn-ahmixen inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-xl font-semibold text-sm"
            disabled={exporting || !sessionId}
            onClick={() => void exportCsv()}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <label className="block max-w-xl">
        <span className="sr-only">Session</span>
        <select
          className="admin-input"
          value={sessionId}
          onChange={(e) => {
            setSessionId(e.target.value);
            setPage(1);
          }}
          disabled={sessions.length === 0}
        >
          {sessions.length === 0 ? (
            <option value="">No sessions yet</option>
          ) : (
            sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.isLandingActive ? '★ ' : ''}
                {s.title}
                {s.dateLabel ? ` · ${s.dateLabel}` : ''}
              </option>
            ))
          )}
        </select>
      </label>

      <div className="admin-reservations-summary" role="group" aria-label="Seat summary">
        <div className="admin-reservations-stat">
          <span className="admin-reservations-stat-label">Seats total</span>
          <span className="admin-reservations-stat-value">{summary.total}</span>
        </div>
        <div className="admin-reservations-stat">
          <span className="admin-reservations-stat-label">Confirmed</span>
          <span className="admin-reservations-stat-value">{summary.confirmed}</span>
        </div>
        <div className="admin-reservations-stat">
          <span className="admin-reservations-stat-label">Held</span>
          <span className="admin-reservations-stat-value">{summary.held}</span>
        </div>
        <div className="admin-reservations-stat">
          <span className="admin-reservations-stat-label">Available</span>
          <span className="admin-reservations-stat-value">{summary.available}</span>
        </div>
        <div className="admin-reservations-stat">
          <span className="admin-reservations-stat-label">Collected</span>
          <span className="admin-reservations-stat-value text-[13px]">
            {collectedLabel}
          </span>
        </div>
      </div>

      <SearchInput
        className="max-w-xl"
        value={q}
        onChange={(value) => {
          setQ(value.slice(0, 80));
          setPage(1);
        }}
        aria-label="Search reservations"
      />

      {loading && <SkeletonListPage rows={6} cols={5} />}

      {!loading && rows.length === 0 && (
        <div className="admin-card text-center py-10">
          <p className="font-semibold">No confirmed reservations yet.</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Approved bookings for this session will show here.
          </p>
          <Link
            href="/admin/orders"
            className="btn-ahmixen inline-flex mt-4 min-h-10 px-4 rounded-xl font-semibold text-sm items-center"
          >
            Open Bookings
          </Link>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <section
          className={`admin-card admin-sessions-section p-4${
            refreshing ? ' admin-list-dimmed' : ''
          }`}
        >
          <div className="hidden lg:block">
            <div className="admin-sessions-table-wrap">
              <table className="admin-table admin-sessions-table admin-reservations-table">
                <colgroup>
                  <col className="admin-reservations-col-attendee" />
                  <col className="admin-reservations-col-wa" />
                  <col className="admin-reservations-col-plan" />
                  <col className="admin-reservations-col-amount" />
                  <col className="admin-reservations-col-approved" />
                  <col className="admin-reservations-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Attendee</th>
                    <th scope="col">WhatsApp</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Approved on</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <p className="admin-session-title" title={row.customerName}>
                          {row.customerName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {row.customerEmail}
                        </p>
                      </td>
                      <td>
                        <p className="text-[13px]">{row.phone || '—'}</p>
                      </td>
                      <td>
                        <p className="text-[13px]">{row.planName}</p>
                      </td>
                      <td>
                        <p className="text-[13px]">{row.amountLabel}</p>
                      </td>
                      <td>
                        <p className="text-[13px]">{row.approvedLabel || '—'}</p>
                      </td>
                      <td className="admin-sessions-actions-cell">
                        <div className="admin-session-actions gap-2">
                          <AdminIconAction
                            tip="View booking"
                            ariaLabel={`View booking ${row.orderNumber}`}
                            href={`/admin/orders/${row.id}`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </AdminIconAction>
                          {row.phoneDigits ? (
                            <AdminIconAction
                              tip="Message on WhatsApp"
                              ariaLabel={`Message ${row.customerName} on WhatsApp`}
                              href={`https://wa.me/${row.phoneDigits}`}
                              external
                            >
                              <MessageCircle className="w-4 h-4" aria-hidden="true" />
                            </AdminIconAction>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="lg:hidden space-y-3">
            {rows.map((row) => (
              <li key={row.id} className="admin-card admin-session-card space-y-2">
                <p className="font-medium">{row.customerName}</p>
                <p className="text-xs text-[var(--text-muted)]">{row.customerEmail}</p>
                <p className="text-[13px]">{row.phone || '—'}</p>
                <p className="text-[13px]">
                  {row.planName} · {row.amountLabel}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Approved {row.approvedLabel || '—'}
                </p>
                <div className="admin-session-actions gap-2">
                  <AdminIconAction
                    tip="View booking"
                    ariaLabel={`View booking ${row.orderNumber}`}
                    href={`/admin/orders/${row.id}`}
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </AdminIconAction>
                  {row.phoneDigits ? (
                    <AdminIconAction
                      tip="Message on WhatsApp"
                      ariaLabel={`Message ${row.customerName} on WhatsApp`}
                      href={`https://wa.me/${row.phoneDigits}`}
                      external
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    </AdminIconAction>
                  ) : null}
                </div>
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

      {toast ? <AdminToast message={toast.message} tone={toast.tone} /> : null}
    </motion.div>
  );
}
