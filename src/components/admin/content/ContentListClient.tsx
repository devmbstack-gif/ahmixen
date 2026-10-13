'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import { AdminToast } from '../AdminToast';
import { SkeletonContentList } from '../skeletons';

type Item = {
  key: string;
  label: string;
  description: string;
  group: string;
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

function Group({
  title,
  items,
}: {
  title: string;
  items: Item[];
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {title}
      </h2>
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
    </section>
  );
}

export function ContentListClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
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

  const home = items.filter((i) => i.group === 'home');
  const programs = items.filter((i) => i.group === 'programs');
  const all = items.filter((i) => i.group === 'all');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Landing Content
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Text, images and video shown on the public pages.
        </p>
      </div>

      {loading ? (
        <SkeletonContentList />
      ) : (
        <>
          <Group title="Home page" items={home} />
          <Group title="Programs page" items={programs} />
          <Group title="All pages" items={all} />
        </>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  );
}
