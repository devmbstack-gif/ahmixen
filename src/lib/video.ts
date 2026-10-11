export type VideoSource = {
  type: 'youtube' | 'vimeo' | 'file';
  embedUrl: string;
  thumbnailUrl?: string;
};

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts.find((p) => /^\d+$/.test(p));
      return id || null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Parse a review video URL into a playable source, or null if unsupported. */
export function getVideoSource(url: string): VideoSource | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();

  const yt = youtubeId(trimmed);
  if (yt) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  const vim = vimeoId(trimmed);
  if (vim) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vim}?autoplay=1`,
    };
  }

  if (/\.(mp4|webm)(\?.*)?$/i.test(trimmed)) {
    return { type: 'file', embedUrl: trimmed };
  }

  return null;
}
