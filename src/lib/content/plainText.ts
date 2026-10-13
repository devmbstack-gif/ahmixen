const TAG_RE = /<\/?[a-z][\s\S]*?>/i;

/** Trim and reject HTML tags. Returns error message or null. */
export function assertPlainText(
  value: string,
  label: string,
  max: number,
  min = 0
): string | null {
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return `${label} must be at least ${min} characters`;
  }
  if (trimmed.length > max) {
    return `${label} must be at most ${max} characters`;
  }
  if (TAG_RE.test(trimmed)) {
    return `${label} must be plain text — remove any HTML tags`;
  }
  return null;
}

export function trimPlain(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function hasHtmlTags(value: string): boolean {
  return TAG_RE.test(value);
}
