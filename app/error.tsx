'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error.digest || error.message);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-3">
        Something went wrong
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] mb-4">
        We hit a snag
      </h1>
      <p className="text-[var(--text-secondary)] mb-8 max-w-md">
        Please try again. If it keeps happening, head back to the home page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-ahmixen py-3 px-8 rounded-full font-bold text-base inline-flex items-center justify-center cursor-pointer"
        >
          Try again
        </button>
        <Link
          href="/"
          className="nav-focus py-3 px-8 rounded-full font-bold text-base inline-flex items-center justify-center border border-[var(--border-subtle)] text-[var(--text-main)] bg-[var(--card-bg)]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
