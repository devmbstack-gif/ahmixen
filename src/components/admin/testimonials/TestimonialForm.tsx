'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AdminTestimonialDTO } from '@/lib/testimonials/serialize';
import { MediaField, type MediaPickerValue } from '../media/MediaPicker';
import { AdminToast } from '../AdminToast';

type FormState = {
  name: string;
  role: string;
  quote: string;
  rating: number | null;
  avatar: MediaPickerValue | null;
  visible: boolean;
};

function fromDto(item: AdminTestimonialDTO): FormState {
  return {
    name: item.name,
    role: item.role,
    quote: item.quote,
    rating: item.rating,
    avatar: item.avatarAssetId
      ? {
          id: item.avatarAssetId,
          url: item.avatarUrl || '',
          name: 'Photo',
          altText: '',
        }
      : null,
    visible: item.visible,
  };
}

const empty: FormState = {
  name: '',
  role: '',
  quote: '',
  rating: null,
  avatar: null,
  visible: true,
};

type Props = {
  mode: 'create' | 'edit';
  initial?: AdminTestimonialDTO | null;
};

export function TestimonialForm({ mode, initial }: Props) {
  const router = useRouter();
  const seed = initial ? fromDto(initial) : empty;
  const [form, setForm] = useState<FormState>(seed);
  const [baseline, setBaseline] = useState(() => JSON.stringify(seed));
  const version = initial?.version ?? 1;
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(form) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        quote: form.quote,
        rating: form.rating,
        avatarAssetId: form.avatar?.id ?? null,
        visible: form.visible,
        ...(mode === 'edit' ? { version } : {}),
      };
      const res = await fetch(
        mode === 'create'
          ? '/api/admin/testimonials'
          : `/api/admin/testimonials/${initial!.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        item?: AdminTestimonialDTO;
      };
      if (res.status === 409) {
        setToast({ message: 'This was changed elsewhere, reload', tone: 'error' });
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Could not save. Check the fields and try again.');
        return;
      }
      setBaseline(JSON.stringify(form));
      setToast({
        message: mode === 'create' ? 'Testimonial created' : 'Testimonial saved',
      });
      if (mode === 'create') {
        setForm(empty);
        setBaseline(JSON.stringify(empty));
      }
      window.setTimeout(() => router.push('/admin/testimonials'), 400);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {mode === 'create' ? 'New testimonial' : 'Edit testimonial'}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Reviews shown on the website.
        </p>
      </div>

      <div className="admin-card admin-session-form space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Name
            </span>
            <input
              className="admin-input h-10 w-full"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={80}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Role
            </span>
            <input
              className="admin-input h-10 w-full"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              maxLength={80}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            Quote
          </span>
          <textarea
            className="admin-input min-h-[120px] w-full py-2"
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            maxLength={400}
          />
          <span className="mt-1 block text-xs text-[var(--text-secondary)]">
            {form.quote.length}/400
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-[var(--text-secondary)]">
              Rating
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`nav-focus h-10 rounded-xl border px-3 text-sm ${
                  form.rating == null
                    ? 'border-[var(--bright-violet)] font-semibold'
                    : 'border-[var(--border-subtle)]'
                }`}
                onClick={() => setForm((f) => ({ ...f, rating: null }))}
              >
                No rating
              </button>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`nav-focus h-10 w-10 rounded-xl border text-sm ${
                    form.rating === n
                      ? 'border-[var(--bright-violet)] font-semibold'
                      : 'border-[var(--border-subtle)]'
                  }`}
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <MediaField
            value={form.avatar}
            onChange={(avatar) => setForm((f) => ({ ...f, avatar }))}
            helper="Optional photo shown in the admin list"
          />
        </div>

        <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) =>
              setForm((f) => ({ ...f, visible: e.target.checked }))
            }
          />
          <span className="text-sm">Visible on the website</span>
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
          <Link href="/admin/testimonials" className="admin-logout-btn nav-focus">
            Cancel
          </Link>
          <button
            type="button"
            className="btn-ahmixen nav-focus min-h-10 px-4"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  );
}
