'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const TOKEN_KEY = 'admin_reset_token';
const EMAIL_KEY = 'admin_reset_email';

export function AdminResetPasswordForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY) || '';
      if (!token) {
        router.replace('/admin/forgot-password');
        return;
      }
      setResetToken(token);
    } catch {
      router.replace('/admin/forgot-password');
    }
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirmation do not match');
      return;
    }
    if (!resetToken) {
      setError('Reset session expired. Start again.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          password,
          confirmPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(data.error || 'Could not reset password');
        return;
      }
      try {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(EMAIL_KEY);
        sessionStorage.setItem(
          'admin-login-toast',
          data.message || 'Password updated. You can sign in now.'
        );
      } catch {
        /* ignore */
      }
      router.replace('/admin/login?reset=1');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="admin-card w-full max-w-md space-y-5"
      noValidate
    >
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Reset password</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Choose a new password for your admin account (min. 8 characters).
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reset-password" className="text-sm font-medium">
          New password
        </label>
        <div className="relative">
          <input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--text-main)] nav-focus cursor-pointer bg-transparent border-0"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reset-confirm" className="text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="admin-input"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !resetToken}
        className="btn-ahmixen w-full min-h-10 rounded-xl font-semibold py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          'Update password'
        )}
      </button>

      <p className="text-sm text-[var(--text-secondary)] text-center">
        <Link href="/admin/login" className="text-[var(--purple-soft-text)] hover:underline nav-focus">
          Back to sign in
        </Link>
      </p>
    </motion.form>
  );
}
