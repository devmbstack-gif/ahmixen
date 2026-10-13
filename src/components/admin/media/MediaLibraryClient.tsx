'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Copy,
  Check,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { AdminMediaDTO } from '@/lib/media/serialize';
import type { MediaUsage } from '@/lib/media/usages';
import { prepareMediaImage } from '@/lib/media/imagePrepare';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { AdminIconAction } from '../AdminIconAction';
import { SearchInput } from '../SearchInput';
import { SkeletonMediaGrid, SkeletonRoot } from '../skeletons';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type DetailAsset = AdminMediaDTO & { usages?: MediaUsage[] };

type UploadRow = {
  id: string;
  name: string;
  status: 'preparing' | 'uploading' | 'done' | 'error';
  message?: string;
};

export function MediaLibraryClient() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AdminMediaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [detail, setDetail] = useState<DetailAsset | null>(null);
  const [name, setName] = useState('');
  const [altText, setAltText] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async (search: string) => {
    if (hasLoadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/media?q=${encodeURIComponent(search)}&page=1`
      );
      const data = (await res.json().catch(() => ({}))) as {
        items?: AdminMediaDTO[];
        error?: string;
      };
      if (!res.ok) {
        setToast({
          message: data.error || 'Could not load images',
          tone: 'error',
        });
        return;
      }
      setItems(data.items || []);
      hasLoadedOnce.current = true;
    } catch {
      setToast({
        message: 'Could not load images. Check your connection.',
        tone: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load('');
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(q), 280);
    return () => window.clearTimeout(t);
  }, [q, load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const openDetail = async (item: AdminMediaDTO) => {
    setDetail(item);
    setName(item.name);
    setAltText(item.altText);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`);
      const data = (await res.json().catch(() => ({}))) as {
        asset?: DetailAsset;
      };
      if (res.ok && data.asset) {
        setDetail(data.asset);
        setName(data.asset.name);
        setAltText(data.asset.altText);
      }
    } catch {
      /* keep list item */
    }
  };

  const saveDetail = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          altText,
          version: detail.version,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        asset?: AdminMediaDTO;
        error?: string;
      };
      if (res.status === 409) {
        setToast({
          message: 'This was changed elsewhere, reload',
          tone: 'error',
        });
        return;
      }
      if (!res.ok || !data.asset) {
        setToast({
          message: data.error || 'Could not save. Check the fields and try again.',
          tone: 'error',
        });
        return;
      }
      setDetail({ ...detail, ...data.asset });
      setItems((prev) =>
        prev.map((i) => (i.id === data.asset!.id ? { ...i, ...data.asset! } : i))
      );
      setToast({ message: 'Image details saved' });
    } finally {
      setSaving(false);
    }
  };

  const deleteDetail = async () => {
    if (!detail) return;
    setConfirmDelete(false);
    const res = await fetch(`/api/admin/media/${detail.id}`, { method: 'DELETE' });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      usages?: MediaUsage[];
    };
    if (res.status === 409) {
      const list = (data.usages || [])
        .map((u) => u.label)
        .join(', ');
      setToast({
        message: list
          ? `Still used in: ${list}. Remove it there first.`
          : data.error || 'This image is in use',
        tone: 'error',
      });
      return;
    }
    if (!res.ok) {
      setToast({
        message: data.error || 'Could not delete this image',
        tone: 'error',
      });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== detail.id));
    setDetail(null);
    setToast({ message: 'Image deleted' });
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      const rowId = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploads((u) => [
        ...u,
        { id: rowId, name: file.name, status: 'preparing' },
      ]);
      const prepared = await prepareMediaImage(file);
      if (!prepared.ok) {
        setUploads((u) =>
          u.map((r) =>
            r.id === rowId
              ? { ...r, status: 'error', message: prepared.message }
              : r
          )
        );
        continue;
      }
      setUploads((u) =>
        u.map((r) => (r.id === rowId ? { ...r, status: 'uploading' } : r))
      );
      const fd = new FormData();
      fd.append('file', prepared.file);
      fd.append('name', prepared.file.name.replace(/\.[^.]+$/, ''));
      try {
        const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
        const data = (await res.json().catch(() => ({}))) as {
          asset?: AdminMediaDTO;
          error?: string;
        };
        if (!res.ok || !data.asset) {
          setUploads((u) =>
            u.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    status: 'error',
                    message:
                      data.error ||
                      'Upload failed. Use JPEG, PNG or WebP under 5 MB.',
                  }
                : r
            )
          );
          continue;
        }
        setUploads((u) =>
          u.map((r) => (r.id === rowId ? { ...r, status: 'done' } : r))
        );
        setItems((prev) => [data.asset!, ...prev]);
      } catch {
        setUploads((u) =>
          u.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  status: 'error',
                  message: 'Upload failed. Check your connection.',
                }
              : r
          )
        );
      }
    }
    setToast({ message: 'Upload finished' });
  };

  const copyUrl = async () => {
    if (!detail?.url) return;
    try {
      const absolute =
        typeof window !== 'undefined'
          ? new URL(detail.url, window.location.origin).toString()
          : detail.url;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setToast({ message: 'Could not copy the link', tone: 'error' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Media</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Images used on the website.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void uploadFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn-ahmixen nav-focus inline-flex min-h-10 items-center gap-2 px-4"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload image
          </button>
        </div>
      </div>

      <SearchInput
        className="max-w-md"
        value={q}
        onChange={setQ}
        aria-label="Search images"
      />

      <div
        className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
      >
        Drop images here to upload (JPEG, PNG or WebP)
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
          {uploads.map((u) => (
            <li key={u.id}>
              {u.name}:{' '}
              {u.status === 'error' ? (
                <span className="text-red-600 dark:text-red-400">{u.message}</span>
              ) : (
                u.status
              )}
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <SkeletonRoot>
          <SkeletonMediaGrid />
        </SkeletonRoot>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No images yet. Upload one to get started.
        </p>
      ) : (
        <div
          className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6${
            refreshing ? ' admin-list-dimmed' : ''
          }`}
        >
          {items.map((item) => {
            const meta =
              item.kind === 'static'
                ? 'Existing site image'
                : [
                    formatBytes(item.size),
                    item.width && item.height
                      ? `${item.width}×${item.height}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
            return (
            <button
              key={item.id}
              type="button"
              className="nav-focus overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] text-left hover:border-[var(--bright-violet)]"
              onClick={() => void openDetail(item)}
            >
              <div className="flex aspect-square items-center justify-center bg-[var(--bg-secondary)] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="space-y-1 p-2">
                <div className="truncate text-sm font-medium">{item.name}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  {meta}
                </div>
                <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                  Used in {item.usageCount}
                </span>
              </div>
            </button>
            );
          })}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setDetail(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-detail-title"
            className="admin-card relative z-10 max-h-[min(92vh,800px)] w-full max-w-2xl overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="media-detail-title" className="text-lg font-bold">
                Image details
              </h2>
              <button
                type="button"
                className="admin-icon-btn nav-focus"
                aria-label="Close"
                onClick={() => setDetail(null)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 flex max-h-64 items-center justify-center rounded-xl bg-[var(--bg-secondary)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detail.url}
                alt={detail.altText || detail.name}
                className="max-h-60 max-w-full object-contain"
              />
            </div>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Name
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Alt text
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  maxLength={160}
                />
                <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                  Describe the image for people using screen readers
                </span>
              </label>
              <div>
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Public URL
                </span>
                <div className="flex gap-2">
                  <input
                    className="admin-input h-10 min-w-0 flex-1"
                    readOnly
                    value={detail.url}
                  />
                  <AdminIconAction
                    tip={copied ? 'Copied' : 'Copy URL'}
                    ariaLabel="Copy public URL"
                    onClick={() => void copyUrl()}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </AdminIconAction>
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Used in
                </span>
                {(detail.usages?.length ?? 0) === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Not used anywhere yet
                  </p>
                ) : (
                  <ul className="list-inside list-disc text-sm">
                    {detail.usages!.map((u) => (
                      <li key={u.href + u.label}>
                        <a href={u.href} className="nav-focus underline">
                          {u.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-between gap-2">
              <button
                type="button"
                className="nav-focus inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-600 px-4 font-semibold text-white"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete image
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="admin-logout-btn nav-focus"
                  onClick={() => setDetail(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-ahmixen nav-focus min-h-10 px-4"
                  disabled={saving}
                  onClick={() => void saveDetail()}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
      <AdminConfirmDialog
        open={confirmDelete}
        title="Delete this image?"
        description="This removes it from the media library. If it is used on the site, deletion will be blocked."
        confirmLabel="Delete image"
        danger
        onConfirm={() => void deleteDetail()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
