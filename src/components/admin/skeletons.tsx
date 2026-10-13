import type { ReactNode } from 'react';

function SkeletonRoot({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      {children}
    </div>
  );
}

export function SkeletonBlock({
  className = '',
}: {
  className?: string;
}) {
  return <div className={`admin-skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function SkeletonText({
  className = 'h-4 w-40',
}: {
  className?: string;
}) {
  return <SkeletonBlock className={className} />;
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
      <div
        className="grid gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={`h-${i}`} className="h-3 w-16" />
        ))}
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`r-${r}`}
            className="grid gap-2 px-3 py-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBlock
                key={`c-${r}-${c}`}
                className={`h-4 ${c === 0 ? 'w-24' : 'w-full max-w-[7rem]'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({
  count = 4,
  className = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="admin-card space-y-3">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-8 w-16" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({
  fields = 8,
}: {
  fields?: number;
}) {
  return (
    <SkeletonRoot>
      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-10 w-20 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <SkeletonBlock className="h-10 w-24 rounded-xl" />
          <SkeletonBlock className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </SkeletonRoot>
  );
}

export function SkeletonMediaGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-[var(--border-subtle)]"
        >
          <SkeletonBlock className="aspect-square rounded-none" />
          <div className="space-y-2 p-2">
            <SkeletonBlock className="h-3 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <SkeletonRoot className="space-y-6">
      <SkeletonCards count={4} />
      <div className="admin-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <SkeletonTable rows={5} cols={6} />
      </div>
    </SkeletonRoot>
  );
}

export function SkeletonListPage({
  showTabs = false,
  rows = 6,
  cols = 5,
  showCards = false,
}: {
  showTabs?: boolean;
  rows?: number;
  cols?: number;
  showCards?: boolean;
}) {
  return (
    <SkeletonRoot className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-64 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>
      {showTabs && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <SkeletonBlock className="h-10 flex-1 rounded-xl" />
        <SkeletonBlock className="h-10 w-full rounded-xl sm:w-48" />
      </div>
      {showCards ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="admin-card space-y-3">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <SkeletonTable rows={rows} cols={cols} />
      )}
    </SkeletonRoot>
  );
}

export function SkeletonOrderDetail() {
  return (
    <SkeletonRoot className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-10 w-24 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card space-y-3">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="aspect-video w-full rounded-xl" />
        </div>
        <div className="admin-card space-y-3">
          <SkeletonBlock className="h-4 w-28" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-3">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRoot>
  );
}

export function SkeletonContentList() {
  return (
    <SkeletonRoot className="space-y-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-4 py-3"
          >
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="h-3 w-52 max-w-full" />
            </div>
            <SkeletonBlock className="h-9 w-9 rounded-lg" />
          </div>
        ))}
      </div>
    </SkeletonRoot>
  );
}

export function SkeletonMediaPage() {
  return (
    <SkeletonRoot className="space-y-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-64 max-w-full" />
      </div>
      <SkeletonBlock className="h-10 max-w-md rounded-xl" />
      <SkeletonBlock className="h-24 w-full rounded-xl" />
      <SkeletonMediaGrid />
    </SkeletonRoot>
  );
}

export function SkeletonSettings() {
  return (
    <SkeletonRoot className="space-y-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-32" />
        <SkeletonBlock className="h-4 w-56" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card space-y-3">
          <SkeletonBlock className="h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="admin-card space-y-3">
          <SkeletonBlock className="h-5 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRoot>
  );
}

export { SkeletonRoot };
