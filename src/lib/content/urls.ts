export function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isLinkedInUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host === 'linkedin.com' || host.endsWith('.linkedin.com');
  } catch {
    return false;
  }
}

export function isInstagramUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host === 'instagram.com' || host.endsWith('.instagram.com');
  } catch {
    return false;
  }
}

export function isYouTubeUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return (
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be' ||
      host.endsWith('.youtu.be')
    );
  } catch {
    return false;
  }
}

export type ProofPlatformHref = 'linkedin' | 'instagram' | 'youtube' | 'other';

/** https only; hostname must match platform (other = any https). */
export function isProofCardHref(
  platform: ProofPlatformHref,
  value: string
): boolean {
  if (!isHttpsUrl(value)) return false;
  if (platform === 'linkedin') return isLinkedInUrl(value);
  if (platform === 'instagram') return isInstagramUrl(value);
  if (platform === 'youtube') return isYouTubeUrl(value);
  return true;
}
