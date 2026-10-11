'use client';

import { Star } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Review } from '../data/reviews';

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

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[var(--border-subtle)]'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

type ReviewCardProps = {
  review: Review;
  index?: number;
  /** Landing small cards clamp; full page shows all text */
  clampText?: boolean;
  className?: string;
};

export function ReviewCard({
  review,
  index = 0,
  clampText = false,
  className = '',
}: ReviewCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.figure
      className={`reviews-card reviews-card-small ${className}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.45,
        delay: reduceMotion ? 0 : Math.min(index, 5) * 0.06,
        ease: EASE,
      }}
    >
      <Stars rating={review.rating} />
      <blockquote
        className={`reviews-small-quote${clampText ? ' line-clamp-5' : ''}`}
      >
        &ldquo;{review.text}&rdquo;
      </blockquote>
      <figcaption className="reviews-person">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${avatarGradient(review.id)} flex items-center justify-center text-xs font-bold text-white shrink-0`}
          aria-hidden="true"
        >
          {initials(review.name)}
        </div>
        <div>
          <div className="reviews-person-name">{review.name}</div>
          <div className="reviews-person-role">{review.role}</div>
        </div>
      </figcaption>
    </motion.figure>
  );
}
