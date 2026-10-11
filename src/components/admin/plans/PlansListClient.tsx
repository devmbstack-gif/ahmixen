'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, Eye, EyeOff, Pencil, Plus, Search } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdminPlanDTO } from '@/lib/plans/serialize';
import { formatMoneyLabel } from '@/lib/plans/money';
import { AdminIconAction } from '../AdminIconAction';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';

function statusMeaning(display: AdminPlanDTO['displayStatus']) {
  if (display === 'active') return 'Active — customers can choose this plan';
  if (display === 'hidden') return 'Hidden — not shown to customers';
  if (display === 'expired') return 'Expired — the offer end date has passed';
  return 'Archived — kept for records';
}

function statusDotClass(display: AdminPlanDTO['displayStatus']) {
  if (display === 'active') return 'is-open';
  if (display === 'hidden') return 'is-draft';
  if (display === 'expired') return 'is-low';
  return 'is-archived';
}

function statusLabel(display: AdminPlanDTO['displayStatus']) {
  if (display === 'active') return 'Active';
  if (display === 'hidden') return 'Hidden';
  if (display === 'expired') return 'Expired';
  return 'Archived';
}

function formatValidUntil(plan: AdminPlanDTO) {
  if (!plan.validUntil) return 'No end date';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(plan.validUntil));
  } catch {
    return plan.validUntilLocal || '—';
  }
}

function PriceCell({ plan }: { plan: AdminPlanDTO }) {
  if (plan.type === 'installment' && plan.installmentsCount) {
    return (
      <div className="admin-plan-price">
        <span className="font-medium">
          {plan.installmentsCount} × {formatMoneyLabel(plan.currency, plan.price)}
        </span>
        {plan.savingsPercent != null && (
          <span className="admin-plan-save">Save {plan.savingsPercent}%</span>
        )}
      </div>
    );
  }

  return (
    <div className="admin-plan-price">
      <span className="font-medium">
        {formatMoneyLabel(plan.currency, plan.price)}
      </span>
      {plan.originalPrice != null && (
        <span className="admin-plan-original">
          {formatMoneyLabel(plan.currency, plan.originalPrice)}
        </span>
      )}
      {plan.savingsPercent != null && (
        <span className="admin-plan-save">Save {plan.savingsPercent}%</span>
      )}
    </div>
  );
}

function PlanActions({
  plan,
  busy,
  onToggleVisibility,
  onArchive,
}: {
  plan: AdminPlanDTO;
  busy: boolean;
  onToggleVisibility: () => void;
  onArchive: () => void;
}) {
  const isArchived = plan.status === 'archived';
  const showTip = isArchived
    ? 'Archived plans cannot be shown'
    : plan.status === 'active'
      ? 'Hide plan'
      : 'Show plan';

  return (
    <div className="admin-session-actions" role="group" aria-label="Plan actions">
      <AdminIconAction
        tip="Edit plan"
        ariaLabel="Edit plan"
        href={`/admin/pricing/${plan.id}/edit`}
        disabled={busy}
      >
        <Pencil className="w-4 h-4" aria-hidden="true" />
      </AdminIconAction>
      <AdminIconAction
        tip={showTip}
        ariaLabel={plan.status === 'active' ? 'Hide plan' : 'Show plan'}
        disabled={isArchived || busy}
        onClick={onToggleVisibility}
      >
        {plan.status === 'active' ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </AdminIconAction>
      <AdminIconAction
        tip={isArchived ? 'Already archived' : 'Archive plan'}
        ariaLabel="Archive plan"
        danger
        disabled={isArchived || busy}
        onClick={onArchive}
      >
        <Archive className="w-4 h-4" aria-hidden="true" />
      </AdminIconAction>
    </div>
  );
}

export function PlansListClient() {
  const reduceMotion = useReducedMotion();
  const [plans, setPlans] = useState<AdminPlanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [confirm, setConfirm] = useState<AdminPlanDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status !== 'all') params.set('status', status);
      if (status === 'archived') params.set('includeArchived', 'true');
      const res = await fetch(`/api/admin/plans?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { plans: AdminPlanDTO[] };
      setPlans(data.plans);
    } catch {
      setToast({ message: 'Could not load plans', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(t);
  }, [load]);

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem('admin-plans-toast');
      if (msg) {
        sessionStorage.removeItem('admin-plans-toast');
        setToast({ message: msg });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const rows = useMemo(() => {
    if (status === 'archived') {
      return plans.filter((p) => p.status === 'archived');
    }
    return plans;
  }, [plans, status]);

  const empty = !loading && rows.length === 0;

  const toggleVisibility = async (plan: AdminPlanDTO) => {
    const next = plan.status === 'active' ? 'hidden' : 'active';
    setBusyId(plan.id);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, version: plan.version }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({
          message:
            res.status === 409
              ? 'This plan was changed elsewhere, reload'
              : data.error || 'Could not update plan',
          tone: 'error',
        });
        return;
      }
      setToast({
        message: next === 'active' ? 'Plan is now visible' : 'Plan is now hidden',
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const runArchive = async (plan: AdminPlanDTO) => {
    setBusyId(plan.id);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ message: data.error || 'Archive failed', tone: 'error' });
        return;
      }
      setToast({ message: 'Plan archived' });
      await load();
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const renderDesktopTable = (list: AdminPlanDTO[]) => (
    <div className="admin-sessions-table-wrap">
      <table className="admin-table admin-sessions-table admin-plans-table">
        <colgroup>
          <col className="admin-plans-col-name" />
          <col className="admin-plans-col-price" />
          <col className="admin-plans-col-type" />
          <col className="admin-plans-col-valid" />
          <col className="admin-plans-col-status" />
          <col className="admin-plans-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Price</th>
            <th scope="col">Type</th>
            <th scope="col">Valid until</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => {
            const meaning = statusMeaning(p.displayStatus);
            return (
              <tr key={p.id}>
                <td>
                  <p className="admin-session-title" title={p.name}>
                    {p.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                    {p.sessionTitle || 'All sessions'}
                  </p>
                </td>
                <td>
                  <PriceCell plan={p} />
                </td>
                <td>
                  {p.type === 'installment' ? 'Installments' : 'One-time'}
                </td>
                <td>{formatValidUntil(p)}</td>
                <td>
                  <span
                    className="admin-session-status"
                    title={meaning}
                    aria-label={meaning}
                  >
                    <span
                      className={`admin-session-status-dot ${statusDotClass(p.displayStatus)}`}
                      aria-hidden="true"
                    />
                    <span className="admin-session-status-text">
                      {statusLabel(p.displayStatus)}
                    </span>
                  </span>
                </td>
                <td className="admin-sessions-actions-cell">
                  <PlanActions
                    plan={p}
                    busy={busyId === p.id}
                    onToggleVisibility={() => void toggleVisibility(p)}
                    onArchive={() => setConfirm(p)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCards = (list: AdminPlanDTO[]) => (
    <ul className="admin-sessions-cards space-y-3">
      {list.map((p) => {
        const meaning = statusMeaning(p.displayStatus);
        return (
          <li key={p.id} className="admin-card admin-session-card space-y-3">
            <div className="min-w-0">
              <p className="admin-session-title" title={p.name}>
                {p.name}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {p.sessionTitle || 'All sessions'}
              </p>
            </div>
            <PriceCell plan={p} />
            <div className="flex flex-wrap gap-3 text-[13px]">
              <span>
                {p.type === 'installment' ? 'Installments' : 'One-time'}
              </span>
              <span className="text-[var(--text-muted)]">
                {formatValidUntil(p)}
              </span>
            </div>
            <span
              className="admin-session-status"
              title={meaning}
              aria-label={meaning}
            >
              <span
                className={`admin-session-status-dot ${statusDotClass(p.displayStatus)}`}
                aria-hidden="true"
              />
              <span className="admin-session-status-text">
                {statusLabel(p.displayStatus)}
              </span>
            </span>
            <div className="admin-session-card-actions">
              <PlanActions
                plan={p}
                busy={busyId === p.id}
                onToggleVisibility={() => void toggleVisibility(p)}
                onArchive={() => setConfirm(p)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Pricing plans</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Set the prices customers see when they reserve a seat.
          </p>
        </div>
        <Link
          href="/admin/pricing/new"
          className="btn-ahmixen inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-xl font-semibold text-sm shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New plan
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Search plans</span>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name"
            className="admin-input pl-9"
          />
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="admin-input"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      {loading && (
        <p className="text-sm text-[var(--text-muted)]" aria-live="polite">
          Loading…
        </p>
      )}

      {empty && !loading && (
        <div className="admin-card text-center py-10">
          <p className="font-semibold">No pricing plans yet</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Create an Early Bird or Standard plan so customers know what to pay.
          </p>
          <Link
            href="/admin/pricing/new"
            className="btn-ahmixen inline-flex mt-4 min-h-10 px-4 rounded-xl font-semibold text-sm items-center"
          >
            New plan
          </Link>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <section className="admin-card admin-sessions-section p-4">
          <div className="flex items-center justify-between gap-2 pb-3">
            <h3 className="text-base font-semibold">Plans</h3>
            <span className="text-sm text-[var(--text-muted)]">{rows.length}</span>
          </div>
          <div className="hidden lg:block">{renderDesktopTable(rows)}</div>
          <div className="lg:hidden">{renderCards(rows)}</div>
        </section>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
      <AdminConfirmDialog
        open={Boolean(confirm)}
        title="Archive plan?"
        description={
          confirm
            ? `"${confirm.name}" will be archived and hidden from customers. You can still find it in the Archived filter.`
            : ''
        }
        confirmLabel="Archive"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void runArchive(confirm);
        }}
      />
    </motion.div>
  );
}
