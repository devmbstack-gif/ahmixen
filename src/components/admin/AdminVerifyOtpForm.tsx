'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const EMAIL_KEY = 'admin_reset_email';
const TOKEN_KEY = 'admin_reset_token';

export function AdminVerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const fromQuery = (searchParams.get('email') || '').trim().toLowerCase();
    if (fromQuery) {
      setEmail(fromQuery);
      return;
    }
    try {
      const stored = sessionStorage.getItem(EMAIL_KEY) || '';
      if (stored) setEmail(stored);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        resetToken?: string;
        email?: string;
      };
      if (!res.ok || !data.resetToken) {
        setError(data.error || 'Could not verify code');
        return;
      }
      try {
        sessionStorage.setItem(TOKEN_KEY, data.resetToken);
        sessionStorage.setItem(EMAIL_KEY, data.email || email.trim().toLowerCase());
      } catch {
        /* ignore */
      }
      router.push('/admin/reset-password');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email.trim()) {
      setError('Enter your email first');
      return;
    }
    setResending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Could not resend code');
        return;
      }
      setError(null);
    } catch {
      setError('Could not resend code');
    } finally {
      setResending(false);
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
        <h1 className="text-xl font-extrabold tracking-tight">Verify code</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Enter the 6-digit code sent to your email. Codes expire after 10
          minutes.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="otp-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="otp-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="admin-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="otp-code" className="text-sm font-medium">
          Verification code
        </label>
        <input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          pattern="\d{6}"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="admin-input tracking-[0.35em] text-center text-lg font-semibold"
          placeholder="••••••"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="btn-ahmixen w-full min-h-10 rounded-xl font-semibold py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Verifying…
          </>
        ) : (
          'Verify code'
        )}
      </button>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--text-secondary)]">
        <button
          type="button"
          onClick={() => void onResend()}
          disabled={resending}
          className="text-[var(--purple-soft-text)] hover:underline nav-focus bg-transparent border-0 cursor-pointer disabled:opacity-60"
        >
          {resending ? 'Resending…' : 'Resend code'}
        </button>
        <Link
          href="/admin/forgot-password"
          className="hover:underline nav-focus"
        >
          Change email
        </Link>
      </div>
    </motion.form>
  );
}
