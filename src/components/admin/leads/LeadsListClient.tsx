'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Download,
  Mail,
  MessageCircle,
  PanelRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { SearchInput } from '../SearchInput';
import { SkeletonListPage } from '../skeletons';
import { AdminIconAction } from '../AdminIconAction';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { AdminToast } from '../AdminToast';
import type { AdminLeadListDTO, LeadStatus } from '@/lib/leads/serialize';

type Counts = {
  new: number;
  contacted: number;
  converted: number;
  all: number;
};

const TABS: Array<{ key: string; label: string; countKey: keyof Counts }> = [
  { key: 'new', label: 'New', countKey: 'new' },
  { key: 'contacted', label: 'Contacted', countKey: 'contacted' },
  { key: 'converted', label: 'Converted', countKey: 'converted' },
  { key: 'all', label: 'All', countKey: 'all' },
];

function statusDotClass(status: LeadStatus) {
  if (status === 'contacted') return 'is-low';
  if (status === 'converted') return 'is-open';
  return 'is-draft';
}

export function LeadsListClient() {
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState('new');
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState<AdminLeadListDTO[]>([]);
  const [counts, setCounts] = useState<Counts>({
    new: 0,
    contacted: 0,
    converted: 0,
    all: 0,
  });
  const [sources, setSources] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [detail, setDetail] = useState<AdminLeadListDTO | null>(null);
  const [note, setNote] = useState('');
  const [detailStatus, setDetailStatus] = useState<'new' | 'contacted'>('new');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (hasLoadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', status);
      params.set('page', String(page));
      if (q.trim()) params.set('q', q.trim().slice(0, 80));
      if (source) params.set('source', source);
      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeads(data.leads ?? []);
      setCounts(data.counts ?? counts);
      setSources(data.sources ?? []);
      setTotalPages(data.totalPages ?? 1);
      hasLoadedOnce.current = true;
    } catch {
      setToast({ message: 'Could not load leads — refresh and try again', tone: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, q, source]);

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
    status === 'new'
      ? 'No new leads yet.'
      : status === 'contacted'
        ? 'No contacted leads.'
        : status === 'converted'
          ? 'No converted leads yet.'
          : 'No leads yet.';

  async function markContacted(lead: AdminLeadListDTO) {
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'contacted', version: lead.version }),
      });
      if (res.status === 409) {
        setToast({
          message: 'This lead was changed elsewhere — reload and try again',
          tone: 'error',
        });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setToast({
          message: data.error || 'Could not update lead',
          tone: 'error',
        });
        return;
      }
      setToast({ message: 'Marked as contacted' });
      void load();
    } catch {
      setToast({ message: 'Could not update lead', tone: 'error' });
    }
  }

  async function openDetails(lead: AdminLeadListDTO) {
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`);
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      const row = data.lead as AdminLeadListDTO;
      setDetail(row);
      setNote(row.adminNote || '');
      setDetailStatus(row.status === 'contacted' ? 'contacted' : 'new');
    } catch {
      setToast({ message: 'Could not open lead details', tone: 'error' });
    }
  }

  async function saveDetails() {
    if (!detail) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        version: detail.version,
        adminNote: note,
      };
      if (detail.status !== 'converted') {
        body.status = detailStatus;
      }
      const res = await fetch(`/api/admin/leads/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        setToast({
          message: 'This lead was changed elsewhere — reload and try again',
          tone: 'error',
        });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setToast({
          message: data.error || 'Could not save — check the note and try again',
          tone: 'error',
        });
        return;
      }
      const data = await res.json();
      setDetail(data.lead);
      setNote(data.lead.adminNote || '');
      setToast({ message: 'Lead saved' });
      void load();
    } catch {
      setToast({ message: 'Could not save lead', tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!detail) return;
    try {
      const res = await fetch(`/api/admin/leads/${detail.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setToast({ message: 'Could not delete lead', tone: 'error' });
        return;
      }
      setDeleteOpen(false);
      setDetail(null);
      setToast({ message: 'Lead deleted' });
      void load();
    } catch {
      setToast({ message: 'Could not delete lead', tone: 'error' });
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('status', status);
      if (q.trim()) params.set('q', q.trim().slice(0, 80));
      if (source) params.set('source', source);
      const res = await fetch(`/api/admin/leads/export?${params.toString()}`);
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
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'CSV downloaded' });
    } catch {
      setToast({ message: 'Could not export CSV', tone: 'error' });
    } finally {
      setExporting(false);
    }
  }

  function actionsFor(lead: AdminLeadListDTO) {
    return (
      <div className="admin-session-actions gap-2">
        {lead.phoneDigits ? (
          <AdminIconAction
            tip="Message on WhatsApp"
            ariaLabel={`Message ${lead.name} on WhatsApp`}
            href={`https://wa.me/${lead.phoneDigits}`}
            external
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
          </AdminIconAction>
        ) : null}
        {lead.email ? (
          <AdminIconAction
            tip="Send email"
            ariaLabel={`Email ${lead.name}`}
            href={`mailto:${lead.email}`}
            external
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
          </AdminIconAction>
        ) : null}
        {lead.status === 'new' ? (
          <AdminIconAction
            tip="Mark as contacted"
            ariaLabel={`Mark ${lead.name} as contacted`}
            onClick={() => void markContacted(lead)}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          </AdminIconAction>
        ) : null}
        <AdminIconAction
          tip="Details"
          ariaLabel={`Open details for ${lead.name}`}
          onClick={() => void openDetails(lead)}
        >
          <PanelRight className="w-4 h-4" aria-hidden="true" />
        </AdminIconAction>
      </div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Leads</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            People who filled the discount popup.
          </p>
        </div>
        <button
          type="button"
          className="btn-ahmixen inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-xl font-semibold text-sm shrink-0"
          disabled={exporting}
          onClick={() => void exportCsv()}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div
        className="admin-orders-tabs"
        role="tablist"
        aria-label="Lead status"
      >
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`admin-orders-tab nav-focus ${active ? 'is-active' : ''}`}
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
            setQ(value.slice(0, 80));
            setPage(1);
          }}
          aria-label="Search leads"
        />
        <label className="sm:w-52">
          <span className="sr-only">Filter by source</span>
          <select
            className="admin-input"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All sources</option>
            <option value="direct">Direct</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <SkeletonListPage showTabs rows={6} cols={6} />}

      {!loading && leads.length === 0 && (
        <div className="admin-card text-center py-10">
          <p className="font-semibold">{emptyCopy}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            New leads appear here when someone submits the discount popup.
          </p>
        </div>
      )}

      {!loading && leads.length > 0 && (
        <section
          className={`admin-card admin-sessions-section p-4${
            refreshing ? ' admin-list-dimmed' : ''
          }`}
        >
          <div className="hidden lg:block">
            <div className="admin-sessions-table-wrap">
              <table className="admin-table admin-sessions-table admin-leads-table">
                <colgroup>
                  <col className="admin-leads-col-lead" />
                  <col className="admin-leads-col-wa" />
                  <col className="admin-leads-col-profession" />
                  <col className="admin-leads-col-source" />
                  <col className="admin-leads-col-status" />
                  <col className="admin-leads-col-date" />
                  <col className="admin-leads-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Lead</th>
                    <th scope="col">WhatsApp</th>
                    <th scope="col">Profession</th>
                    <th scope="col">Source</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <p className="admin-session-title" title={lead.name}>
                          {lead.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {lead.email}
                        </p>
                      </td>
                      <td>
                        <p className="text-[13px]">{lead.phone || '—'}</p>
                      </td>
                      <td>
                        <p className="text-[13px] truncate" title={lead.profession}>
                          {lead.profession || '—'}
                        </p>
                      </td>
                      <td>
                        <p className="text-[13px]">{lead.sourceLabel}</p>
                        {lead.utmCampaign ? (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                            {lead.utmCampaign}
                          </p>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className="admin-session-status"
                          aria-label={lead.statusLabel}
                        >
                          <span
                            className={`admin-session-status-dot ${statusDotClass(lead.status)}`}
                            aria-hidden="true"
                          />
                          <span className="admin-session-status-text">
                            {lead.statusLabel}
                          </span>
                        </span>
                      </td>
                      <td>
                        <p className="text-[13px]">{lead.firstSeenLabel}</p>
                        {lead.showLastSeen ? (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            last seen {lead.lastSeenLabel}
                          </p>
                        ) : null}
                      </td>
                      <td className="admin-sessions-actions-cell">
                        {actionsFor(lead)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="lg:hidden space-y-3">
            {leads.map((lead) => (
              <li key={lead.id} className="admin-card admin-session-card space-y-2">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{lead.email}</p>
                  </div>
                  <span className="admin-session-status shrink-0">
                    <span
                      className={`admin-session-status-dot ${statusDotClass(lead.status)}`}
                      aria-hidden="true"
                    />
                    <span className="admin-session-status-text">
                      {lead.statusLabel}
                    </span>
                  </span>
                </div>
                <p className="text-[13px]">{lead.phone || '—'}</p>
                <p className="text-[13px]">{lead.profession || '—'}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {lead.sourceLabel}
                  {lead.utmCampaign ? ` · ${lead.utmCampaign}` : ''}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {lead.firstSeenLabel}
                  {lead.showLastSeen ? ` · last seen ${lead.lastSeenLabel}` : ''}
                </p>
                {actionsFor(lead)}
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

      {detail ? (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close details"
            onClick={() => setDetail(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-detail-title"
            className="admin-card relative z-10 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="lead-detail-title" className="text-lg font-semibold">
                  {detail.name}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">{detail.email}</p>
              </div>
              <button
                type="button"
                className="admin-logout-btn nav-focus h-10 text-sm"
                onClick={() => setDetail(null)}
              >
                Close
              </button>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--text-muted)] text-xs">WhatsApp</dt>
                <dd className="mt-0.5">{detail.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Profession</dt>
                <dd className="mt-0.5">{detail.profession || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--text-muted)] text-xs">Message</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">
                  {detail.message || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Source</dt>
                <dd className="mt-0.5">{detail.sourceLabel}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Campaign</dt>
                <dd className="mt-0.5">{detail.utmCampaign || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Medium</dt>
                <dd className="mt-0.5">{detail.utmMedium || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Submissions</dt>
                <dd className="mt-0.5">{detail.submissionsCount}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">First seen</dt>
                <dd className="mt-0.5">{detail.firstSeenLabel}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)] text-xs">Last seen</dt>
                <dd className="mt-0.5">{detail.lastSeenLabel || '—'}</dd>
              </div>
              {detail.status === 'converted' && detail.convertedOrderId ? (
                <div className="sm:col-span-2">
                  <dt className="text-[var(--text-muted)] text-xs">Booking</dt>
                  <dd className="mt-0.5">
                    <Link
                      href={`/admin/orders/${detail.convertedOrderId}`}
                      className="text-[var(--primary-purple)] font-semibold nav-focus"
                    >
                      Open booking
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="lead-status">
                Status
              </label>
              {detail.status === 'converted' ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Converted (set automatically when they book)
                </p>
              ) : (
                <select
                  id="lead-status"
                  className="admin-input"
                  value={detailStatus}
                  onChange={(e) =>
                    setDetailStatus(e.target.value as 'new' | 'contacted')
                  }
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="lead-note">
                Internal note
              </label>
              <textarea
                id="lead-note"
                className="admin-input min-h-24 w-full"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {note.length}/500
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-between">
              <button
                type="button"
                className="admin-order-reject-btn nav-focus"
                onClick={() => setDeleteOpen(true)}
              >
                Delete lead
              </button>
              <button
                type="button"
                className="btn-ahmixen min-h-10 px-4 rounded-xl font-semibold text-sm nav-focus"
                disabled={saving}
                onClick={() => void saveDetails()}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={deleteOpen}
        title="Delete this lead?"
        description="This permanently removes this person's lead data. Bookings are never touched."
        confirmLabel="Delete lead"
        danger
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />

      {toast ? <AdminToast message={toast.message} tone={toast.tone} /> : null}
    </motion.div>
  );
}
