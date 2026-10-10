import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-3">
        404
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] mb-4">
        Page not found
      </h1>
      <p className="text-[var(--text-secondary)] mb-8 max-w-md">
        That page doesn’t exist — head back to the workshop landing.
      </p>
      <Link
        href="/"
        className="btn-ahmixen py-3 px-8 rounded-full font-bold text-base inline-flex items-center justify-center"
      >
        Back to home
      </Link>
    </main>
  );
}
