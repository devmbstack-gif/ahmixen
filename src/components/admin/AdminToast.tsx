'use client';

type AdminToastProps = {
  message: string | null;
  tone?: 'ok' | 'error';
};

export function AdminToast({ message, tone = 'ok' }: AdminToastProps) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-[80] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${
        tone === 'error'
          ? 'border-red-500/40 bg-[var(--card-bg)] text-red-500'
          : 'border-[var(--border-highlight)] bg-[var(--card-bg)] text-[var(--text-main)]'
      }`}
    >
      {message}
    </div>
  );
}
