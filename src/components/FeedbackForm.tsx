'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { PublicCheckoutShell } from '@/components/checkout/PublicCheckoutShell';

export function FeedbackForm() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          rating,
          quote: quote.trim(),
          website,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: { message?: string };
        error?: { message?: string };
      } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error?.message || 'Something went wrong. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <PublicCheckoutShell>
        <div className="mx-auto max-w-lg checkout-card space-y-4 text-center">
          <h1 className="text-2xl font-bold">Thank you</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Your feedback was submitted. It will appear on the website after we
            review and approve it.
          </p>
          <Link
            href="/"
            className="btn-ahmixen inline-flex min-h-10 px-5 py-2.5 rounded-xl font-semibold"
          >
            Back to home
          </Link>
        </div>
      </PublicCheckoutShell>
    );
  }

  return (
    <PublicCheckoutShell>
      <div className="mx-auto max-w-lg space-y-5">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Give us a review
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Tell us about your AhmiXen experience. After we approve it, your
            review can appear on the testimonials page.
          </p>
        </header>

        <form onSubmit={submit} className="checkout-card relative space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Your name</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-sm"
              autoComplete="name"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              Role / profession{' '}
              <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </span>
            <input
              type="text"
              maxLength={80}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full min-h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-sm"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Rating</legend>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="nav-focus rounded-lg p-1.5"
                  aria-label={`${n} out of 5`}
                  aria-pressed={rating === n}
                >
                  <Star
                    className={`h-7 w-7 ${
                      n <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-transparent text-[var(--border-subtle)]'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Your feedback</span>
            <textarea
              required
              minLength={10}
              maxLength={400}
              rows={5}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="What did you learn? Would you recommend this workshop?"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm resize-y"
            />
            <span className="text-xs text-[var(--text-muted)]">
              {quote.trim().length}/400
            </span>
          </label>

          {/* Honeypot */}
          <div className="absolute -left-[9999px] opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="btn-ahmixen w-full min-h-11 rounded-xl font-semibold disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </form>
      </div>
    </PublicCheckoutShell>
  );
}
