'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdminSessionDTO } from '@/lib/sessions/serialize';
import { AdminToast } from '../AdminToast';

type FormState = {
  title: string;
  description: string;
  localDate: string;
  localTime: string; // HH:mm 24h internal
  durationMinutes: number;
  status: 'draft' | 'open' | 'closed' | 'completed' | 'archived';
  seatsTotalStr: string;
  holdHoursStr: string;
  showLimitedSeatsBadge: boolean;
  meetingLink: string;
  recordingUrl: string;
};

const STATUS_HELP: Record<string, string> = {
  draft: 'Not open for reservations yet',
  open: 'People can reserve seats',
  closed: 'Reservations are closed',
  completed: 'Session finished',
  archived: 'Hidden from normal lists',
};

function digitsOnly(raw: string): string {
  const cleaned = raw.replace(/\D/g, '');
  if (!cleaned) return '';
  return String(Number(cleaned));
}

function limitDigits(raw: string, maxLen: number): string {
  return raw.replace(/\D/g, '').slice(0, maxLen);
}

function pad2(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '00';
  return String(Math.trunc(n)).padStart(2, '0');
}

function to12h(hhmm: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  const [hStr, mStr] = (hhmm || '19:00').split(':');
  let h = Number(hStr);
  const minute = Number(mStr) || 0;
  if (Number.isNaN(h)) h = 19;
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, period };
}

function to24h(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h = hour12 % 12;
  if (period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function bumpWrapped(
  raw: string,
  delta: number,
  min: number,
  max: number,
  pad: boolean
): string {
  const current = raw === '' ? (delta > 0 ? min - 1 : max + 1) : Number(raw);
  if (!Number.isFinite(current)) return raw;
  let next = current + delta;
  if (next > max) next = min;
  if (next < min) next = max;
  return pad ? pad2(next) : String(next);
}

function formatDurationSummary(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  if (hours === 0) return `Session length: ${mins} minutes`;
  if (mins === 0) {
    return `Session length: ${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `Session length: ${hours} hour${hours === 1 ? '' : 's'} ${mins} minutes`;
}

function emptyForm(): FormState {
  return {
    title: '',
    description: '',
    localDate: '',
    localTime: '19:00',
    durationMinutes: 150,
    status: 'draft',
    seatsTotalStr: '100',
    holdHoursStr: '24',
    showLimitedSeatsBadge: true,
    meetingLink: '',
    recordingUrl: '',
  };
}

function fromSession(s: AdminSessionDTO): FormState {
  return {
    title: s.title,
    description: s.description,
    localDate: s.localDate,
    localTime: s.localTime,
    durationMinutes: s.durationMinutes,
    status: s.status as FormState['status'],
    seatsTotalStr: String(s.seatsTotal),
    holdHoursStr: String(s.holdHours),
    showLimitedSeatsBadge: s.showLimitedSeatsBadge,
    meetingLink: s.meetingLink,
    recordingUrl: s.recordingUrl,
  };
}

type SessionFormProps = {
  mode: 'create' | 'edit';
  initial?: AdminSessionDTO | null;
};

export function SessionForm({ mode, initial }: SessionFormProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const seed = initial ? fromSession(initial) : emptyForm();
  const seed12 = to12h(seed.localTime);

  const [form, setForm] = useState<FormState>(() => seed);
  const [baseline, setBaseline] = useState(() => JSON.stringify(seed));
  const version = initial?.version ?? 1;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );

  const [hourStr, setHourStr] = useState(() => pad2(seed12.hour12));
  const [minuteStr, setMinuteStr] = useState(() => pad2(seed12.minute));
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => seed12.period);

  const [durHourStr, setDurHourStr] = useState(() =>
    pad2(Math.floor(seed.durationMinutes / 60))
  );
  const [durMinStr, setDurMinStr] = useState(() =>
    pad2(seed.durationMinutes % 60)
  );

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

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  const clearError = (key: string) => {
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const applyTime = (hRaw: string, mRaw: string, p: 'AM' | 'PM') => {
    if (hRaw === '' || mRaw === '') return;
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (!Number.isInteger(h) || h < 1 || h > 12) return;
    if (!Number.isInteger(m) || m < 0 || m > 59) return;
    setField('localTime', to24h(h, m, p));
  };

  const applyDuration = (hRaw: string, mRaw: string) => {
    if (hRaw === '' || mRaw === '') return;
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (!Number.isInteger(h) || h < 0 || h > 10) return;
    if (!Number.isInteger(m) || m < 0 || m > 59) return;
    const total = h * 60 + m;
    if (total > 600) return;
    setField('durationMinutes', total);
  };

  const validateHour = (value: string): string | null => {
    if (value === '') return 'Enter an hour from 1 to 12';
    const h = Number(value);
    if (!Number.isInteger(h) || h < 1 || h > 12) return 'Enter an hour from 1 to 12';
    return null;
  };

  const validateMinute = (value: string): string | null => {
    if (value === '') return 'Enter minutes from 00 to 59';
    const m = Number(value);
    if (!Number.isInteger(m) || m < 0 || m > 59) return 'Enter minutes from 00 to 59';
    return null;
  };

  const validateDurHour = (value: string): string | null => {
    if (value === '') return 'Enter hours from 0 to 10';
    const h = Number(value);
    if (!Number.isInteger(h) || h < 0 || h > 10) return 'Enter hours from 0 to 10';
    return null;
  };

  const validateDurMinute = (value: string): string | null => {
    if (value === '') return 'Enter minutes from 00 to 59';
    const m = Number(value);
    if (!Number.isInteger(m) || m < 0 || m > 59) return 'Enter minutes from 00 to 59';
    return null;
  };

  const validateSeats = (value: string): string | null => {
    if (value === '') return 'Enter how many seats are available.';
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) return 'Seats must be a number of at least 1.';
    const min = (initial?.seatsConfirmed ?? 0) + (initial?.seats.held ?? 0);
    if (n < min) {
      return `Seats cannot be lower than confirmed + held seats (${min}).`;
    }
    return null;
  };

  const validateHold = (value: string): string | null => {
    if (value === '') return 'Enter how many hours to hold a seat.';
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 72) {
      return 'Hold hours must be between 1 and 72.';
    }
    return null;
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.localDate) next.localDate = 'Pick a date.';

    const hourErr = validateHour(hourStr);
    const minErr = validateMinute(minuteStr);
    if (hourErr) next.localTime = hourErr;
    else if (minErr) next.localTime = minErr;
    else if (!form.localTime) next.localTime = 'Pick a time.';

    const dhErr = validateDurHour(durHourStr);
    const dmErr = validateDurMinute(durMinStr);
    if (dhErr) next.durationMinutes = dhErr;
    else if (dmErr) next.durationMinutes = dmErr;
    else {
      const total = Number(durHourStr) * 60 + Number(durMinStr);
      if (total < 15) {
        next.durationMinutes = 'Session must be at least 15 minutes.';
      } else if (total > 600) {
        next.durationMinutes = 'Session cannot be longer than 10 hours.';
      }
    }

    const seatsErr = validateSeats(form.seatsTotalStr);
    if (seatsErr) next.seatsTotalStr = seatsErr;
    const holdErr = validateHold(form.holdHoursStr);
    if (holdErr) next.holdHoursStr = holdErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    applyTime(hourStr, minuteStr, period);
    applyDuration(durHourStr, durMinStr);
    if (!validate()) return;

    const h = Number(hourStr);
    const m = Number(minuteStr);
    const time24 = to24h(h, m, period);
    const durationMinutes = Number(durHourStr) * 60 + Number(durMinStr);

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        localDate: form.localDate,
        localTime: time24,
        durationMinutes,
        status: form.status,
        seatsTotal: Number(form.seatsTotalStr),
        holdHours: Number(form.holdHoursStr),
        showLimitedSeatsBadge: form.showLimitedSeatsBadge,
        meetingLink: form.meetingLink.trim(),
        recordingUrl: form.recordingUrl.trim(),
        timezone: 'Asia/Karachi',
        ...(mode === 'edit' ? { version } : {}),
      };

      const res = await fetch(
        mode === 'create' ? '/api/admin/sessions' : `/api/admin/sessions/${initial!.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setToast({
          message: 'This session was changed elsewhere, reload',
          tone: 'error',
        });
        return;
      }
      if (!res.ok) {
        setToast({ message: data.error || 'Save failed', tone: 'error' });
        return;
      }

      const message = mode === 'create' ? 'Session created' : 'Session saved';
      const reset = emptyForm();
      const reset12 = to12h(reset.localTime);
      setForm(reset);
      setBaseline(JSON.stringify(reset));
      setHourStr(pad2(reset12.hour12));
      setMinuteStr(pad2(reset12.minute));
      setPeriod(reset12.period);
      setDurHourStr(pad2(Math.floor(reset.durationMinutes / 60)));
      setDurMinStr(pad2(reset.durationMinutes % 60));
      try {
        sessionStorage.setItem('admin-sessions-toast', message);
      } catch {
        /* ignore */
      }
      router.replace('/admin/sessions');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const statusOptions =
    mode === 'create'
      ? (['draft', 'open'] as const)
      : (['draft', 'open', 'closed', 'completed'] as const);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto w-full max-w-4xl"
    >
      <form
        onSubmit={onSubmit}
        className="admin-card admin-session-form"
        noValidate
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold leading-none">
            {mode === 'create' ? 'New session' : 'Edit session'}
          </h2>
          <Link
            href="/admin/sessions"
            className="admin-logout-btn nav-focus text-sm h-10"
          >
            Back
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 lg:gap-y-4">
          {/* Row 1 — Title */}
          <div className="admin-field col-span-1 md:col-span-12">
            <label htmlFor="title" className="admin-field-label">
              Title
            </label>
            <input
              id="title"
              className="admin-input h-10"
              placeholder="Workshop title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
            />
            {errors.title && (
              <p className="text-xs text-red-500" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Row 2 — Description */}
          <div className="admin-field col-span-1 md:col-span-12">
            <label htmlFor="description" className="admin-field-label">
              Short description
            </label>
            <textarea
              id="description"
              rows={2}
              className="admin-input"
              placeholder="Optional short description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          {/* Row 3 — Date | Time | Duration */}
          <div className="admin-field col-span-1 md:col-span-6 lg:col-span-5">
            <label htmlFor="localDate" className="admin-field-label">
              Date
            </label>
            <input
              id="localDate"
              type="date"
              className="admin-input h-10"
              value={form.localDate}
              onChange={(e) => setField('localDate', e.target.value)}
            />
            {errors.localDate && (
              <p className="text-xs text-red-500" role="alert">
                {errors.localDate}
              </p>
            )}
          </div>

          <div className="admin-field col-span-1 md:col-span-6 lg:col-span-4">
            <span className="admin-field-label" id="time-label">
              Time (PKT)
            </span>
            <div
              className="admin-composite-field"
              role="group"
              aria-labelledby="time-label"
            >
              <label className="sr-only" htmlFor="hour12">
                Hour
              </label>
              <input
                id="hour12"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                className="admin-input-numeric admin-composite-part"
                value={hourStr}
                onChange={(e) => {
                  const next = limitDigits(e.target.value, 2);
                  setHourStr(next);
                  clearError('localTime');
                  applyTime(next, minuteStr, period);
                }}
                onBlur={() => {
                  if (hourStr === '') {
                    setErrors((prev) => ({
                      ...prev,
                      localTime: 'Enter an hour from 1 to 12',
                    }));
                    return;
                  }
                  const err = validateHour(hourStr);
                  if (err) {
                    setErrors((prev) => ({ ...prev, localTime: err }));
                    return;
                  }
                  const padded = pad2(Number(hourStr));
                  setHourStr(padded);
                  applyTime(padded, minuteStr, period);
                  clearError('localTime');
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                  e.preventDefault();
                  const next = bumpWrapped(
                    hourStr,
                    e.key === 'ArrowUp' ? 1 : -1,
                    1,
                    12,
                    true
                  );
                  setHourStr(next);
                  clearError('localTime');
                  applyTime(next, minuteStr, period);
                }}
              />
              <span className="admin-composite-sep" aria-hidden="true">
                :
              </span>
              <label className="sr-only" htmlFor="minute">
                Minute
              </label>
              <input
                id="minute"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                className="admin-input-numeric admin-composite-part"
                value={minuteStr}
                onChange={(e) => {
                  const next = limitDigits(e.target.value, 2);
                  setMinuteStr(next);
                  clearError('localTime');
                  applyTime(hourStr, next, period);
                }}
                onBlur={() => {
                  if (minuteStr === '') {
                    setErrors((prev) => ({
                      ...prev,
                      localTime: 'Enter minutes from 00 to 59',
                    }));
                    return;
                  }
                  const err = validateMinute(minuteStr);
                  if (err) {
                    setErrors((prev) => ({ ...prev, localTime: err }));
                    return;
                  }
                  const padded = pad2(Number(minuteStr));
                  setMinuteStr(padded);
                  applyTime(hourStr, padded, period);
                  clearError('localTime');
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                  e.preventDefault();
                  const next = bumpWrapped(
                    minuteStr,
                    e.key === 'ArrowUp' ? 1 : -1,
                    0,
                    59,
                    true
                  );
                  setMinuteStr(next);
                  clearError('localTime');
                  applyTime(hourStr, next, period);
                }}
              />
              <label className="sr-only" htmlFor="period">
                AM or PM
              </label>
              <select
                id="period"
                className="admin-composite-period"
                value={period}
                onChange={(e) => {
                  const p = e.target.value as 'AM' | 'PM';
                  setPeriod(p);
                  clearError('localTime');
                  applyTime(hourStr, minuteStr, p);
                }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            {errors.localTime && (
              <p className="text-xs text-red-500" role="alert">
                {errors.localTime}
              </p>
            )}
          </div>

          <div className="admin-field col-span-1 md:col-span-6 lg:col-span-3">
            <span className="admin-field-label" id="duration-label">
              Duration
            </span>
            <div
              className="admin-composite-field"
              role="group"
              aria-labelledby="duration-label"
            >
              <label className="sr-only" htmlFor="durHours">
                Hours
              </label>
              <input
                id="durHours"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                className="admin-input-numeric admin-composite-part"
                value={durHourStr}
                onChange={(e) => {
                  const next = limitDigits(e.target.value, 2);
                  setDurHourStr(next);
                  clearError('durationMinutes');
                  applyDuration(next, durMinStr);
                }}
                onBlur={() => {
                  if (durHourStr === '') return;
                  const padded = pad2(Number(durHourStr));
                  const n = Number(padded);
                  if (Number.isInteger(n) && n >= 0 && n <= 10) {
                    setDurHourStr(padded);
                    applyDuration(padded, durMinStr);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                  e.preventDefault();
                  const next = bumpWrapped(
                    durHourStr,
                    e.key === 'ArrowUp' ? 1 : -1,
                    0,
                    10,
                    true
                  );
                  setDurHourStr(next);
                  clearError('durationMinutes');
                  applyDuration(next, durMinStr);
                }}
              />
              <span className="admin-composite-sep" aria-hidden="true">
                :
              </span>
              <label className="sr-only" htmlFor="durMins">
                Minutes
              </label>
              <input
                id="durMins"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                className="admin-input-numeric admin-composite-part"
                value={durMinStr}
                onChange={(e) => {
                  const next = limitDigits(e.target.value, 2);
                  setDurMinStr(next);
                  clearError('durationMinutes');
                  applyDuration(durHourStr, next);
                }}
                onBlur={() => {
                  if (durMinStr === '') return;
                  const padded = pad2(Number(durMinStr));
                  const n = Number(padded);
                  if (Number.isInteger(n) && n >= 0 && n <= 59) {
                    setDurMinStr(padded);
                    applyDuration(durHourStr, padded);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                  e.preventDefault();
                  const next = bumpWrapped(
                    durMinStr,
                    e.key === 'ArrowUp' ? 1 : -1,
                    0,
                    59,
                    true
                  );
                  setDurMinStr(next);
                  clearError('durationMinutes');
                  applyDuration(durHourStr, next);
                }}
              />
              <span className="admin-composite-suffix" aria-hidden="true">
                h : m
              </span>
            </div>
            <p className="admin-field-hint">
              {formatDurationSummary(form.durationMinutes)}
            </p>
            {errors.durationMinutes && (
              <p className="text-xs text-red-500" role="alert">
                {errors.durationMinutes}
              </p>
            )}
          </div>

          {/* Row 4 — Status | Seats | Hold | Badge */}
          <div className="admin-field col-span-1 md:col-span-6 lg:col-span-3">
            <label htmlFor="status" className="admin-field-label">
              Status
            </label>
            <select
              id="status"
              className="admin-input h-10"
              value={form.status}
              onChange={(e) =>
                setField('status', e.target.value as FormState['status'])
              }
              disabled={form.status === 'archived'}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {capitalize(s)}
                </option>
              ))}
              {form.status === 'archived' && (
                <option value="archived">Archived</option>
              )}
            </select>
            <p className="admin-field-hint">{STATUS_HELP[form.status]}</p>
          </div>

          <div className="admin-field col-span-1 md:col-span-6 lg:col-span-3">
            <label htmlFor="seatsTotal" className="admin-field-label">
              Seats total
            </label>
            <input
              id="seatsTotal"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="admin-input admin-input-numeric h-10"
              placeholder="100"
              value={form.seatsTotalStr}
              onChange={(e) => setField('seatsTotalStr', digitsOnly(e.target.value))}
              onBlur={() => {
                const err = validateSeats(form.seatsTotalStr);
                setErrors((prev) => {
                  const next = { ...prev };
                  if (err) next.seatsTotalStr = err;
                  else delete next.seatsTotalStr;
                  return next;
                });
              }}
            />
            <p className="admin-field-hint" aria-hidden="true">
              &nbsp;
            </p>
            {errors.seatsTotalStr && (
              <p className="text-xs text-red-500" role="alert">
                {errors.seatsTotalStr}
              </p>
            )}
          </div>

          <div className="admin-field col-span-1 md:col-span-6 lg:col-span-3">
            <label htmlFor="holdHours" className="admin-field-label">
              Hold hours
            </label>
            <input
              id="holdHours"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="admin-input admin-input-numeric h-10"
              placeholder="24"
              value={form.holdHoursStr}
              onChange={(e) => setField('holdHoursStr', digitsOnly(e.target.value))}
              onBlur={() => {
                const err = validateHold(form.holdHoursStr);
                setErrors((prev) => {
                  const next = { ...prev };
                  if (err) next.holdHoursStr = err;
                  else delete next.holdHoursStr;
                  return next;
                });
              }}
            />
            <p className="admin-field-hint">
              How long a seat is held after payment proof (1-72 hours)
            </p>
            {errors.holdHoursStr && (
              <p className="text-xs text-red-500" role="alert">
                {errors.holdHoursStr}
              </p>
            )}
          </div>

          <div className="admin-field col-span-1 md:col-span-12 lg:col-span-3">
            <span className="admin-field-label" aria-hidden="true">
              &nbsp;
            </span>
            <label className="admin-check-field nav-focus">
              <input
                type="checkbox"
                checked={form.showLimitedSeatsBadge}
                onChange={(e) => setField('showLimitedSeatsBadge', e.target.checked)}
              />
              <span>Show seats left badge</span>
            </label>
            <p className="admin-field-hint" aria-hidden="true">
              &nbsp;
            </p>
          </div>

          {/* Row 5 — Links */}
          <div className="admin-field col-span-1 md:col-span-12 lg:col-span-6">
            <label htmlFor="meetingLink" className="admin-field-label">
              Meeting link
            </label>
            <input
              id="meetingLink"
              type="url"
              className="admin-input h-10"
              value={form.meetingLink}
              onChange={(e) => setField('meetingLink', e.target.value)}
              placeholder="https://"
            />
            <p className="admin-field-hint">Private, only admins see this</p>
          </div>

          <div className="admin-field col-span-1 md:col-span-12 lg:col-span-6">
            <label htmlFor="recordingUrl" className="admin-field-label">
              Recording URL
            </label>
            <input
              id="recordingUrl"
              type="url"
              className="admin-input h-10"
              value={form.recordingUrl}
              onChange={(e) => setField('recordingUrl', e.target.value)}
              placeholder="https://"
            />
          </div>
        </div>

        <div className="admin-form-footer">
          <Link
            href="/admin/sessions"
            className="admin-logout-btn nav-focus text-sm h-10 px-4"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-ahmixen h-10 min-h-10 px-5 rounded-xl font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
    </motion.div>
  );
}
