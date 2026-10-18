'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { AdminTestimonialDTO } from '@/lib/testimonials/serialize';
import { AdminIconAction } from '../AdminIconAction';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { SkeletonListPage } from '../skeletons';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function statusLabel(item: AdminTestimonialDTO) {
  if (item.visible) return 'Visible';
  if (item.source === 'feedback') return 'Pending';
  return 'Hidden';
}

function statusDotClass(item: AdminTestimonialDTO) {
  if (item.visible) return 'is-open';
  if (item.source === 'feedback') return 'is-draft';
  return 'is-draft';
}

export function TestimonialsListClient() {
  const [items, setItems] = useState<AdminTestimonialDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyFeedbackLink = async () => {
    const url = `${window.location.origin}/feedback`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setToast({ message: 'Feedback link copied' });
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setToast({ message: 'Could not copy link', tone: 'error' });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials');
      const data = (await res.json().catch(() => ({}))) as {
        items?: AdminTestimonialDTO[];
        error?: string;
      };
      if (!res.ok) {
        setToast({ message: data.error || 'Could not load testimonials', tone: 'error' });
        return;
      }
      const list = data.items || [];
      // Pending public feedback at top so they are easy to approve
      list.sort((a, b) => {
        const ap = !a.visible && a.source === 'feedback' ? 0 : 1;
        const bp = !b.visible && b.source === 'feedback' ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return a.sortOrder - b.sortOrder;
      });
      setItems(list);
    } catch {
      setToast({ message: 'Could not load testimonials', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const reorder = async (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    setItems(next);
    setBusyId(moved.id);
    try {
      const res = await fetch('/api/admin/testimonials/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
      });
      if (!res.ok) {
        await load();
        setToast({ message: 'Could not reorder. Reload and try again.', tone: 'error' });
      } else {
        setToast({ message: 'Order updated' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const toggleVisible = async (item: AdminTestimonialDTO) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/testimonials/${item.id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !item.visible, version: item.version }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        item?: AdminTestimonialDTO;
        error?: string;
      };
      if (res.status === 409) {
        setToast({ message: 'This was changed elsewhere, reload', tone: 'error' });
        await load();
        return;
      }
      if (!res.ok || !data.item) {
        setToast({ message: data.error || 'Could not update visibility', tone: 'error' });
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === data.item!.id ? data.item! : i)));
      setToast({
        message: data.item.visible
          ? 'Approved — now visible on the website'
          : 'Hidden from the website',
      });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setToast({ message: 'Could not delete. Try again.', tone: 'error' });
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setToast({ message: 'Testimonial deleted' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Testimonials
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Reviews shown on the website. Public feedback stays Pending until you
            show it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyFeedbackLink()}
            className="admin-logout-btn nav-focus inline-flex min-h-10 items-center gap-2 px-4 rounded-xl text-sm font-semibold"
          >
            {linkCopied ? (
              <Copy className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            )}
            {linkCopied ? 'Copied' : 'Copy feedback link'}
          </button>
          <Link
            href="/admin/testimonials/new"
            className="btn-ahmixen nav-focus inline-flex min-h-10 items-center gap-2 px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New testimonial
          </Link>
        </div>
      </div>

      {loading ? (
        <SkeletonListPage rows={5} cols={4} />
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No testimonials yet. Add one to show reviews on the site.
        </p>
      ) : (
        <>
          <div className="admin-card hidden overflow-x-auto lg:block">
            <table className="admin-table admin-sessions-table w-full">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Quote</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-secondary)] text-[11px] font-bold">
                          {item.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials(item.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.name}</div>
                          <div className="truncate text-xs text-[var(--text-secondary)]">
                            {item.role || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="line-clamp-2 max-w-[280px] text-sm"
                        title={item.quote}
                      >
                        {item.quote}
                      </span>
                    </td>
                    <td>{item.rating ?? '—'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span
                          className={`admin-session-status-dot ${statusDotClass(item)}`}
                          aria-hidden="true"
                        />
                        {statusLabel(item)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-session-actions">
                        <AdminIconAction
                          tip="Move up"
                          ariaLabel="Move up"
                          disabled={index === 0 || busyId === item.id}
                          onClick={() => void reorder(index, index - 1)}
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </AdminIconAction>
                        <AdminIconAction
                          tip="Move down"
                          ariaLabel="Move down"
                          disabled={index === items.length - 1 || busyId === item.id}
                          onClick={() => void reorder(index, index + 1)}
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </AdminIconAction>
                      </div>
                    </td>
                    <td className="admin-sessions-actions-cell">
                      <div className="admin-session-actions">
                        <AdminIconAction
                          tip="Edit"
                          ariaLabel="Edit testimonial"
                          href={`/admin/testimonials/${item.id}/edit`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </AdminIconAction>
                        <AdminIconAction
                          tip={
                            item.visible
                              ? 'Hide'
                              : item.source === 'feedback'
                                ? 'Approve (show on site)'
                                : 'Show'
                          }
                          ariaLabel={
                            item.visible
                              ? 'Hide testimonial'
                              : item.source === 'feedback'
                                ? 'Approve testimonial'
                                : 'Show testimonial'
                          }
                          disabled={busyId === item.id}
                          onClick={() => void toggleVisible(item)}
                        >
                          {item.visible ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </AdminIconAction>
                        <AdminIconAction
                          tip="Delete"
                          ariaLabel="Delete testimonial"
                          danger
                          disabled={busyId === item.id}
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </AdminIconAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {items.map((item, index) => (
              <article key={item.id} className="admin-card space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-secondary)] text-xs font-bold">
                    {item.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(item.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {item.role || '—'}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span
                      className={`admin-session-status-dot ${statusDotClass(item)}`}
                      aria-hidden="true"
                    />
                    {statusLabel(item)}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm" title={item.quote}>
                  {item.quote}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Rating: {item.rating ?? '—'}
                  </span>
                  <div className="admin-session-actions">
                    <AdminIconAction
                      tip="Move up"
                      ariaLabel="Move up"
                      disabled={index === 0}
                      onClick={() => void reorder(index, index - 1)}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </AdminIconAction>
                    <AdminIconAction
                      tip="Move down"
                      ariaLabel="Move down"
                      disabled={index === items.length - 1}
                      onClick={() => void reorder(index, index + 1)}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </AdminIconAction>
                    <AdminIconAction
                      tip="Edit"
                      ariaLabel="Edit"
                      href={`/admin/testimonials/${item.id}/edit`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </AdminIconAction>
                    <AdminIconAction
                      tip={
                        item.visible
                          ? 'Hide'
                          : item.source === 'feedback'
                            ? 'Approve (show on site)'
                            : 'Show'
                      }
                      ariaLabel={
                        item.visible
                          ? 'Hide'
                          : item.source === 'feedback'
                            ? 'Approve'
                            : 'Show'
                      }
                      onClick={() => void toggleVisible(item)}
                    >
                      {item.visible ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </AdminIconAction>
                    <AdminIconAction
                      tip="Delete"
                      ariaLabel="Delete"
                      danger
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </AdminIconAction>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
      <AdminConfirmDialog
        open={Boolean(deleteId)}
        title="Delete this testimonial?"
        description="It will be removed from the website immediately. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
