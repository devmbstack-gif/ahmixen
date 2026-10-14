'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminToast } from '../AdminToast';
import type { EmailSettingsPublicStatus } from '@/lib/email/settingsStatus';

type Props = {
  adminEmail: string;
};

function formatWhen(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function EmailSettingsClient({ adminEmail }: Props) {
  const [email, setEmail] = useState<EmailSettingsPublicStatus | null>(null);
  const [to, setTo] = useState(adminEmail);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/email');
      if (!res.ok) throw new Error('fail');
      const data = (await res.json()) as { email: EmailSettingsPublicStatus };
      setEmail(data.email);
    } catch {
      setToast({ message: 'Could not load email settings', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sendTest = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
        email?: EmailSettingsPublicStatus;
      };
      if (data.email) setEmail(data.email);
      if (!res.ok) {
        setToast({
          message: data.error || 'Could not send test email',
          tone: 'error',
        });
        return;
      }
      setToast({
        message: data.message || (data.ok ? 'Test email sent.' : 'Test did not send'),
        tone: data.ok ? 'ok' : 'error',
      });
    } catch {
      setToast({ message: 'Could not send test email', tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="admin-card space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-main)]">Email</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Confirmation emails after you approve a booking.
        </p>
      </div>

      {loading || !email ? (
        <div className="space-y-2" aria-hidden="true">
          <div className="admin-skeleton h-4 w-40 rounded" />
          <div className="admin-skeleton h-4 w-56 rounded" />
        </div>
      ) : (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--text-muted)]">Mode</dt>
            <dd className="font-medium">{email.mode === 'smtp' ? 'SMTP' : 'Log (dev)'}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Status</dt>
            <dd className="font-medium">
              {email.configured ? 'Configured' : 'Not configured'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">SMTP user</dt>
            <dd className="font-medium">{email.smtpUserMasked || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Allowlist</dt>
            <dd className="font-medium">
              {email.allowlistActive ? 'Active' : 'Off'}
            </dd>
          </div>
        </dl>
      )}

      {email?.fromMismatch ? (
        <p
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
        >
          {email.fromMismatchWarning}
        </p>
      ) : null}

      {email?.lastTestAt ? (
        <p className="text-xs text-[var(--text-muted)]">
          Last test: {email.lastTestOk ? 'OK' : 'Failed'} ·{' '}
          {formatWhen(email.lastTestAt)}
          {email.lastTestMessage ? ` — ${email.lastTestMessage}` : ''}
        </p>
      ) : null}

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void sendTest();
        }}
      >
        <label className="block min-w-0 flex-1">
          <span className="admin-field-label">Send test email to</span>
          <input
            className="admin-input h-10 w-full"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <button
          type="submit"
          disabled={sending || !to.trim()}
          className="btn-ahmixen inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send test email'}
        </button>
      </form>

      {toast ? <AdminToast message={toast.message} tone={toast.tone} /> : null}
    </section>
  );
}
