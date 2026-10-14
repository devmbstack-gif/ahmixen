/** Escape HTML dynamic values. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip CR/LF from headers / subject. */
export function stripLineBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export function firstNameFrom(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] || 'there';
  return first.slice(0, 80);
}

/** Map SMTP / transport errors to short plain messages (no secrets, no raw server text). */
export function mapSmtpError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  const code =
    typeof err === 'object' && err && 'responseCode' in err
      ? Number((err as { responseCode?: number }).responseCode)
      : NaN;

  if (
    code === 534 ||
    code === 535 ||
    /invalid login|authentication failed|auth/i.test(msg)
  ) {
    return 'Email login failed. Check the SMTP username and app password.';
  }
  if (
    /etimedout|econnrefused|econnreset|enotfound|timeout|socket/i.test(lower) ||
    /could not connect|connection/i.test(lower)
  ) {
    return 'Could not reach the email server.';
  }
  if (code === 550 || code === 553 || /recipient.*reject|mailbox unavailable/i.test(lower)) {
    return 'The recipient address was rejected.';
  }
  if (
    code === 452 ||
    /5\.4\.5|daily.*limit|sending limit|quota/i.test(lower)
  ) {
    return 'Daily sending limit reached. Try again tomorrow.';
  }
  return 'Email could not be sent.';
}
