'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import type { InstructorContentData, MissionContentData } from '@/lib/content/registry';
import { MediaField, type MediaPickerValue } from '../media/MediaPicker';
import { AdminToast } from '../AdminToast';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { AdminIconAction } from '../AdminIconAction';
import { SkeletonForm } from '../skeletons';

type Tab = 'instructor' | 'mission';

type ContentResponse<T> = {
  key: string;
  label: string;
  version: number;
  data: T;
  updatedAt: string | null;
  updatedByName: string;
  error?: string;
};

function formatUpdated(at: string | null, by: string) {
  if (!at) return 'Not saved yet';
  const d = new Date(at);
  const when = Number.isNaN(d.getTime())
    ? at
    : d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
  return by ? `Last updated ${when} by ${by}` : `Last updated ${when}`;
}

export function InstructorMissionClient() {
  const [tab, setTab] = useState<Tab>('instructor');
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );

  // Instructor
  const [iVersion, setIVersion] = useState(1);
  const [iMeta, setIMeta] = useState({ updatedAt: null as string | null, by: '' });
  const [instructor, setInstructor] = useState<InstructorContentData | null>(null);
  const [photo, setPhoto] = useState<MediaPickerValue | null>(null);
  const [iSaving, setISaving] = useState(false);
  const [iError, setIError] = useState<string | null>(null);
  const [placeDraft, setPlaceDraft] = useState('');
  const [resetKey, setResetKey] = useState<Tab | null>(null);

  // Mission
  const [mVersion, setMVersion] = useState(1);
  const [mMeta, setMMeta] = useState({ updatedAt: null as string | null, by: '' });
  const [mission, setMission] = useState<MissionContentData | null>(null);
  const [mSaving, setMSaving] = useState(false);
  const [mError, setMError] = useState<string | null>(null);

  const load = useCallback(async (key: Tab) => {
    const res = await fetch(`/api/admin/content/${key}`);
    const data = (await res.json().catch(() => ({}))) as ContentResponse<
      InstructorContentData | MissionContentData
    >;
    if (!res.ok) {
      setToast({ message: data.error || 'Could not load content', tone: 'error' });
      return;
    }
    if (key === 'instructor') {
      const d = data.data as InstructorContentData;
      setInstructor(d);
      setIVersion(data.version);
      setIMeta({ updatedAt: data.updatedAt, by: data.updatedByName });
      if (d.photoAssetId) {
        setPhoto({
          id: d.photoAssetId,
          url: d.photo || '',
          name: 'Photo',
          altText: '',
        });
        // Resolve URL from media if needed
        void fetch(`/api/admin/media/${d.photoAssetId}`)
          .then((r) => r.json())
          .then((j: { asset?: { url: string; name: string; altText: string } }) => {
            if (j.asset) {
              setPhoto({
                id: d.photoAssetId!,
                url: j.asset.url,
                name: j.asset.name,
                altText: j.asset.altText,
              });
            }
          })
          .catch(() => undefined);
      } else if (d.photo) {
        setPhoto({ id: '', url: d.photo, name: 'Photo', altText: '' });
      } else {
        setPhoto(null);
      }
    } else {
      setMission(data.data as MissionContentData);
      setMVersion(data.version);
      setMMeta({ updatedAt: data.updatedAt, by: data.updatedByName });
    }
  }, []);

  useEffect(() => {
    void load('instructor');
    void load('mission');
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const saveInstructor = async () => {
    if (!instructor) return;
    setISaving(true);
    setIError(null);
    try {
      const payload: InstructorContentData = {
        ...instructor,
        photoAssetId: photo?.id || null,
        photo: photo?.id ? undefined : photo?.url || instructor.photo,
      };
      const res = await fetch('/api/admin/content/instructor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: iVersion, data: payload }),
      });
      const data = (await res.json().catch(() => ({}))) as ContentResponse<InstructorContentData>;
      if (res.status === 409) {
        setToast({ message: 'This was changed elsewhere, reload', tone: 'error' });
        return;
      }
      if (!res.ok) {
        setIError(data.error || 'Could not save. Check the fields and try again.');
        return;
      }
      setInstructor(data.data);
      setIVersion(data.version);
      setIMeta({ updatedAt: data.updatedAt, by: data.updatedByName });
      setToast({ message: 'Instructor details saved' });
    } finally {
      setISaving(false);
    }
  };

  const saveMission = async () => {
    if (!mission) return;
    setMSaving(true);
    setMError(null);
    try {
      const res = await fetch('/api/admin/content/mission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: mVersion, data: mission }),
      });
      const data = (await res.json().catch(() => ({}))) as ContentResponse<MissionContentData>;
      if (res.status === 409) {
        setToast({ message: 'This was changed elsewhere, reload', tone: 'error' });
        return;
      }
      if (!res.ok) {
        setMError(data.error || 'Could not save. Check the fields and try again.');
        return;
      }
      setMission(data.data);
      setMVersion(data.version);
      setMMeta({ updatedAt: data.updatedAt, by: data.updatedByName });
      setToast({ message: 'Mission details saved' });
    } finally {
      setMSaving(false);
    }
  };

  const doReset = async () => {
    if (!resetKey) return;
    const key = resetKey;
    setResetKey(null);
    const version = key === 'instructor' ? iVersion : mVersion;
    const res = await fetch(`/api/admin/content/${key}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version }),
    });
    const data = (await res.json().catch(() => ({}))) as ContentResponse<
      InstructorContentData | MissionContentData
    >;
    if (res.status === 409) {
      setToast({ message: 'This was changed elsewhere, reload', tone: 'error' });
      return;
    }
    if (!res.ok) {
      setToast({ message: data.error || 'Could not reset', tone: 'error' });
      return;
    }
    await load(key);
    setToast({ message: 'Restored the default content' });
  };

  const addPlace = () => {
    if (!instructor) return;
    const place = placeDraft.trim();
    if (!place) return;
    if (instructor.seminars.places.length >= 8) {
      setIError('You can add at most 8 seminar places');
      return;
    }
    setInstructor({
      ...instructor,
      seminars: {
        ...instructor.seminars,
        places: [...instructor.seminars.places, place],
      },
    });
    setPlaceDraft('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Instructor & Mission
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Profile and mission copy shown on the website.
        </p>
      </div>

      <div className="flex gap-2" role="tablist">
        {(['instructor', 'mission'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`nav-focus min-h-10 rounded-xl px-4 text-sm font-semibold capitalize ${
              tab === t
                ? 'bg-[var(--card-bg-elevated)] text-[var(--text-main)]'
                : 'text-[var(--text-secondary)]'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'instructor' ? 'Instructor' : 'Mission'}
          </button>
        ))}
      </div>

      {tab === 'instructor' && !instructor && <SkeletonForm fields={8} />}

      {tab === 'instructor' && instructor && (
        <div className="admin-card admin-session-form mx-auto max-w-3xl space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            {formatUpdated(iMeta.updatedAt, iMeta.by)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Name
              </span>
              <input
                className="admin-input h-10 w-full"
                value={instructor.name}
                onChange={(e) =>
                  setInstructor({ ...instructor, name: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Title
              </span>
              <input
                className="admin-input h-10 w-full"
                value={instructor.title}
                onChange={(e) =>
                  setInstructor({ ...instructor, title: e.target.value })
                }
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Short bio
            </span>
            <textarea
              className="admin-input min-h-[96px] w-full py-2"
              value={instructor.shortBio}
              maxLength={400}
              onChange={(e) =>
                setInstructor({ ...instructor, shortBio: e.target.value })
              }
            />
            <span className="mt-1 block text-xs text-[var(--text-secondary)]">
              {instructor.shortBio.length}/400
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Full bio
            </span>
            <textarea
              className="admin-input min-h-[96px] w-full py-2"
              value={instructor.bio}
              onChange={(e) =>
                setInstructor({ ...instructor, bio: e.target.value })
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Chip
            </span>
            <input
              className="admin-input h-10 w-full"
              value={instructor.chip}
              onChange={(e) =>
                setInstructor({ ...instructor, chip: e.target.value })
              }
            />
          </label>
          <MediaField
            value={photo}
            onChange={setPhoto}
            helper="Used on the landing page and the Our Mission page"
          />

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Stats
              </span>
              <button
                type="button"
                className="admin-logout-btn nav-focus inline-flex items-center gap-1"
                disabled={instructor.stats.length >= 6}
                onClick={() =>
                  setInstructor({
                    ...instructor,
                    stats: [
                      ...instructor.stats,
                      { value: 0, suffix: '+', label: '', visible: true },
                    ],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add stat
              </button>
            </div>
            <p className="mb-2 text-xs text-[var(--text-secondary)]">
              The first visible stat is shown large on the Our Mission page
            </p>
            <div className="space-y-2">
              {instructor.stats.map((stat, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border border-[var(--border-subtle)] p-2 sm:grid-cols-[1fr_1fr_auto_auto]"
                >
                  <input
                    className="admin-input h-10"
                    placeholder="Value"
                    type="number"
                    value={stat.value}
                    onChange={(e) => {
                      const stats = [...instructor.stats];
                      stats[index] = {
                        ...stat,
                        value: Number(e.target.value) || 0,
                      };
                      setInstructor({ ...instructor, stats });
                    }}
                  />
                  <input
                    className="admin-input h-10"
                    placeholder="Label"
                    value={stat.label}
                    onChange={(e) => {
                      const stats = [...instructor.stats];
                      stats[index] = { ...stat, label: e.target.value };
                      setInstructor({ ...instructor, stats });
                    }}
                  />
                  <label className="flex h-10 items-center gap-2 px-1 text-sm">
                    <input
                      type="checkbox"
                      checked={stat.visible}
                      onChange={(e) => {
                        const stats = [...instructor.stats];
                        stats[index] = { ...stat, visible: e.target.checked };
                        setInstructor({ ...instructor, stats });
                      }}
                    />
                    Visible
                  </label>
                  <div className="admin-session-actions">
                    <AdminIconAction
                      tip="Move up"
                      ariaLabel="Move up"
                      disabled={index === 0}
                      onClick={() => {
                        if (index === 0) return;
                        const stats = [...instructor.stats];
                        const tmp = stats[index - 1]!;
                        stats[index - 1] = stats[index]!;
                        stats[index] = tmp;
                        setInstructor({ ...instructor, stats });
                      }}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </AdminIconAction>
                    <AdminIconAction
                      tip="Move down"
                      ariaLabel="Move down"
                      disabled={index === instructor.stats.length - 1}
                      onClick={() => {
                        if (index >= instructor.stats.length - 1) return;
                        const stats = [...instructor.stats];
                        const tmp = stats[index + 1]!;
                        stats[index + 1] = stats[index]!;
                        stats[index] = tmp;
                        setInstructor({ ...instructor, stats });
                      }}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </AdminIconAction>
                    <AdminIconAction
                      tip="Remove"
                      ariaLabel="Remove stat"
                      danger
                      onClick={() => {
                        const stats = instructor.stats.filter((_, i) => i !== index);
                        setInstructor({ ...instructor, stats });
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </AdminIconAction>
                  </div>
                  <input
                    className="admin-input h-10 sm:col-span-4"
                    placeholder="Suffix (e.g. +)"
                    value={stat.suffix}
                    onChange={(e) => {
                      const stats = [...instructor.stats];
                      stats[index] = { ...stat, suffix: e.target.value };
                      setInstructor({ ...instructor, stats });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Seminars label
              </span>
              <input
                className="admin-input h-10 w-full"
                value={instructor.seminars.label}
                onChange={(e) =>
                  setInstructor({
                    ...instructor,
                    seminars: { ...instructor.seminars, label: e.target.value },
                  })
                }
              />
            </label>
            <div className="mt-2">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Places
              </span>
              <div className="flex flex-wrap gap-2">
                {instructor.seminars.places.map((place) => (
                  <span
                    key={place}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2 py-1 text-xs"
                  >
                    {place}
                    <button
                      type="button"
                      className="nav-focus rounded-full p-0.5"
                      aria-label={`Remove ${place}`}
                      onClick={() =>
                        setInstructor({
                          ...instructor,
                          seminars: {
                            ...instructor.seminars,
                            places: instructor.seminars.places.filter(
                              (p) => p !== place
                            ),
                          },
                        })
                      }
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="admin-input h-10 min-w-0 flex-1"
                  placeholder="Type a place and press Enter"
                  value={placeDraft}
                  onChange={(e) => setPlaceDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPlace();
                    }
                  }}
                />
                <button
                  type="button"
                  className="admin-logout-btn nav-focus"
                  onClick={addPlace}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                LinkedIn
              </span>
              <input
                className="admin-input h-10 w-full"
                value={instructor.linkedin}
                onChange={(e) =>
                  setInstructor({ ...instructor, linkedin: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Instagram
              </span>
              <input
                className="admin-input h-10 w-full"
                value={instructor.instagram}
                onChange={(e) =>
                  setInstructor({ ...instructor, instagram: e.target.value })
                }
              />
            </label>
          </div>

          {iError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {iError}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              className="admin-logout-btn nav-focus"
              onClick={() => setResetKey('instructor')}
            >
              Reset to default
            </button>
            <button
              type="button"
              className="btn-ahmixen nav-focus min-h-10 px-4"
              disabled={iSaving}
              onClick={() => void saveInstructor()}
            >
              {iSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {tab === 'mission' && !mission && <SkeletonForm fields={6} />}

      {tab === 'mission' && mission && (
        <div className="admin-card admin-session-form mx-auto max-w-3xl space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            {formatUpdated(mMeta.updatedAt, mMeta.by)}
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Title
            </span>
            <input
              className="admin-input h-10 w-full"
              value={mission.title}
              maxLength={40}
              onChange={(e) => setMission({ ...mission, title: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Sub text
            </span>
            <textarea
              className="admin-input min-h-[72px] w-full py-2"
              value={mission.sub}
              maxLength={160}
              onChange={(e) => setMission({ ...mission, sub: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Accent line
            </span>
            <input
              className="admin-input h-10 w-full"
              value={mission.accentLine}
              maxLength={80}
              onChange={(e) =>
                setMission({ ...mission, accentLine: e.target.value })
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              Story text
            </span>
            <textarea
              className="admin-input min-h-[96px] w-full py-2"
              value={mission.story.text}
              maxLength={300}
              onChange={(e) =>
                setMission({
                  ...mission,
                  story: { ...mission.story, text: e.target.value },
                })
              }
            />
            <span className="mt-1 block text-xs text-[var(--text-secondary)]">
              Confirm this text with the founder before launch.
            </span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Link label
              </span>
              <input
                className="admin-input h-10 w-full"
                value={mission.story.link.label}
                maxLength={40}
                onChange={(e) =>
                  setMission({
                    ...mission,
                    story: {
                      ...mission.story,
                      link: { ...mission.story.link, label: e.target.value },
                    },
                  })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                Link URL
              </span>
              <input
                className="admin-input h-10 w-full"
                value={mission.story.link.href}
                onChange={(e) =>
                  setMission({
                    ...mission,
                    story: {
                      ...mission.story,
                      link: { ...mission.story.link, href: e.target.value },
                    },
                  })
                }
              />
            </label>
          </div>

          {mError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {mError}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              className="admin-logout-btn nav-focus"
              onClick={() => setResetKey('mission')}
            >
              Reset to default
            </button>
            <button
              type="button"
              className="btn-ahmixen nav-focus min-h-10 px-4"
              disabled={mSaving}
              onClick={() => void saveMission()}
            >
              {mSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
      <AdminConfirmDialog
        open={Boolean(resetKey)}
        title="Reset to default?"
        description="This replaces the current content with the original website copy. You can edit again after resetting."
        confirmLabel="Reset to default"
        danger
        onConfirm={() => void doReset()}
        onCancel={() => setResetKey(null)}
      />
    </div>
  );
}
