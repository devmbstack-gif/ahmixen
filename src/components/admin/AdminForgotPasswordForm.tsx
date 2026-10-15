'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const EMAIL_KEY = 'admin_reset_email';

export function AdminForgotPasswordForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(data.error || 'Could not send verification code');
        return;
      }
      try {
        sessionStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
      } catch {
        /* ignore */
      }
      router.push(
        `/admin/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`
      );
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
        <h1 className="text-xl font-extrabold tracking-tight">Forgot password</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Enter your admin email. We&apos;ll send a 6-digit verification code
          (valid for 10 minutes).
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forgot-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        disabled={loading}
        className="btn-ahmixen w-full min-h-10 rounded-xl font-semibold py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          'Send verification code'
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
