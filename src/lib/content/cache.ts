import { revalidateTag } from 'next/cache';
import type { ContentKey } from './registry';

export const CONTENT_TAGS = {
  testimonials: 'content:testimonials',
  instructor: 'content:instructor',
  mission: 'content:mission',
  media: 'content:media',
  intro: 'content:intro',
  hero: 'content:hero',
  preview: 'content:preview',
  learn: 'content:learn',
  aiJobs: 'content:aiJobs',
  agenda: 'content:agenda',
  stats: 'content:stats',
  pricing: 'content:pricing',
  programs: 'content:programs',
  seo: 'content:seo',
  landing: 'content:landing',
} as const;

export type ContentTagKey = keyof typeof CONTENT_TAGS;

export function revalidateContent(...keys: ContentTagKey[]): void {
  for (const key of keys) {
    try {
      revalidateTag(CONTENT_TAGS[key]);
    } catch (err) {
      console.error(
        '[content revalidate]',
        key,
        err instanceof Error ? err.message : 'failed'
      );
    }
  }
}

export function revalidateContentKey(key: ContentKey): void {
  if (key === 'instructor') {
    revalidateContent('instructor', 'media', 'landing');
    return;
  }
  if (key === 'mission') {
    revalidateContent('mission', 'landing');
    return;
  }
  const tag = key as ContentTagKey;
  if (tag in CONTENT_TAGS) {
    revalidateContent(tag, 'landing', 'media');
  } else {
    revalidateContent('landing');
  }
}
