'use client';

import Link from 'next/link';
import { ArrowUpRight, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { getLandingReviews, type Review } from '../data/reviews';
import { ReviewCard } from './ReviewCard';
import { Reveal } from './Reveal';

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

function FeaturedCard({ review, reduceMotion }: { review: Review; reduceMotion: boolean | null }) {
  return (
    <motion.figure
      className="reviews-card reviews-card-featured"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: EASE }}
    >
      <Stars rating={review.rating} />
      <blockquote className="reviews-featured-quote">
        &ldquo;{review.text}&rdquo;
      </blockquote>
      <figcaption className="reviews-person reviews-person-featured">
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

export const Testimonials: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const reviews = getLandingReviews();

  if (reviews.length === 0) return null;

  const featured =
    reviews.find((r) => r.featured) ?? reviews[0];
  const rest = reviews.filter((r) => r.id !== featured.id);

  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const averageLabel = average.toFixed(1);

  return (
    <section
      id="testimonials"
      className="section-y bg-transparent"
      aria-labelledby="testimonials-heading"
    >
      <div className="container-narrow">
        <Reveal className="text-center max-w-2xl mx-auto mb-5 sm:mb-6 space-y-2">
          <h2 id="testimonials-heading" className="type-title text-ink">
            What Attendees <span className="gradient-text-ahmixen">Say</span>
          </h2>
          <p className="type-body">Short feedback from recent cohorts.</p>
        </Reveal>

        <div className="reviews-average" aria-label={`${averageLabel} out of 5`}>
          <div className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="reviews-average-score">{averageLabel}</span>
        </div>

        <div className="reviews-bento">
          <FeaturedCard review={featured} reduceMotion={reduceMotion} />
          {rest.length > 0 && (
            <div
              className={`reviews-side reviews-side-n${Math.min(rest.length, 4)}`}
              data-count={rest.length}
            >
              {rest.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  index={index}
                  clampText
                />
              ))}
            </div>
          )}
        </div>

        <div className="reviews-link-wrap">
          <Link href="/testimonials" className="reviews-link nav-focus">
            Testimonials
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};
