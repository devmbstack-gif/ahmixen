import type { UtmPayload } from './types';

const STORAGE_KEY = 'ahmixen_attribution';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

type Stored = {
  utm: UtmPayload;
  referrer: string;
  savedAt: number;
};

function clamp(value: string): string {
  return value.trim().slice(0, 100);
}

function emptyUtm(): UtmPayload {
  return { source: '', medium: '', campaign: '', content: '', term: '' };
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(data: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage blocked */
  }
}

/** Capture UTM + referrer hostname on first public visit (30-day TTL). */
export function captureAttributionFromUrl(search: string, referrer: string) {
  try {
    if (readStored()) return;
    const params = new URLSearchParams(search);
    const utm = emptyUtm();
    let hasUtm = false;
    for (const key of UTM_KEYS) {
      const v = params.get(key);
      if (v) {
        hasUtm = true;
        const field = key.replace('utm_', '') as keyof UtmPayload;
        utm[field] = clamp(v);
      }
    }
    let host = '';
    if (referrer) {
      try {
        host = clamp(new URL(referrer).hostname);
      } catch {
        host = '';
      }
    }
    if (!hasUtm && !host) return;
    writeStored({ utm, referrer: host, savedAt: Date.now() });
  } catch {
    /* ignore */
  }
}

export function getAttribution(): { utm: UtmPayload; referrer: string } {
  const stored = readStored();
  if (!stored) return { utm: emptyUtm(), referrer: '' };
  return {
    utm: {
      source: clamp(stored.utm?.source || ''),
      medium: clamp(stored.utm?.medium || ''),
      campaign: clamp(stored.utm?.campaign || ''),
      content: clamp(stored.utm?.content || ''),
      term: clamp(stored.utm?.term || ''),
    },
    referrer: clamp(stored.referrer || ''),
  };
}
