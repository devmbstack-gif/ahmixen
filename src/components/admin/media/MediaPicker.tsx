'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { SearchInput } from '../SearchInput';
import { SkeletonMediaGrid, SkeletonRoot } from '../skeletons';
import type { AdminMediaDTO } from '@/lib/media/serialize';
import { prepareMediaImage } from '@/lib/media/imagePrepare';

export type MediaPickerValue = {
  id: string;
  url: string;
  name: string;
  altText: string;
};

type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (value: MediaPickerValue) => void;
};

type Tab = 'library' | 'upload';

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [tab, setTab] = useState<Tab>('library');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AdminMediaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/media?q=${encodeURIComponent(search)}&page=1`
      );
      const data = (await res.json().catch(() => ({}))) as {
        items?: AdminMediaDTO[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || 'Could not load images. Try again.');
        return;
      }
      setItems(data.items || []);
    } catch {
      setError('Could not load images. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void load(q);
  }, [open, load]); // eslint-disable-line react-hooks/exhaustive-deps -- search on open + manual

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => void load(q), 250);
    return () => window.clearTimeout(t);
  }, [q, open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of list) {
        setProgress(`Preparing ${file.name}…`);
        const prepared = await prepareMediaImage(file);
        if (!prepared.ok) {
          setError(prepared.message);
          continue;
        }
        setProgress(`Uploading ${prepared.file.name}…`);
        const fd = new FormData();
        fd.append('file', prepared.file);
        fd.append('name', prepared.file.name.replace(/\.[^.]+$/, ''));
        const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
        const data = (await res.json().catch(() => ({}))) as {
          asset?: AdminMediaDTO;
          error?: string;
        };
        if (!res.ok || !data.asset) {
          setError(data.error || 'Upload failed. Try a smaller JPEG, PNG or WebP.');
          continue;
        }
        onSelect({
          id: data.asset.id,
          url: data.asset.url,
          name: data.asset.name,
          altText: data.asset.altText,
        });
        onClose();
        return;
      }
      await load(q);
      setTab('library');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close media picker"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        className="admin-card relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-3xl flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h2 id="media-picker-title" className="text-lg font-bold">
              Choose an image
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Pick from the library or upload a new JPEG, PNG or WebP.
            </p>
          </div>
          <button
            type="button"
            className="admin-icon-btn nav-focus"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'library'}
            className={`nav-focus min-h-10 rounded-xl px-3 text-sm font-semibold ${
              tab === 'library'
                ? 'bg-[var(--card-bg-elevated)] text-[var(--text-main)]'
                : 'text-[var(--text-secondary)]'
            }`}
            onClick={() => setTab('library')}
          >
            Library
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'upload'}
            className={`nav-focus min-h-10 rounded-xl px-3 text-sm font-semibold ${
              tab === 'upload'
                ? 'bg-[var(--card-bg-elevated)] text-[var(--text-main)]'
                : 'text-[var(--text-secondary)]'
            }`}
            onClick={() => setTab('upload')}
          >
            Upload
          </button>
        </div>

        {tab === 'library' ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            <SearchInput
              value={q}
              onChange={setQ}
              aria-label="Search images"
            />
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <SkeletonRoot>
                  <SkeletonMediaGrid count={8} />
                </SkeletonRoot>
              ) : items.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No images yet. Switch to Upload to add one.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="nav-focus group overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-left"
                      onClick={() => {
                        onSelect({
                          id: item.id,
                          url: item.url,
                          name: item.name,
                          altText: item.altText,
                        });
                        onClose();
                      }}
                    >
                      <div className="flex aspect-square items-center justify-center bg-[var(--bg-primary)] p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="truncate px-2 py-1.5 text-xs font-medium">
                        {item.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              multiple
              onChange={(e) => {
                if (e.target.files) void uploadFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={uploading}
              className="nav-focus flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-secondary)] hover:border-[var(--bright-violet)]"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.length) {
                  void uploadFiles(e.dataTransfer.files);
                }
              }}
            >
              <Upload className="h-6 w-6" aria-hidden="true" />
              <span className="font-semibold text-[var(--text-main)]">
                Drop images here or browse
              </span>
              <span className="text-xs">JPEG, PNG or WebP · max 5 MB</span>
            </button>
            {progress && (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{progress}</p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end border-t border-[var(--border-subtle)] pt-3">
          <button type="button" className="admin-logout-btn nav-focus" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

type MediaFieldProps = {
  value: MediaPickerValue | null;
  onChange: (value: MediaPickerValue | null) => void;
  helper?: string;
  label?: string;
};

export function MediaField({
  value,
  onChange,
  helper,
  label = 'Photo',
}: MediaFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </div>
      {helper && (
        <p className="mb-2 text-xs text-[var(--text-secondary)]">{helper}</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          {value?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImagePlus className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="admin-logout-btn nav-focus"
            onClick={() => setOpen(true)}
          >
            {value ? 'Change photo' : 'Choose photo'}
          </button>
          {value && (
            <button
              type="button"
              className="admin-logout-btn nav-focus text-red-600 dark:text-red-400"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(v) => onChange(v)}
      />
    </div>
  );
}
