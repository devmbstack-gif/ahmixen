'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Star } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { TestimonialsCatalogCard } from './testimonials/TestimonialsCatalogCard';
import { ReviewDetailModal } from './testimonials/ReviewDetailModal';
import { getAllReviews } from '../data/reviews';

const AnimatedBackground = dynamic(
  () => import('./AnimatedBackground').then((m) => ({ default: m.AnimatedBackground })),
  { ssr: false, loading: () => null }
);

const RegistrationModal = dynamic(
  () => import('./RegistrationModal').then((m) => ({ default: m.RegistrationModal })),
  { ssr: false }
);

export const TestimonialsPage: React.FC = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reviews = getAllReviews();

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

      <Navbar onOpenRegister={() => setRegisterOpen(true)} />

      <main className="testimonials-page flex-1">
        <div className="container-narrow testimonials-page-inner">
          <h1 className="programs-heading purple-badge">Testimonials</h1>

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

      <Footer />

      <ReviewDetailModal
        reviews={reviews}
        index={activeIndex}
        onClose={closeModal}
        onChangeIndex={setActiveIndex}
      />

      {registerOpen && (
        <RegistrationModal
          isOpen={registerOpen}
          onClose={() => setRegisterOpen(false)}
        />
      )}
    </div>
  );
};
