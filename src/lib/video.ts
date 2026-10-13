export type VideoProvider = 'youtube' | 'vimeo' | 'file';

export type VideoSource = {
  type: VideoProvider;
  id?: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

/** Exact hostname allowlist — lookalikes and subdomains like m.youtube.com are rejected. */
const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
]);

const VIMEO_HOSTS = new Set(['vimeo.com', 'player.vimeo.com']);

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID_RE = /^\d+$/;

function parseHttpsUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return null;
    // Reject userinfo tricks (https://evil@youtube.com/...)
    if (u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

function youtubeIdFromUrl(u: URL): string | null {
  const host = u.hostname.toLowerCase();
  if (!YT_HOSTS.has(host)) return null;

  if (host === 'youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0] || '';
    return YT_ID_RE.test(id) ? id : null;
  }

  if (u.pathname === '/watch') {
    const id = u.searchParams.get('v') || '';
    return YT_ID_RE.test(id) ? id : null;
  }

  const parts = u.pathname.split('/').filter(Boolean);
  if (
    parts[0] === 'embed' ||
    parts[0] === 'shorts' ||
    parts[0] === 'live'
  ) {
    const id = parts[1] || '';
    return YT_ID_RE.test(id) ? id : null;
  }

  return null;
}

function vimeoIdFromUrl(u: URL): string | null {
  const host = u.hostname.toLowerCase();
  if (!VIMEO_HOSTS.has(host)) return null;
  const parts = u.pathname.split('/').filter(Boolean);
  const id = parts.find((p) => VIMEO_ID_RE.test(p));
  return id || null;
}

/**
 * Parse a YouTube or Vimeo https URL into a fixed-template embed source.
 * Rejects lookalike hosts, userinfo, non-https, and invalid IDs.
 * Also accepts direct .mp4/.webm file paths for testimonials.
 */
export function getVideoSource(url: string): VideoSource | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();

  const u = parseHttpsUrl(trimmed);
  if (u) {
    const yt = youtubeIdFromUrl(u);
    if (yt) {
      return {
        type: 'youtube',
        id: yt,
        embedUrl: `https://www.youtube-nocookie.com/embed/${yt}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
      };
    }

    const vim = vimeoIdFromUrl(u);
    if (vim) {
      return {
        type: 'vimeo',
        id: vim,
        embedUrl: `https://player.vimeo.com/video/${vim}`,
      };
    }
  }

  // Direct file URLs/paths (landing preview teaser, testimonials, etc.)
  if (/\.(mp4|webm)(\?.*)?$/i.test(trimmed)) {
    return { type: 'file', embedUrl: trimmed };
  }

  return null;
}

/** YouTube/Vimeo only — used by landing preview CMS validation. */
export function getEmbedVideoSource(url: string): VideoSource | null {
  const src = getVideoSource(url);
  if (!src || src.type === 'file') return null;
  return src;
}

export function videoEmbedAllow(): string {
  return 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
}

/** Format session minutes as hero `{duration}` token, e.g. "2.5-Hour". */
export function formatHeroDurationToken(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) {
    return '2.5-Hour';
  }
  const m = Math.round(minutes);
  if (m % 60 === 0) {
    const h = m / 60;
    return `${h}-Hour`;
  }
  if (m % 60 === 30) {
    const h = Math.floor(m / 60);
    return `${h}.5-Hour`;
  }
  const hours = Math.round((m / 60) * 10) / 10;
  return `${hours}-Hour`;
}

export function applyHeroDurationToken(
  headlineLine1: string,
  durationMinutes?: number | null
): string {
  const token = formatHeroDurationToken(durationMinutes);
  return headlineLine1.replaceAll('{duration}', token);
}
