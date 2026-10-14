'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink, Pencil } from 'lucide-react';
import { AdminToast } from '../AdminToast';
import { SkeletonContentList } from '../skeletons';

type Item = {
  key: string;
  label: string;
  description: string;
  group: string;
  priority?: 'primary' | 'more';
  publicPath: string | null;
  publicAnchor: string | null;
  updatedAt: string | null;
  updatedByName: string;
};

function formatUpdated(at: string | null) {
  if (!at) return 'Not saved yet';
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return 'Last updated —';
  return `Last updated ${d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}`;
}

function SectionList({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const viewHref = item.publicPath
          ? `${item.publicPath}${item.publicAnchor || ''}`
          : null;
        return (
          <li
            key={item.key}
            className="admin-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{item.label}</div>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                {item.description}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                {formatUpdated(item.updatedAt)}
                {item.updatedByName ? ` · ${item.updatedByName}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {viewHref && (
                <a
                  href={viewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-icon-btn admin-session-icon-btn nav-focus"
                  aria-label={`View ${item.label} on site`}
                  title="View on site"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              <Link
                href={`/admin/content/${item.key}`}
                className="admin-icon-btn admin-session-icon-btn nav-focus"
                aria-label={`Edit ${item.label}`}
                title="Edit"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ContentListClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/content');
        const data = (await res.json().catch(() => ({}))) as {
          items?: Item[];
          error?: string;
        };
        if (!res.ok) {
          setToast({ message: data.error || 'Could not load sections', tone: 'error' });
          return;
        }
        setItems(data.items || []);
      } catch {
        setToast({ message: 'Could not load sections', tone: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const primary = items.filter((i) => (i.priority ?? 'primary') === 'primary');
  const more = items.filter((i) => i.priority === 'more');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Landing Content
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Edit the sections you change most often. Extra sections are under More.
        </p>
      </div>

      {loading ? (
        <SkeletonContentList />
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Main sections
            </h2>
            <SectionList items={primary} />
          </section>

          {more.length > 0 ? (
            <section className="space-y-2">
              <button
                type="button"
                className="admin-content-more-toggle nav-focus"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
              >
                <span>
                  More sections
                  <span className="text-[var(--text-muted)] font-normal">
                    {' '}
                    ({more.length})
                  </span>
                </span>
                <ChevronDown
                  className={`admin-nav-group-chevron${moreOpen ? ' is-open' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {moreOpen ? (
                <>
                  <p className="text-xs text-[var(--text-muted)] px-0.5">
                    Less-edited blocks — learn tabs, jobs stats, agenda, counters,
                    programs cards.
                  </p>
                  <SectionList items={more} />
                </>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  );
}
