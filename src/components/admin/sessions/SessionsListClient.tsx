'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Lock,
  LockOpen,
  Monitor,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdminSessionDTO } from '@/lib/sessions/serialize';
import { SeatsBar } from './SeatsBar';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { SearchInput } from '../SearchInput';
import { SkeletonListPage } from '../skeletons';

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusMeaning(status: string) {
  if (status === 'open') return 'Open — reservations are open';
  if (status === 'draft') return 'Draft — not open for reservations';
  if (status === 'closed') return 'Closed — reservations are closed';
  if (status === 'completed') return 'Completed — session has finished';
  if (status === 'archived') return 'Archived — session is archived';
  return statusLabel(status);
}

function statusDotClass(status: string) {
  if (status === 'open') return 'is-open';
  if (status === 'draft') return 'is-draft';
  if (status === 'closed') return 'is-closed';
  if (status === 'completed') return 'is-completed';
  return 'is-archived';
}

function isPastStart(s: AdminSessionDTO) {
  return new Date(s.startsAt).getTime() < Date.now();
}

function ActionIcon({
  tip,
  ariaLabel,
  disabled,
  onClick,
  href,
  edit,
  accent,
  warn,
  danger,
  children,
}: {
  tip: string;
  ariaLabel: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  edit?: boolean;
  accent?: boolean;
  warn?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.top - 8, left: r.left + r.width / 2 });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, place]);

  const show = () => {
    place();
    setOpen(true);
  };
  const hide = () => setOpen(false);

  const className = [
    'admin-icon-btn admin-session-icon-btn nav-focus',
    edit ? 'is-edit' : '',
    accent ? 'is-accent' : '',
    warn ? 'is-warn' : '',
    danger ? 'is-danger' : '',
    disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const tipNode =
    mounted && open
      ? createPortal(
          <span
            role="tooltip"
            className="admin-action-tooltip"
            style={{ top: pos.top, left: pos.left }}
          >
            {tip}
          </span>,
          document.body
        )
      : null;

  const control = href ? (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {children}
    </Link>
  ) : (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.();
      }}
    >
      {children}
    </button>
  );

  return (
    <>
      <span ref={wrapRef} className="admin-session-icon-wrap">
        {control}
      </span>
      {tipNode}
    </>
  );
}

function SessionActions({
  session,
  busy,
  onShowOnLanding,
  onToggleReservations,
  onDelete,
}: {
  session: AdminSessionDTO;
  busy: boolean;
  onShowOnLanding: () => void;
  onToggleReservations: () => void;
  onDelete: () => void;
}) {
  const isLanding = session.isLandingActive;
  const isArchived = session.status === 'archived';
  const canToggleReservations =
    session.status === 'open' || session.status === 'closed';
  const canShowOnLanding = !isLanding && !isArchived;
  const canDelete = !isLanding;

  let landingTip = 'Show on landing page';
  if (isLanding) landingTip = 'Already shown on landing page';
  else if (isArchived) landingTip = 'Archived sessions cannot be shown on the landing page';
  else if (busy) landingTip = 'Please wait';

  let reservationsTip =
    session.status === 'open' ? 'Close reservations' : 'Open reservations';
  if (!canToggleReservations) {
    reservationsTip = 'Only open or closed sessions can change reservations';
  } else if (busy) {
    reservationsTip = 'Please wait';
  }

  let deleteTip = 'Delete session';
  if (isLanding) {
    deleteTip = 'Cannot delete the landing session — show another session first';
  } else if (busy) {
    deleteTip = 'Please wait';
  }

  return (
    <div className="admin-session-actions" role="group" aria-label="Session actions">
      <ActionIcon
        tip="Edit session"
        ariaLabel="Edit session"
        href={`/admin/sessions/${session.id}/edit`}
        edit
        disabled={busy}
      >
        <Pencil className="w-4 h-4" aria-hidden="true" />
      </ActionIcon>

      <ActionIcon
        tip={landingTip}
        ariaLabel="Show on landing page"
        accent={isLanding}
        disabled={!canShowOnLanding || busy}
        onClick={onShowOnLanding}
      >
        <Monitor className="w-4 h-4" aria-hidden="true" />
      </ActionIcon>

      <ActionIcon
        tip={reservationsTip}
        ariaLabel={
          session.status === 'open' ? 'Close reservations' : 'Open reservations'
        }
        warn
        disabled={!canToggleReservations || busy}
        onClick={onToggleReservations}
      >
        {session.status === 'open' ? (
          <Lock className="w-4 h-4" aria-hidden="true" />
        ) : (
          <LockOpen className="w-4 h-4" aria-hidden="true" />
        )}
      </ActionIcon>

      <ActionIcon
        tip={deleteTip}
        ariaLabel="Delete session"
        danger
        disabled={!canDelete || busy}
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </ActionIcon>
    </div>
  );
}

function TitleCell({ session }: { session: AdminSessionDTO }) {
  return (
    <div className="admin-session-title-cell">
      <p className="admin-session-title" title={session.title}>
        {session.title}
      </p>
      {session.isLandingActive && (
        <span className="admin-badge admin-badge-ok admin-badge-sentence">
          Shown on landing page
        </span>
      )}
    </div>
  );
}

function StatusCell({ session }: { session: AdminSessionDTO }) {
  const past =
    (session.status === 'open' || session.status === 'draft') && isPastStart(session);
  const meaning = statusMeaning(session.status);

  return (
    <div className="admin-session-status-cell">
      <span
        className="admin-session-status"
        title={meaning}
        aria-label={meaning}
      >
        <span
          className={`admin-session-status-dot ${statusDotClass(session.status)}`}
          aria-hidden="true"
        />
        <span className="admin-session-status-text">{statusLabel(session.status)}</span>
      </span>
      {past && (
        <span
          className="admin-badge admin-badge-date-passed admin-badge-sentence"
          title="Close or complete this session"
        >
          Date passed
        </span>
      )}
    </div>
  );
}

function DateTimeCell({ session }: { session: AdminSessionDTO }) {
  return (
    <div className="admin-session-datetime">
      <span>{session.display.dateLabel}</span>
      <span className="admin-session-datetime-time">{session.display.timeLabel}</span>
    </div>
  );
}

export function SessionsListClient() {
  const reduceMotion = useReducedMotion();
  const [sessions, setSessions] = useState<AdminSessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [confirm, setConfirm] = useState<
    | { type: 'activate' | 'delete'; session: AdminSessionDTO }
    | null
  >(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (hasLoadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status !== 'all') params.set('status', status);
      if (status === 'archived') params.set('includeArchived', 'true');
      const res = await fetch(`/api/admin/sessions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { sessions: AdminSessionDTO[] };
      setSessions(data.sessions);
      hasLoadedOnce.current = true;
    } catch {
      setToast({ message: 'Could not load sessions', tone: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      const msg = sessionStorage.getItem('admin-sessions-toast');
      if (msg) {
        sessionStorage.removeItem('admin-sessions-toast');
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

  const { activeUpcoming, closedCompleted } = useMemo(() => {
    const active = sessions
      .filter((s) => s.status === 'open' || s.status === 'draft')
      .sort((a, b) => {
        if (a.isLandingActive !== b.isLandingActive) {
          return a.isLandingActive ? -1 : 1;
        }
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      });
    const closed = sessions
      .filter((s) => s.status === 'closed' || s.status === 'completed')
      .sort(
        (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
      );
    const archived =
      status === 'archived'
        ? sessions.filter((s) => s.status === 'archived')
        : [];
    return {
      activeUpcoming: status === 'archived' ? [] : active,
      closedCompleted: status === 'archived' ? archived : closed,
    };
  }, [sessions, status]);

  const empty =
    !loading && activeUpcoming.length === 0 && closedCompleted.length === 0;

  const runActivate = async (session: AdminSessionDTO) => {
    setBusyId(session.id);
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}/activate`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ message: data.error || 'Could not update landing session', tone: 'error' });
        return;
      }
      setToast({ message: 'Shown on landing page' });
      await load();
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const runDelete = async (session: AdminSessionDTO) => {
    setBusyId(session.id);
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ message: data.error || 'Delete failed', tone: 'error' });
        return;
      }
      setToast({ message: 'Session deleted' });
      await load();
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const toggleOpenClose = async (session: AdminSessionDTO) => {
    const next = session.status === 'open' ? 'closed' : 'open';
    setBusyId(session.id);
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: session.version,
          status: next,
          localDate: session.localDate,
          localTime: session.localTime,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({
          message:
            res.status === 409
              ? 'This session was changed elsewhere, reload'
              : data.error || 'Update failed',
          tone: 'error',
        });
        return;
      }
      setToast({
        message:
          next === 'open' ? 'Reservations opened' : 'Reservations closed',
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (s: AdminSessionDTO) => (
    <SessionActions
      session={s}
      busy={busyId === s.id}
      onShowOnLanding={() => setConfirm({ type: 'activate', session: s })}
      onToggleReservations={() => void toggleOpenClose(s)}
      onDelete={() => setConfirm({ type: 'delete', session: s })}
    />
  );

  const renderDesktopTable = (
    rows: AdminSessionDTO[],
    muted?: boolean
  ) => (
    <div className="admin-sessions-table-wrap">
      <table
        className={`admin-table admin-sessions-table ${muted ? 'opacity-90' : ''}`}
      >
        <colgroup>
          <col className="admin-sessions-col-title" />
          <col className="admin-sessions-col-datetime" />
          <col className="admin-sessions-col-status" />
          <col className="admin-sessions-col-seats" />
          <col className="admin-sessions-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Date & time</th>
            <th scope="col">Status</th>
            <th scope="col">Seats</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>
                <TitleCell session={s} />
              </td>
              <td>
                <DateTimeCell session={s} />
              </td>
              <td>
                <StatusCell session={s} />
              </td>
              <td>
                <SeatsBar seats={s.seats} />
              </td>
              <td className="admin-sessions-actions-cell">{actionsFor(s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMobileCards = (rows: AdminSessionDTO[], muted?: boolean) => (
    <ul className={`admin-sessions-cards space-y-3 ${muted ? 'opacity-90' : ''}`}>
      {rows.map((s) => (
        <li key={s.id} className="admin-card admin-session-card space-y-3">
          <div className="min-w-0">
            <TitleCell session={s} />
            <div className="mt-1.5">
              <DateTimeCell session={s} />
            </div>
          </div>
          <StatusCell session={s} />
          <SeatsBar seats={s.seats} />
          <div className="admin-session-card-actions">{actionsFor(s)}</div>
        </li>
      ))}
    </ul>
  );

  const sectionTitle =
    status === 'archived' ? 'Archived' : 'Closed and completed';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Live Sessions</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Create and manage workshop sessions shown on the site.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
          <SearchInput
            className="flex-1"
            value={q}
            onChange={setQ}
            aria-label="Search sessions"
          />
          <label className="sm:w-48">
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="admin-input"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        <Link
          href="/admin/sessions/new"
          className="btn-ahmixen inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-xl font-semibold text-sm"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New session
        </Link>
      </div>

      {loading && <SkeletonListPage showCards rows={4} cols={4} />}

      {empty && !loading && (
        <div className="admin-card text-center py-10">
          <p className="font-semibold">No sessions match</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Try another search, clear the status filter, or create a new session.
          </p>
          <Link
            href="/admin/sessions/new"
            className="btn-ahmixen inline-flex mt-4 min-h-10 px-4 rounded-xl font-semibold text-sm items-center"
          >
            New session
          </Link>
        </div>
      )}

      {!loading && (activeUpcoming.length > 0 || closedCompleted.length > 0) && (
        <div className={refreshing ? 'admin-list-dimmed space-y-4' : 'space-y-4'}>
          {status !== 'archived' && activeUpcoming.length > 0 && (
            <section className="admin-card admin-sessions-section p-4">
              <div className="flex items-center justify-between gap-2 pb-3">
                <h2 className="text-base font-semibold">Active and upcoming</h2>
                <span className="text-sm text-[var(--text-muted)]">
                  {activeUpcoming.length}
                </span>
              </div>
              <div className="hidden lg:block">{renderDesktopTable(activeUpcoming)}</div>
              <div className="lg:hidden">{renderMobileCards(activeUpcoming)}</div>
            </section>
          )}

          {closedCompleted.length > 0 && (
            <section className="admin-card admin-sessions-section p-4">
              <div className="flex items-center justify-between gap-2 pb-3">
                <h2 className="text-base font-semibold text-[var(--text-secondary)]">
                  {sectionTitle}
                </h2>
                <span className="text-sm text-[var(--text-muted)]">
                  {closedCompleted.length}
                </span>
              </div>
              <div className="hidden lg:block">
                {renderDesktopTable(closedCompleted, true)}
              </div>
              <div className="lg:hidden">
                {renderMobileCards(closedCompleted, true)}
              </div>
            </section>
          )}
        </div>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
      <AdminConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.type === 'activate'
            ? 'Show on landing page?'
            : 'Delete session?'
        }
        description={
          confirm?.type === 'activate'
            ? `"${confirm.session.title}" will be shown on the landing page. Any other landing session will be turned off.`
            : `"${confirm?.session.title}" will be permanently removed from this list. Closed or completed sessions can be deleted so you can set a new landing session. Open sessions with seats or holds must be closed first.`
        }
        confirmLabel={
          confirm?.type === 'activate' ? 'Show on landing page' : 'Delete'
        }
        danger={confirm?.type === 'delete'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === 'activate') void runActivate(confirm.session);
          else void runDelete(confirm.session);
        }}
      />
    </motion.div>
  );
}
