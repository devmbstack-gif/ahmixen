'use client';

import Image from 'next/image';
import { Play, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Review } from '../../data/reviews';
import { getVideoSource } from '../../lib/video';

const EASE = [0.16, 1, 0.3, 1] as const;

const AVATAR_GRADIENTS = [
  'from-purple-500 to-indigo-600',
  'from-violet-600 to-purple-800',
  'from-fuchsia-600 to-purple-600',
  'from-purple-600 to-violet-500',
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function avatarGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[hash] ?? AVATAR_GRADIENTS[0];
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[var(--border-subtle)]'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

type Props = {
  review: Review;
  index: number;
  onOpen: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
};

export function TestimonialsCatalogCard({ review, index, onOpen, buttonRef }: Props) {
  const reduceMotion = useReducedMotion();
  const source = review.videoUrl ? getVideoSource(review.videoUrl) : null;
  const hasVideo = Boolean(source);
  const thumb = review.thumbnail || source?.thumbnailUrl || null;
  const gradient = avatarGradient(review.id);

  return (
    <motion.div
      className="tp-card-wrap"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.45,
        delay: reduceMotion ? 0 : Math.min(index, 5) * 0.05,
        ease: EASE,
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="tp-card nav-focus"
        onClick={onOpen}
        aria-label={review.name}
      >
        <div className="tp-card-media">
          {review.featured && (
            <span className="tp-featured-badge" aria-hidden="true">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
          )}

          {hasVideo ? (
            <>
              {thumb ? (
                <Image
                  src={thumb}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="tp-card-thumb object-cover object-[50%_25%]"
                  loading="lazy"
                />
              ) : (
                <div className={`tp-card-thumb-fallback bg-gradient-to-tr ${gradient}`} />
              )}
              <span className="tp-card-media-fade" aria-hidden="true" />
              <span className="tp-play" aria-hidden="true">
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              </span>
            </>
          ) : (
            <div className="tp-quote-panel">
              <div
                className={`tp-quote-avatar bg-gradient-to-tr ${gradient}`}
                aria-hidden="true"
              >
                {initials(review.name)}
              </div>
              <Stars rating={review.rating} size="md" />
            </div>
          )}
        </div>

        <div className="tp-card-body">
          {hasVideo && <Stars rating={review.rating} />}
          <p className="tp-card-text line-clamp-3">&ldquo;{review.text}&rdquo;</p>
          <div className="tp-card-person">
            <div
              className={`tp-card-avatar bg-gradient-to-tr ${gradient}`}
              aria-hidden="true"
            >
              {initials(review.name)}
            </div>
            <div>
              <div className="tp-card-name">{review.name}</div>
              <div className="tp-card-role">{review.role}</div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
