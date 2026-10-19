'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { getVideoSource } from '@/lib/video';
import { MediaField, type MediaPickerValue } from '../media/MediaPicker';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { AdminIconAction } from '../AdminIconAction';
import { SkeletonForm } from '../skeletons';
import { DEFAULT_HERO_TOOLS } from '@/lib/content/landingSchemas';
import { formatMoneyLabel } from '@/lib/plans/money';
import type { AdminPlanDTO } from '@/lib/plans/serialize';

type Props = { contentKey: string };

type PlanOption = {
  id: string;
  name: string;
  priceLabel: string;
  isLandingPlan: boolean;
  isWorkshopPlan: boolean;
  status: string;
  type: string;
  displayStatus: string;
};

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className="mt-1 block text-xs text-[var(--text-secondary)]">
      {value.length}/{max}
    </span>
  );
}

export function ContentEditorClient({ contentKey }: Props) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState(1);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [baseline, setBaseline] = useState('');
  const [meta, setMeta] = useState({ updatedAt: null as string | null, by: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [poster, setPoster] = useState<MediaPickerValue | null>(null);
  const [cardPosters, setCardPosters] = useState<Record<string, MediaPickerValue | null>>(
    {}
  );
  const [toolLogos, setToolLogos] = useState<Record<string, MediaPickerValue | null>>(
    {}
  );
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  const dirty = data ? JSON.stringify(data) !== baseline : false;

  useEffect(() => {
    if (contentKey !== 'programs') {
      setPlanOptions([]);
      setPlansLoading(false);
      setPlansError(null);
      return;
    }

    let cancelled = false;
    setPlansLoading(true);
    setPlansError(null);

    void (async () => {
      try {
        const res = await fetch('/api/admin/plans?status=active');
        const json = (await res.json().catch(() => ({}))) as {
          plans?: AdminPlanDTO[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setPlanOptions([]);
          setPlansError(json.error || 'Could not load pricing plans');
          return;
        }
        const plans = Array.isArray(json.plans) ? json.plans : [];
        setPlanOptions(
          plans.map((p) => ({
            id: p.id,
            name: p.name,
            priceLabel: formatMoneyLabel(p.currency, p.price),
            isLandingPlan: Boolean(p.isLandingPlan),
            isWorkshopPlan: Boolean(p.isWorkshopPlan),
            status: p.status,
            type: p.type,
            displayStatus: p.displayStatus,
          }))
        );
      } catch {
        if (!cancelled) {
          setPlanOptions([]);
          setPlansError('Could not load pricing plans');
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contentKey]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/admin/content/${contentKey}`);
        const json = (await res.json().catch(() => ({}))) as {
          label?: string;
          description?: string;
          version?: number;
          data?: Record<string, unknown>;
          updatedAt?: string | null;
          updatedByName?: string;
          error?: string;
        };
        if (!res.ok || !json.data) {
          setError(json.error || 'Could not load this section');
          return;
        }
        setLabel(json.label || contentKey);
        setDescription(json.description || '');
        setVersion(json.version || 1);

        let loaded = { ...json.data };
        if (contentKey === 'hero') {
          if (
            typeof loaded.mainHeadlineLine1 !== 'string' ||
            !String(loaded.mainHeadlineLine1).trim()
          ) {
            loaded = { ...loaded, mainHeadlineLine1: 'BECOME A CERTIFIED AI' };
          }
          if (
            typeof loaded.mainHeadlineLine2 !== 'string' ||
            !String(loaded.mainHeadlineLine2).trim()
          ) {
            loaded = { ...loaded, mainHeadlineLine2: 'EXPERT IN 90 DAYS' };
          }
          if (!Array.isArray(loaded.tools) || loaded.tools.length === 0) {
            loaded = {
              ...loaded,
              toolsTitle:
                typeof loaded.toolsTitle === 'string' && loaded.toolsTitle.trim()
                  ? loaded.toolsTitle
                  : "Tools you'll master",
              tools: structuredClone(DEFAULT_HERO_TOOLS),
            };
          } else if (
            typeof loaded.toolsTitle !== 'string' ||
            !String(loaded.toolsTitle).trim()
          ) {
            loaded = { ...loaded, toolsTitle: "Tools you'll master" };
          }
        }

        setData(loaded);
        setBaseline(JSON.stringify(loaded));
        setMeta({
          updatedAt: json.updatedAt ?? null,
          by: json.updatedByName || '',
        });

        if (contentKey === 'hero') {
          const tools =
            (loaded.tools as Array<{ id: string; logoAssetId?: string | null }>) ||
            [];
          const map: Record<string, MediaPickerValue | null> = {};
          for (const t of tools) {
            if (t.logoAssetId) {
              const m = await fetch(`/api/admin/media/${t.logoAssetId}`).then((r) =>
                r.json()
              );
              map[t.id] = m.asset
                ? {
                    id: m.asset.id,
                    url: m.asset.url,
                    name: m.asset.name,
                    altText: m.asset.altText,
                  }
                : null;
            } else {
              map[t.id] = null;
            }
          }
          setToolLogos(map);
        }

        if (contentKey === 'preview') {
          const id = (json.data.posterAssetId as string) || '';
          if (id) {
            const m = await fetch(`/api/admin/media/${id}`).then((r) => r.json());
            if (m.asset) {
              setPoster({
                id: m.asset.id,
                url: m.asset.url,
                name: m.asset.name,
                altText: m.asset.altText,
              });
            }
          }
        }
        if (contentKey === 'intro') {
          const id = (json.data.photoAssetId as string) || '';
          if (id) {
            const m = await fetch(`/api/admin/media/${id}`).then((r) => r.json());
            if (m.asset) {
              setPoster({
                id: m.asset.id,
                url: m.asset.url,
                name: m.asset.name,
                altText: m.asset.altText,
              });
            }
          } else {
            setPoster(null);
          }
        }
        if (contentKey === 'programs') {
          const cards = (json.data.cards as Array<{ id: string; posterAssetId?: string; image?: string }>) || [];
          const map: Record<string, MediaPickerValue | null> = {};
          for (const c of cards) {
            if (c.posterAssetId) {
              const m = await fetch(`/api/admin/media/${c.posterAssetId}`).then((r) =>
                r.json()
              );
              map[c.id] = m.asset
                ? {
                    id: m.asset.id,
                    url: m.asset.url,
                    name: m.asset.name,
                    altText: m.asset.altText,
                  }
                : null;
            } else if (c.image) {
              map[c.id] = { id: '', url: c.image, name: 'Image', altText: '' };
            } else {
              map[c.id] = null;
            }
          }
          setCardPosters(map);
        }
      } catch {
        setError('Could not load this section');
      } finally {
        setLoading(false);
      }
    })();
  }, [contentKey]);

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

  const videoHint = useMemo(() => {
    if (contentKey !== 'preview' || !data) return null;
    const url = String(data.videoUrl || '');
    if (!url.trim()) return null;
    const src = getVideoSource(url);
    if (!src) {
      return {
        ok: false as const,
        text: 'Use a YouTube/Vimeo link or an .mp4/.webm path',
      };
    }
    return {
      ok: true as const,
      text:
        src.type === 'youtube'
          ? `YouTube video detected (${src.id})`
          : src.type === 'vimeo'
            ? `Vimeo video detected (${src.id})`
            : 'Local video file detected',
    };
  }, [contentKey, data]);

  const patch = (partial: Record<string, unknown>) => {
    setData((d) => (d ? { ...d, ...partial } : d));
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      let payload = { ...data };
      if (contentKey === 'preview') {
        payload = {
          ...payload,
          posterAssetId: poster?.id || null,
        };
      }
      if (contentKey === 'intro') {
        payload = {
          ...payload,
          photoAssetId: poster?.id || null,
        };
      }
      if (contentKey === 'programs') {
        const cards = ((payload.cards as Array<Record<string, unknown>>) || []).map(
          (c) => {
            const rawPlan = c.planId;
            const planId =
              typeof rawPlan === 'string' && /^[a-f\d]{24}$/i.test(rawPlan)
                ? rawPlan
                : null;
            return {
              ...c,
              planId,
              status: c.status === 'open' ? 'open' : 'locked',
              priceLabel: typeof c.priceLabel === 'string' ? c.priceLabel : '',
              posterAssetId: cardPosters[String(c.id)]?.id || null,
              image:
                cardPosters[String(c.id)]?.id
                  ? undefined
                  : cardPosters[String(c.id)]?.url || c.image,
            };
          }
        );
        payload = { ...payload, cards };
      }
      if (contentKey === 'hero') {
        const tools = ((payload.tools as Array<Record<string, unknown>>) || []).map(
          (t) => ({
            ...t,
            logoAssetId: toolLogos[String(t.id)]?.id || null,
          })
        );
        payload = { ...payload, tools };
      }

      const res = await fetch(`/api/admin/content/${contentKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, data: payload }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        version?: number;
        data?: Record<string, unknown>;
        updatedAt?: string | null;
        updatedByName?: string;
      };
      if (res.status === 409) {
        setToast({ message: 'This was changed elsewhere, reload', tone: 'error' });
        return;
      }
      if (!res.ok) {
        setError(json.error || 'Could not save. Check the fields and try again.');
        return;
      }
      setVersion(json.version || version + 1);
      if (json.data) {
        setData(json.data);
        setBaseline(JSON.stringify(json.data));
      } else {
        setBaseline(JSON.stringify(payload));
      }
      setMeta({
        updatedAt: json.updatedAt ?? null,
        by: json.updatedByName || '',
      });
      setToast({ message: 'Saved' });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setConfirmReset(false);
    const res = await fetch(`/api/admin/content/${contentKey}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      version?: number;
      data?: Record<string, unknown>;
      updatedAt?: string | null;
      updatedByName?: string;
    };
    if (res.status === 409) {
      setToast({ message: 'This was changed elsewhere, reload', tone: 'error' });
      return;
    }
    if (!res.ok || !json.data) {
      setToast({ message: json.error || 'Could not reset', tone: 'error' });
      return;
    }
    setData(json.data);
    setBaseline(JSON.stringify(json.data));
    setVersion(json.version || version + 1);
    setMeta({
      updatedAt: json.updatedAt ?? null,
      by: json.updatedByName || '',
    });
    setPoster(null);
    setToast({ message: 'Restored the default content' });
  };

  if (loading) {
    return <SkeletonForm fields={8} />;
  }
  if (!data) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        {error || 'Not found'}
      </p>
    );
  }

  const list = (key: string) =>
    (Array.isArray(data[key]) ? data[key] : []) as Array<Record<string, unknown>>;

  const setList = (key: string, next: Array<Record<string, unknown>>) => {
    patch({ [key]: next });
  };

  const moveItem = (key: string, index: number, dir: -1 | 1) => {
    const arr = [...list(key)];
    const to = index + dir;
    if (to < 0 || to >= arr.length) return;
    const tmp = arr[index]!;
    arr[index] = arr[to]!;
    arr[to] = tmp;
    setList(key, arr);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{label}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {meta.updatedAt
            ? `Last updated ${new Date(meta.updatedAt).toLocaleString()}${
                meta.by ? ` by ${meta.by}` : ''
              }`
            : 'Not saved yet'}
        </p>
      </div>

      <div className="admin-card admin-session-form space-y-4">
        {contentKey === 'intro' && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Badge
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.badge || '')}
                maxLength={40}
                onChange={(e) => patch({ badge: e.target.value })}
              />
              <CharCount value={String(data.badge || '')} max={40} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Headline accent (gradient)
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.headlineAccent || '')}
                  maxLength={30}
                  onChange={(e) => patch({ headlineAccent: e.target.value })}
                />
                <CharCount value={String(data.headlineAccent || '')} max={30} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Headline main
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.headlineMain || '')}
                  maxLength={40}
                  onChange={(e) => patch({ headlineMain: e.target.value })}
                />
                <CharCount value={String(data.headlineMain || '')} max={40} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Subtext
              </span>
              <textarea
                className="admin-input min-h-[5.5rem] w-full resize-y py-2"
                value={String(data.subtext || '')}
                maxLength={200}
                onChange={(e) => patch({ subtext: e.target.value })}
              />
              <CharCount value={String(data.subtext || '')} max={200} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Primary button label
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.primaryCtaLabel || '')}
                  maxLength={30}
                  onChange={(e) => patch({ primaryCtaLabel: e.target.value })}
                />
                <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                  Links to /programs
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Secondary button label
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.secondaryCtaLabel || '')}
                  maxLength={30}
                  onChange={(e) => patch({ secondaryCtaLabel: e.target.value })}
                />
                <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                  Scrolls to the workshop hero (#hero)
                </span>
              </label>
            </div>
            <MediaField
              label="Hero photo"
              value={poster}
              onChange={setPoster}
              helper="Optional. If empty, the instructor photo is used."
            />
          </>
        )}

        {contentKey === 'hero' && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Top line 1
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.headlineLine1 || '')}
                maxLength={140}
                onChange={(e) => patch({ headlineLine1: e.target.value })}
              />
              <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                Hook line above the main title. Optional {'{duration}'} fills session length.
              </span>
              <CharCount value={String(data.headlineLine1 || '')} max={140} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Top line 2 (muted, optional)
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.headlineLine2 || '')}
                maxLength={80}
                onChange={(e) => patch({ headlineLine2: e.target.value })}
              />
              <CharCount value={String(data.headlineLine2 || '')} max={80} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Main headline 1
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.mainHeadlineLine1 || '')}
                maxLength={60}
                onChange={(e) => patch({ mainHeadlineLine1: e.target.value })}
              />
              <CharCount value={String(data.mainHeadlineLine1 || '')} max={60} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Main headline 2 (gradient)
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.mainHeadlineLine2 || '')}
                maxLength={60}
                onChange={(e) => patch({ mainHeadlineLine2: e.target.value })}
              />
              <CharCount value={String(data.mainHeadlineLine2 || '')} max={60} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Subtext
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.badgeText || '')}
                  maxLength={220}
                  onChange={(e) => patch({ badgeText: e.target.value })}
                />
                <CharCount value={String(data.badgeText || '')} max={220} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Subtext suffix
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.badgeSuffix || '')}
                  maxLength={60}
                  onChange={(e) => patch({ badgeSuffix: e.target.value })}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Primary button label
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.primaryCtaLabel || '')}
                  maxLength={30}
                  onChange={(e) => patch({ primaryCtaLabel: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Secondary link label
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.secondaryLinkLabel || '')}
                  maxLength={30}
                  onChange={(e) => patch({ secondaryLinkLabel: e.target.value })}
                />
              </label>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Program Format / Length / Topic cards are fixed on the site. Countdown
              and seats come from Live Sessions.
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Tools section title
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.toolsTitle || '')}
                maxLength={40}
                onChange={(e) => patch({ toolsTitle: e.target.value })}
              />
              <CharCount value={String(data.toolsTitle || '')} max={40} />
            </label>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                Tools you&apos;ll master ({list('tools').length}/8)
              </p>
              <button
                type="button"
                className="admin-logout-btn nav-focus inline-flex items-center gap-1"
                disabled={list('tools').length >= 8}
                onClick={() => {
                  const id = `tool-${Date.now()}`;
                  setList('tools', [
                    ...list('tools'),
                    { id, name: '', logoAssetId: null },
                  ]);
                  setToolLogos((m) => ({ ...m, [id]: null }));
                }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add tool
              </button>
            </div>
            {list('tools').map((tool, index) => (
              <div
                key={String(tool.id)}
                className="space-y-2 rounded-xl border border-[var(--border-subtle)] p-3"
              >
                <div className="flex justify-end gap-1">
                  <AdminIconAction
                    tip="Move up"
                    ariaLabel="Move up"
                    disabled={index === 0}
                    onClick={() => moveItem('tools', index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Move down"
                    ariaLabel="Move down"
                    disabled={index === list('tools').length - 1}
                    onClick={() => moveItem('tools', index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Remove"
                    ariaLabel="Remove"
                    danger
                    disabled={list('tools').length <= 1}
                    onClick={() => {
                      const id = String(tool.id);
                      setList(
                        'tools',
                        list('tools').filter((_, i) => i !== index)
                      );
                      setToolLogos((m) => {
                        const next = { ...m };
                        delete next[id];
                        return next;
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                </div>
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Tool name"
                  value={String(tool.name || '')}
                  maxLength={40}
                  onChange={(e) => {
                    const tools = [...list('tools')];
                    tools[index] = { ...tool, name: e.target.value };
                    setList('tools', tools);
                  }}
                />
                <MediaField
                  label="Logo"
                  value={toolLogos[String(tool.id)] || null}
                  onChange={(v) =>
                    setToolLogos((m) => ({ ...m, [String(tool.id)]: v }))
                  }
                />
              </div>
            ))}
          </>
        )}

        {contentKey === 'preview' && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Heading
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.heading || '')}
                maxLength={60}
                onChange={(e) => patch({ heading: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Video link
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.videoUrl || '')}
                placeholder="/intro-video.mp4 or https://www.youtube.com/watch?v=…"
                onChange={(e) => patch({ videoUrl: e.target.value })}
              />
              <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                Empty falls back to /intro-video.mp4 on the landing page.
              </span>
              {videoHint && (
                <p
                  className={`mt-1 text-xs ${
                    videoHint.ok
                      ? 'text-[var(--text-secondary)]'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {videoHint.text}
                </p>
              )}
            </label>
            <MediaField
              label="Poster image"
              value={poster}
              onChange={setPoster}
              helper="Optional cover image for the preview card"
            />
          </>
        )}

        {contentKey === 'learn' && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Eyebrow
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.eyebrow || '')}
                maxLength={30}
                onChange={(e) => patch({ eyebrow: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Heading
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.heading || '')}
                maxLength={80}
                onChange={(e) => patch({ heading: e.target.value })}
              />
              <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                Tip: use an em dash (—) before the emphasized words if you want the same look as
                today.
              </span>
            </label>
            <p className="text-xs text-[var(--text-secondary)]">
              6 of 6 topics (fixed). Icons stay tied to each topic and are not editable here.
            </p>
            {list('items').map((item, index) => (
              <div
                key={String(item.id)}
                className="space-y-2 rounded-xl border border-[var(--border-subtle)] p-3"
              >
                <div className="text-xs font-semibold text-[var(--text-secondary)]">
                  Topic {index + 1} · {String(item.id)}
                </div>
                <input
                  className="admin-input h-10 w-full"
                  value={String(item.title || '')}
                  maxLength={40}
                  onChange={(e) => {
                    const items = [...list('items')];
                    items[index] = { ...item, title: e.target.value };
                    setList('items', items);
                  }}
                />
                <textarea
                  className="admin-input min-h-[72px] w-full py-2"
                  value={String(item.description || '')}
                  maxLength={120}
                  onChange={(e) => {
                    const items = [...list('items')];
                    items[index] = { ...item, description: e.target.value };
                    setList('items', items);
                  }}
                />
                <CharCount value={String(item.description || '')} max={120} />
              </div>
            ))}
          </>
        )}

        {contentKey === 'aiJobs' && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Eyebrow
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.eyebrow || '')}
                maxLength={40}
                onChange={(e) => patch({ eyebrow: e.target.value })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Heading
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.headingBefore || '')}
                  maxLength={60}
                  onChange={(e) => patch({ headingBefore: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Accent words
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.headingAccent || '')}
                  maxLength={40}
                  onChange={(e) => patch({ headingAccent: e.target.value })}
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">
                {list('items').length} of 6 · Every statistic needs a real source.
              </span>
              <button
                type="button"
                className="admin-logout-btn nav-focus inline-flex items-center gap-1"
                disabled={list('items').length >= 6}
                onClick={() =>
                  setList('items', [
                    ...list('items'),
                    {
                      publisher: '',
                      number: 0,
                      prefix: '',
                      suffix: '',
                      headline: '',
                      url: 'https://',
                    },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            </div>
            {list('items').map((item, index) => (
              <div
                key={index}
                className="space-y-2 rounded-xl border border-[var(--border-subtle)] p-3"
              >
                <div className="flex justify-end gap-1">
                  <AdminIconAction
                    tip="Move up"
                    ariaLabel="Move up"
                    disabled={index === 0}
                    onClick={() => moveItem('items', index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Move down"
                    ariaLabel="Move down"
                    disabled={index === list('items').length - 1}
                    onClick={() => moveItem('items', index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Remove"
                    ariaLabel="Remove"
                    danger
                    disabled={list('items').length <= 1}
                    onClick={() =>
                      setList(
                        'items',
                        list('items').filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="admin-input h-10"
                    placeholder="Publisher"
                    value={String(item.publisher || '')}
                    onChange={(e) => {
                      const items = [...list('items')];
                      items[index] = { ...item, publisher: e.target.value };
                      setList('items', items);
                    }}
                  />
                  <input
                    className="admin-input h-10"
                    placeholder="Number"
                    type="number"
                    value={Number(item.number) || 0}
                    onChange={(e) => {
                      const items = [...list('items')];
                      items[index] = {
                        ...item,
                        number: Number(e.target.value) || 0,
                      };
                      setList('items', items);
                    }}
                  />
                  <input
                    className="admin-input h-10"
                    placeholder="Prefix"
                    value={String(item.prefix || '')}
                    onChange={(e) => {
                      const items = [...list('items')];
                      items[index] = { ...item, prefix: e.target.value };
                      setList('items', items);
                    }}
                  />
                  <input
                    className="admin-input h-10"
                    placeholder="Suffix"
                    value={String(item.suffix || '')}
                    onChange={(e) => {
                      const items = [...list('items')];
                      items[index] = { ...item, suffix: e.target.value };
                      setList('items', items);
                    }}
                  />
                </div>
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Headline"
                  value={String(item.headline || '')}
                  onChange={(e) => {
                    const items = [...list('items')];
                    items[index] = { ...item, headline: e.target.value };
                    setList('items', items);
                  }}
                />
                <input
                  className="admin-input h-10 w-full"
                  placeholder="https:// source URL"
                  value={String(item.url || '')}
                  onChange={(e) => {
                    const items = [...list('items')];
                    items[index] = { ...item, url: e.target.value };
                    setList('items', items);
                  }}
                />
              </div>
            ))}
          </>
        )}

        {contentKey === 'agenda' && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Heading
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.heading || '')}
                maxLength={60}
                onChange={(e) => patch({ heading: e.target.value })}
              />
            </label>
            <p className="text-xs text-[var(--text-secondary)]">
              Curriculum roadmap cards on the home page. Category defaults to
              &quot;AI AUTOMATION&quot;. Coming-soon blur is disabled — visitors
              always see this roadmap.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">
                {list('items').length} of 12
              </span>
              <button
                type="button"
                className="admin-logout-btn nav-focus inline-flex items-center gap-1"
                disabled={list('items').length >= 12}
                onClick={() =>
                  setList('items', [
                    ...list('items'),
                    {
                      id: `module-${Date.now()}`,
                      moduleNumber: String(list('items').length + 1).padStart(2, '0'),
                      timeRange: '',
                      durationMin: '',
                      title: '',
                      summary: '',
                      category: 'AI AUTOMATION',
                    },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            </div>
            {list('items').map((item, index) => (
              <div
                key={String(item.id)}
                className="space-y-2 rounded-xl border border-[var(--border-subtle)] p-3"
              >
                <div className="flex justify-end gap-1">
                  <AdminIconAction
                    tip="Move up"
                    ariaLabel="Move up"
                    disabled={index === 0}
                    onClick={() => moveItem('items', index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Move down"
                    ariaLabel="Move down"
                    disabled={index === list('items').length - 1}
                    onClick={() => moveItem('items', index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Remove"
                    ariaLabel="Remove"
                    danger
                    disabled={list('items').length <= 1}
                    onClick={() =>
                      setList(
                        'items',
                        list('items').filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    className="admin-input h-10"
                    placeholder="01"
                    value={String(item.moduleNumber || '')}
                    onChange={(e) => {
                      const items = [...list('items')];
                      items[index] = { ...item, moduleNumber: e.target.value };
                      setList('items', items);
                    }}
                  />
                  <input
                    className="admin-input h-10"
                    placeholder="Time range"
                    value={String(item.timeRange || '')}
                    onChange={(e) => {
                      const items = [...list('items')];
                      items[index] = { ...item, timeRange: e.target.value };
                      setList('items', items);
                    }}
                  />
                  <input
                    className="admin-input h-10"
                    placeholder="Duration"
                    value={String(item.durationMin || '')}
                    onChange={(e) => {
                      const items = [...list('items')];
                      items[index] = { ...item, durationMin: e.target.value };
                      setList('items', items);
                    }}
                  />
                </div>
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Title"
                  value={String(item.title || '')}
                  onChange={(e) => {
                    const items = [...list('items')];
                    items[index] = { ...item, title: e.target.value };
                    setList('items', items);
                  }}
                />
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Category (e.g. AI AUTOMATION)"
                  value={String(item.category || 'AI AUTOMATION')}
                  maxLength={40}
                  onChange={(e) => {
                    const items = [...list('items')];
                    items[index] = { ...item, category: e.target.value };
                    setList('items', items);
                  }}
                />
                <textarea
                  className="admin-input min-h-[72px] w-full py-2"
                  placeholder="Description"
                  value={String(item.summary || '')}
                  maxLength={200}
                  onChange={(e) => {
                    const items = [...list('items')];
                    items[index] = { ...item, summary: e.target.value };
                    setList('items', items);
                  }}
                />
              </div>
            ))}
          </>
        )}

        {contentKey === 'stats' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">
                {list('items').length} of 6
              </span>
              <button
                type="button"
                className="admin-logout-btn nav-focus inline-flex items-center gap-1"
                disabled={list('items').length >= 6}
                onClick={() =>
                  setList('items', [
                    ...list('items'),
                    {
                      id: `stat-${Date.now()}`,
                      value: 0,
                      suffix: '+',
                      label: '',
                    },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            </div>
            {list('items').map((item, index) => {
              const linkedTrained = String(item.id) === 'trained';
              return (
              <div
                key={String(item.id)}
                className="space-y-2 rounded-xl border border-[var(--border-subtle)] p-3"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  className="admin-input h-10"
                  type="number"
                  value={Number(item.value) || 0}
                  readOnly={linkedTrained}
                  disabled={linkedTrained}
                  onChange={(e) => {
                    if (linkedTrained) return;
                    const items = [...list('items')];
                    items[index] = {
                      ...item,
                      value: Number(e.target.value) || 0,
                    };
                    setList('items', items);
                  }}
                />
                <input
                  className="admin-input h-10"
                  placeholder="Suffix"
                  value={String(item.suffix || '')}
                  readOnly={linkedTrained}
                  disabled={linkedTrained}
                  onChange={(e) => {
                    if (linkedTrained) return;
                    const items = [...list('items')];
                    items[index] = { ...item, suffix: e.target.value };
                    setList('items', items);
                  }}
                />
                <input
                  className="admin-input h-10"
                  placeholder="Label"
                  value={String(item.label || '')}
                  onChange={(e) => {
                    const items = [...list('items')];
                    items[index] = { ...item, label: e.target.value };
                    setList('items', items);
                  }}
                />
                <div className="admin-session-actions">
                  <AdminIconAction
                    tip="Move up"
                    ariaLabel="Move up"
                    disabled={index === 0}
                    onClick={() => moveItem('items', index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Move down"
                    ariaLabel="Move down"
                    disabled={index === list('items').length - 1}
                    onClick={() => moveItem('items', index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Remove"
                    ariaLabel="Remove"
                    danger
                    disabled={list('items').length <= 1}
                    onClick={() =>
                      setList(
                        'items',
                        list('items').filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                </div>
                </div>
                {linkedTrained && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Linked to the Instructor page. Edit it there.
                  </p>
                )}
              </div>
              );
            })}
          </>
        )}

        {contentKey === 'pricing' && (
          <>
            <p className="text-xs text-[var(--text-secondary)]">
              Price, features and plan name come from Pricing Plans.
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Badge
              </span>
              <input
                className="admin-input h-10 w-full"
                value={String(data.badge || '')}
                maxLength={20}
                onChange={(e) => patch({ badge: e.target.value })}
              />
              <CharCount value={String(data.badge || '')} max={20} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Heading line 1
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.headingLine1 || '')}
                  maxLength={40}
                  onChange={(e) => patch({ headingLine1: e.target.value })}
                />
                <CharCount value={String(data.headingLine1 || '')} max={40} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                  Heading line 2 (gradient)
                </span>
                <input
                  className="admin-input h-10 w-full"
                  value={String(data.headingLine2 || '')}
                  maxLength={40}
                  onChange={(e) => patch({ headingLine2: e.target.value })}
                />
                <CharCount value={String(data.headingLine2 || '')} max={40} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Subtext
              </span>
              <textarea
                className="admin-input min-h-[72px] w-full py-2"
                value={String(data.subtext || '')}
                maxLength={120}
                onChange={(e) => patch({ subtext: e.target.value })}
              />
              <CharCount value={String(data.subtext || '')} max={120} />
            </label>
          </>
        )}

        {contentKey === 'programs' && (
          <>
            <p className="text-xs text-[var(--text-secondary)]">
              Link each open program to a Pricing plan for checkout (Workshop,
              Mentorship, or Accelerator). Create active one-time plans under
              Admin → Pricing first. The Pricing section on the site shows the
              same plans for enroll.
            </p>
            {plansError ? (
              <p className="text-xs text-red-400">{plansError}</p>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">
                {list('cards').length} of 8
              </span>
              <button
                type="button"
                className="admin-logout-btn nav-focus inline-flex items-center gap-1"
                disabled={list('cards').length >= 8}
                onClick={() => {
                  const id = `course-${Date.now()}`;
                  setList('cards', [
                    ...list('cards'),
                    {
                      id,
                      title: '',
                      instructorLine: 'Ahmi',
                      badges: ['Live Session'],
                      posterAssetId: null,
                      href: '/#programs',
                      status: 'locked',
                      priceLabel: '',
                      planId: null,
                    },
                  ]);
                  setCardPosters((m) => ({ ...m, [id]: null }));
                }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            </div>
            {list('cards').map((card, index) => {
              const planId =
                typeof card.planId === 'string' && card.planId
                  ? String(card.planId)
                  : '';
              const selectedPlan = planOptions.find((p) => p.id === planId);
              // Programs checkout: any active one-time plan (incl. Mentorship).
              const workshopPlans = planOptions.filter(
                (p) =>
                  p.type === 'one_time' &&
                  p.status === 'active' &&
                  p.displayStatus !== 'expired'
              );
              const status = card.status === 'open' ? 'open' : 'locked';
              const orphanPlanId =
                Boolean(planId) &&
                !selectedPlan &&
                !plansLoading &&
                !plansError;

              return (
              <div
                key={String(card.id)}
                className="space-y-2 rounded-xl border border-[var(--border-subtle)] p-3"
              >
                <div className="flex justify-end gap-1">
                  <AdminIconAction
                    tip="Move up"
                    ariaLabel="Move up"
                    disabled={index === 0}
                    onClick={() => moveItem('cards', index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Move down"
                    ariaLabel="Move down"
                    disabled={index === list('cards').length - 1}
                    onClick={() => moveItem('cards', index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                  <AdminIconAction
                    tip="Remove"
                    ariaLabel="Remove"
                    danger
                    disabled={list('cards').length <= 1}
                    onClick={() =>
                      setList(
                        'cards',
                        list('cards').filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </AdminIconAction>
                </div>
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Title"
                  value={String(card.title || '')}
                  onChange={(e) => {
                    const cards = [...list('cards')];
                    cards[index] = { ...card, title: e.target.value };
                    setList('cards', cards);
                  }}
                />
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Instructor line"
                  value={String(card.instructorLine || '')}
                  onChange={(e) => {
                    const cards = [...list('cards')];
                    cards[index] = { ...card, instructorLine: e.target.value };
                    setList('cards', cards);
                  }}
                />
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Badges (comma separated)"
                  value={(Array.isArray(card.badges) ? card.badges : []).join(', ')}
                  onChange={(e) => {
                    const cards = [...list('cards')];
                    cards[index] = {
                      ...card,
                      badges: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    };
                    setList('cards', cards);
                  }}
                />
                <label className="block space-y-1">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Status
                  </span>
                  <select
                    className="admin-input h-10 w-full"
                    value={status}
                    onChange={(e) => {
                      const cards = [...list('cards')];
                      cards[index] = {
                        ...card,
                        status: e.target.value === 'open' ? 'open' : 'locked',
                      };
                      setList('cards', cards);
                    }}
                  >
                    <option value="open">Open (clickable / reserve)</option>
                    <option value="locked">Locked (coming soon)</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Checkout plan (pricing)
                  </span>
                  <select
                    className="admin-input h-10 w-full"
                    value={planId}
                    disabled={plansLoading}
                    onChange={(e) => {
                      const cards = [...list('cards')];
                      const nextId = e.target.value || null;
                      const plan = planOptions.find((p) => p.id === nextId);
                      cards[index] = {
                        ...card,
                        planId: nextId,
                        priceLabel: plan?.priceLabel || card.priceLabel || '',
                      };
                      setList('cards', cards);
                    }}
                  >
                    <option value="">
                      {status === 'open'
                        ? 'Default workshop plan'
                        : 'None (locked)'}
                    </option>
                    {orphanPlanId ? (
                      <option value={planId}>
                        Linked plan (unavailable — re-select)
                      </option>
                    ) : null}
                    {workshopPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.priceLabel}
                        {p.isLandingPlan
                          ? ' (Mentorship)'
                          : p.isWorkshopPlan
                            ? ' (Workshop)'
                            : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {plansLoading ? (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Loading pricing plans…
                  </p>
                ) : plansError ? (
                  <p className="text-xs text-red-400">{plansError}</p>
                ) : selectedPlan ? (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Card price: <strong>{selectedPlan.priceLabel}</strong>
                    {selectedPlan.isLandingPlan
                      ? ' — warning: this is the Mentorship plan'
                      : ''}
                  </p>
                ) : orphanPlanId ? (
                  <p className="text-xs text-amber-400">
                    Saved plan is missing or not active. Pick another plan.
                  </p>
                ) : status === 'open' ? (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Uses the default Workshop reserve plan until you pick one.
                    {workshopPlans.length === 0
                      ? ' Create an active one-time plan under Pricing (not Mentorship), then refresh.'
                      : ''}
                  </p>
                ) : null}
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Fallback price label (optional)"
                  value={String(card.priceLabel || '')}
                  onChange={(e) => {
                    const cards = [...list('cards')];
                    cards[index] = { ...card, priceLabel: e.target.value };
                    setList('cards', cards);
                  }}
                />
                <input
                  className="admin-input h-10 w-full"
                  placeholder="Link (/#programs or https://…)"
                  value={String(card.href || '')}
                  onChange={(e) => {
                    const cards = [...list('cards')];
                    cards[index] = { ...card, href: e.target.value };
                    setList('cards', cards);
                  }}
                />
                <span className="block text-xs text-[var(--text-secondary)]">
                  Open cards reserve via their plan (link is unused for checkout).
                </span>
                <MediaField
                  label="Poster"
                  value={cardPosters[String(card.id)] || null}
                  onChange={(v) =>
                    setCardPosters((m) => ({ ...m, [String(card.id)]: v }))
                  }
                />
              </div>
              );
            })}
          </>
        )}

        {contentKey === 'seo' && (
          <>
            {(
              [
                ['home', 'Home'],
                ['programs', 'Programs'],
                ['our-mission', 'Our Mission'],
                ['testimonials', 'Testimonials'],
              ] as const
            ).map(([pageKey, pageLabel]) => {
              const page = (data[pageKey] || {}) as {
                title?: string;
                description?: string;
              };
              return (
                <div
                  key={pageKey}
                  className="space-y-2 rounded-xl border border-[var(--border-subtle)] p-3"
                >
                  <div className="text-sm font-semibold">{pageLabel}</div>
                  <input
                    className="admin-input h-10 w-full"
                    placeholder="Title"
                    maxLength={70}
                    value={page.title || ''}
                    onChange={(e) =>
                      patch({
                        [pageKey]: { ...page, title: e.target.value },
                      })
                    }
                  />
                  <CharCount value={page.title || ''} max={70} />
                  <textarea
                    className="admin-input min-h-[72px] w-full py-2"
                    placeholder="Description"
                    maxLength={160}
                    value={page.description || ''}
                    onChange={(e) =>
                      patch({
                        [pageKey]: { ...page, description: e.target.value },
                      })
                    }
                  />
                  <CharCount value={page.description || ''} max={160} />
                </div>
              );
            })}
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--border-subtle)] pt-4">
          <button
            type="button"
            className="admin-logout-btn nav-focus"
            onClick={() => setConfirmReset(true)}
          >
            Reset to default
          </button>
          <div className="flex gap-2">
            <Link href="/admin/content" className="admin-logout-btn nav-focus">
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
      </div>

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
      <AdminConfirmDialog
        open={confirmReset}
        title="Reset to default?"
        description="This replaces the current text with the original website copy. You can edit again after resetting."
        confirmLabel="Reset to default"
        danger
        onConfirm={() => void reset()}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
