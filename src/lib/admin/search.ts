/** Escape user search so special regex characters never break or slow a query. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Trim and cap search length for admin list endpoints. */
export function sanitizeAdminSearch(raw: string | null | undefined, max = 80): string {
  return (raw || '').trim().slice(0, max);
}
