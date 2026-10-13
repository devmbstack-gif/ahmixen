'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  Copy,
  Check,
  Gift,
  Pause,
  Pencil,
  Play,
  Plus,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdminCouponDTO } from '@/lib/coupons/serialize';
import type { CouponComputedState } from '@/lib/coupons/state';
import { AdminIconAction } from '../AdminIconAction';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { SearchInput } from '../SearchInput';
import { SkeletonListPage } from '../skeletons';

function stateMeaning(state: CouponComputedState) {
  if (state === 'active') return 'Active — customers can use this code';
  if (state === 'paused') return 'Paused — temporarily not usable';
  if (state === 'scheduled') return 'Scheduled — starts on a future date';
  if (state === 'expired') return 'Expired — the end date has passed';
  if (state === 'used up') return 'Used up — the total use limit was reached';
  return 'Archived — kept for records';
}

function stateDotClass(state: CouponComputedState) {
  if (state === 'active') return 'is-open';
  if (state === 'paused') return 'is-draft';
  if (state === 'scheduled') return 'is-completed';
  if (state === 'expired') return 'is-low';
  if (state === 'used up') return 'is-closed';
  return 'is-archived';
}

function stateLabel(state: CouponComputedState) {
  if (state === 'used up') return 'Used up';
  return state.charAt(0).toUpperCase() + state.slice(1);
}

function UsedCell({ coupon }: { coupon: AdminCouponDTO }) {
  const pct =
    coupon.usageLimit != null && coupon.usageLimit > 0
      ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100))
      : 0;

  return (
    <div className="admin-coupon-used">
      <span className="admin-coupon-used-text">{coupon.usedLabel}</span>
      {coupon.usageLimit != null && (
        <span
          className="admin-coupon-used-bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${coupon.usedCount} of ${coupon.usageLimit} uses`}
        >
          <span style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <AdminIconAction
      tip={copied ? 'Copied' : 'Copy code'}
      ariaLabel={copied ? 'Copied' : `Copy code ${code}`}
      onClick={() => void copy()}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
      )}
    </AdminIconAction>
  );
}

function CouponActions({
  coupon,
  busy,
  onTogglePause,
  onPopup,
  onArchive,
}: {
  coupon: AdminCouponDTO;
  busy: boolean;
  onTogglePause: () => void;
  onPopup: () => void;
  onArchive: () => void;
}) {
  const isArchived = coupon.status === 'archived';
  const isPaused = coupon.status === 'paused';

  return (
    <div className="admin-session-actions" role="group" aria-label="Coupon actions">
      <AdminIconAction
        tip="Edit coupon"
        ariaLabel="Edit coupon"
        href={`/admin/coupons/${coupon.id}/edit`}
        disabled={busy}
      >
        <Pencil className="w-4 h-4" aria-hidden="true" />
      </AdminIconAction>
      <AdminIconAction
        tip={
          isArchived
            ? 'Archived coupons cannot be changed'
            : isPaused
              ? 'Resume coupon'
              : 'Pause coupon'
        }
        ariaLabel={isPaused ? 'Resume coupon' : 'Pause coupon'}
        disabled={isArchived || busy}
        onClick={onTogglePause}
      >
        {isPaused ? (
          <Play className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Pause className="w-4 h-4" aria-hidden="true" />
        )}
      </AdminIconAction>
      <AdminIconAction
        tip={
          coupon.isPopupCoupon
            ? 'Already the popup coupon'
            : isArchived || coupon.status !== 'active'
              ? 'Only active coupons can be the popup coupon'
              : 'Make popup coupon'
        }
        ariaLabel="Make popup coupon"
        accent={coupon.isPopupCoupon}
        disabled={
          isArchived || busy || coupon.isPopupCoupon || coupon.status !== 'active'
        }
        onClick={onPopup}
      >
        <Gift className="w-4 h-4" aria-hidden="true" />
      </AdminIconAction>
      <AdminIconAction
        tip={isArchived ? 'Already archived' : 'Archive coupon'}
        ariaLabel="Archive coupon"
        danger
        disabled={isArchived || busy}
        onClick={onArchive}
      >
        <Archive className="w-4 h-4" aria-hidden="true" />
      </AdminIconAction>
    </div>
  );
}

export function CouponsListClient() {
  const reduceMotion = useReducedMotion();
  const [coupons, setCoupons] = useState<AdminCouponDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [q, setQ] = useState('');
  const [state, setState] = useState('all');
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [confirm, setConfirm] = useState<
    | { type: 'archive'; coupon: AdminCouponDTO }
    | { type: 'popup'; coupon: AdminCouponDTO }
    | null
  >(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (hasLoadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (state !== 'all') params.set('state', state);
      if (state === 'archived') params.set('includeArchived', 'true');
      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { coupons: AdminCouponDTO[] };
      setCoupons(data.coupons);
      hasLoadedOnce.current = true;
    } catch {
      setToast({ message: 'Could not load coupons', tone: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, state]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(t);
  }, [load]);

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem('admin-coupons-toast');
      if (msg) {
        sessionStorage.removeItem('admin-coupons-toast');
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

  const rows = useMemo(() => coupons, [coupons]);
  const empty = !loading && rows.length === 0;

  const togglePause = async (coupon: AdminCouponDTO) => {
    const next = coupon.status === 'paused' ? 'active' : 'paused';
    setBusyId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, version: coupon.version }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({
          message:
            res.status === 409
              ? 'This coupon was changed elsewhere, reload'
              : data.error || 'Could not update coupon',
          tone: 'error',
        });
        return;
      }
      setToast({
        message: next === 'active' ? 'Coupon resumed' : 'Coupon paused',
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const runPopup = async (coupon: AdminCouponDTO) => {
    setBusyId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}/popup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: coupon.version }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({
          message:
            res.status === 409
              ? 'This coupon was changed elsewhere, reload'
              : data.error || 'Could not set popup coupon',
          tone: 'error',
        });
        return;
      }
      setToast({ message: `${coupon.code} is now the popup coupon` });
      await load();
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const runArchive = async (coupon: AdminCouponDTO) => {
    setBusyId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ message: data.error || 'Archive failed', tone: 'error' });
        return;
      }
      setToast({ message: 'Coupon archived' });
      await load();
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const renderDesktopTable = (list: AdminCouponDTO[]) => (
    <div className="admin-sessions-table-wrap">
      <table className="admin-table admin-sessions-table admin-coupons-table">
        <colgroup>
          <col className="admin-coupons-col-code" />
          <col className="admin-coupons-col-discount" />
          <col className="admin-coupons-col-applies" />
          <col className="admin-coupons-col-used" />
          <col className="admin-coupons-col-status" />
          <col className="admin-coupons-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Discount</th>
            <th scope="col">Applies to</th>
            <th scope="col">Used</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => {
            const meaning = stateMeaning(c.state);
            return (
              <tr key={c.id}>
                <td>
                  <div className="admin-coupon-code-row">
                    <code className="admin-coupon-code">{c.code}</code>
                    <CopyCodeButton code={c.code} />
                  </div>
                  {c.note ? (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      {c.note}
                    </p>
                  ) : null}
                </td>
                <td>{c.discountLabel}</td>
                <td>
                  <span className="truncate block" title={c.appliesToLabel}>
                    {c.appliesToLabel}
                  </span>
                </td>
                <td>
                  <UsedCell coupon={c} />
                </td>
                <td>
                  <span
                    className="admin-session-status"
                    title={meaning}
                    aria-label={meaning}
                  >
                    <span
                      className={`admin-session-status-dot ${stateDotClass(c.state)}`}
                      aria-hidden="true"
                    />
                    <span className="admin-session-status-text">
                      {stateLabel(c.state)}
                    </span>
                  </span>
                  {c.endsLabel ? (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {c.endsLabel}
                    </p>
                  ) : null}
                  {c.isPopupCoupon ? (
                    <span className="admin-coupon-popup-pill">Popup coupon</span>
                  ) : null}
                </td>
                <td className="admin-sessions-actions-cell">
                  <CouponActions
                    coupon={c}
                    busy={busyId === c.id}
                    onTogglePause={() => void togglePause(c)}
                    onPopup={() => setConfirm({ type: 'popup', coupon: c })}
                    onArchive={() => setConfirm({ type: 'archive', coupon: c })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCards = (list: AdminCouponDTO[]) => (
    <ul className="admin-sessions-cards space-y-3">
      {list.map((c) => {
        const meaning = stateMeaning(c.state);
        return (
          <li key={c.id} className="admin-card admin-session-card space-y-3">
            <div className="min-w-0">
              <div className="admin-coupon-code-row">
                <code className="admin-coupon-code">{c.code}</code>
                <CopyCodeButton code={c.code} />
              </div>
              {c.note ? (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.note}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3 text-[13px]">
              <span>{c.discountLabel}</span>
              <span className="text-[var(--text-muted)]">{c.appliesToLabel}</span>
            </div>
            <UsedCell coupon={c} />
            <div>
              <span
                className="admin-session-status"
                title={meaning}
                aria-label={meaning}
              >
                <span
                  className={`admin-session-status-dot ${stateDotClass(c.state)}`}
                  aria-hidden="true"
                />
                <span className="admin-session-status-text">
                  {stateLabel(c.state)}
                </span>
              </span>
              {c.endsLabel ? (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {c.endsLabel}
                </p>
              ) : null}
              {c.isPopupCoupon ? (
                <span className="admin-coupon-popup-pill">Popup coupon</span>
              ) : null}
            </div>
            <div className="admin-session-card-actions">
              <CouponActions
                coupon={c}
                busy={busyId === c.id}
                onTogglePause={() => void togglePause(c)}
                onPopup={() => setConfirm({ type: 'popup', coupon: c })}
                onArchive={() => setConfirm({ type: 'archive', coupon: c })}
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
          <h2 className="text-lg font-semibold">Coupons</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Create discount codes customers can use when they pay.
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="btn-ahmixen inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-xl font-semibold text-sm shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New coupon
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
        <SearchInput
          className="flex-1"
          value={q}
          onChange={setQ}
          aria-label="Search coupons"
        />
        <label className="sm:w-52">
          <span className="sr-only">Filter by status</span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="admin-input"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="used up">Used up</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      {loading && <SkeletonListPage rows={5} cols={5} />}

      {empty && !loading && (
        <div className="admin-card text-center py-10">
          <p className="font-semibold">No coupons yet</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Create a percent or fixed discount code for your pricing plans.
          </p>
          <Link
            href="/admin/coupons/new"
            className="btn-ahmixen inline-flex mt-4 min-h-10 px-4 rounded-xl font-semibold text-sm items-center"
          >
            New coupon
          </Link>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <section
          className={`admin-card admin-sessions-section p-4${
            refreshing ? ' admin-list-dimmed' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-3">
            <h3 className="text-base font-semibold">Coupons</h3>
            <span className="text-sm text-[var(--text-muted)]">{rows.length}</span>
          </div>
          <div className="hidden lg:block">{renderDesktopTable(rows)}</div>
          <div className="lg:hidden">{renderCards(rows)}</div>
        </section>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
      <AdminConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.type === 'popup'
            ? 'Make this the popup coupon?'
            : 'Archive coupon?'
        }
        description={
          confirm?.type === 'popup'
            ? `"${confirm.coupon.code}" will be given to people who fill the discount popup. Any other popup coupon will be turned off.`
            : confirm
              ? `"${confirm.coupon.code}" will be archived and stop working. Redemption history is kept.`
              : ''
        }
        confirmLabel={confirm?.type === 'popup' ? 'Make popup coupon' : 'Archive'}
        danger={confirm?.type === 'archive'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === 'popup') void runPopup(confirm.coupon);
          else void runArchive(confirm.coupon);
        }}
      />
    </motion.div>
  );
}
