'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MessageSquarePlus, Star } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { TestimonialsCatalogCard } from './testimonials/TestimonialsCatalogCard';
import { ReviewDetailModal } from './testimonials/ReviewDetailModal';
import type { Review } from '../data/reviews';
import type { Instructor as InstructorData } from '../data/instructor';

const AnimatedBackground = dynamic(
  () => import('./AnimatedBackground').then((m) => ({ default: m.AnimatedBackground })),
  { ssr: false, loading: () => null }
);

export const TestimonialsPage: React.FC<{
  reviews: Review[];
  instructor: InstructorData;
}> = ({ reviews, instructor }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const averageLabel =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const closeModal = useCallback(() => {
    const i = activeIndex;
    setActiveIndex(null);
    if (i != null) {
      requestAnimationFrame(() => cardRefs.current[i]?.focus());
    }
  }, [activeIndex]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink transition-colors duration-300 antialiased selection:bg-brand selection:text-white relative">
      <AnimatedBackground />

      <Navbar />

      <main className="testimonials-page flex-1">
        <div className="container-narrow testimonials-page-inner">
          <div className="tp-page-header">
            <h1 className="programs-heading purple-badge tp-page-title">
              Testimonials
            </h1>
            <Link
              href="/feedback"
              className="btn-ahmixen nav-focus tp-review-cta inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
            >
              <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
              Give us a review
            </Link>
          </div>

          {reviews.length > 0 && averageLabel !== null && (
            <>
              <div
                className="reviews-average"
                aria-label={`${averageLabel} out of 5`}
              >
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="reviews-average-score">{averageLabel}</span>
              </div>

              <div className="tp-grid">
                {reviews.map((review, index) => (
                  <TestimonialsCatalogCard
                    key={review.id}
                    review={review}
                    index={index}
                    onOpen={() => setActiveIndex(index)}
                    buttonRef={(el) => {
                      cardRefs.current[index] = el;
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer instructor={instructor} />

      <ReviewDetailModal
        reviews={reviews}
        index={activeIndex}
        onClose={closeModal}
        onChangeIndex={setActiveIndex}
      />
    </div>
  );
};
