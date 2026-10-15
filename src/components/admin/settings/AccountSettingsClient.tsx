'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AdminToast } from '../AdminToast';

type Props = {
  currentEmail: string;
};

export function AccountSettingsClient({ currentEmail }: Props) {
  const [emailDisplay, setEmailDisplay] = useState(currentEmail);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'ok' | 'error' } | null>(
    null
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/auth/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newEmail: newEmail.trim(),
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        admin?: { email: string };
      };
      if (!res.ok) {
        setToast({ message: data.error || 'Could not update account', tone: 'error' });
        return;
      }
      if (data.admin?.email) setEmailDisplay(data.admin.email);
      setNewEmail('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setToast({ message: data.message || 'Account updated', tone: 'ok' });
    } catch {
      setToast({ message: 'Could not update account', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          Update your admin email or password. Current password is required for
          any change.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="admin-card admin-session-form space-y-4 w-full"
        noValidate
      >
        <div className="admin-field">
          <label htmlFor="account-current-email" className="admin-field-label">
            Current email
          </label>
          <input
            id="account-current-email"
            type="email"
            value={emailDisplay}
            readOnly
            className="admin-input h-10 opacity-90"
          />
        </div>

        <div className="admin-field">
          <label htmlFor="account-new-email" className="admin-field-label">
            New email
          </label>
          <input
            id="account-new-email"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="admin-input h-10"
            placeholder="Leave blank to keep current email"
          />
        </div>

        <div className="admin-field">
          <label
            htmlFor="account-current-password"
            className="admin-field-label"
          >
            Current password
          </label>
          <div className="relative">
            <input
              id="account-current-password"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="admin-input h-10 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--text-main)] nav-focus cursor-pointer bg-transparent border-0"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="account-new-password" className="admin-field-label">
            New password
          </label>
          <div className="relative">
            <input
              id="account-new-password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="admin-input h-10 pr-12"
              placeholder="Leave blank to keep current password"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--text-main)] nav-focus cursor-pointer bg-transparent border-0"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="admin-field">
          <label
            htmlFor="account-confirm-password"
            className="admin-field-label"
          >
            Confirm new password
          </label>
          <input
            id="account-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="admin-input h-10"
            placeholder="Repeat new password"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="btn-ahmixen min-h-10 rounded-xl font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save account changes'
            )}
          </button>
        </div>
      </form>

      <AdminToast message={toast?.message ?? null} tone={toast?.tone} />
    </section>
  );
}
