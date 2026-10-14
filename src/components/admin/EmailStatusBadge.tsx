'use client';

type Status = 'sent' | 'pending' | 'failed' | 'skipped' | 'not_sent';

const DOT: Record<Status, string> = {
  sent: 'is-open',
  pending: 'is-draft',
  failed: 'is-closed',
  skipped: 'is-low',
  not_sent: 'is-draft',
};

export function EmailStatusBadge({
  status,
  label,
  reason,
}: {
  status: Status;
  label: string;
  reason?: string;
}) {
  const tip =
    (status === 'failed' || status === 'skipped') && reason
      ? reason
      : undefined;

  return (
    <span
      className="admin-session-status inline-flex"
      aria-label={tip ? `${label}: ${tip}` : label}
      title={tip}
    >
      <span
        className={`admin-session-status-dot ${DOT[status]}`}
        aria-hidden="true"
      />
      <span className="admin-session-status-text">{label}</span>
    </span>
  );
}
