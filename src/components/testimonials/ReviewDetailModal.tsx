'use client';

import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Star, X } from 'lucide-react';
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

type Props = {
  reviews: Review[];
  index: number | null;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
};

export function ReviewDetailModal({ reviews, index, onClose, onChangeIndex }: Props) {
  const reduceMotion = useReducedMotion();
  const open = index !== null && reviews[index] != null;
  const review = open ? reviews[index]! : null;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const source = review?.videoUrl ? getVideoSource(review.videoUrl) : null;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, index]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowRight' && reviews.length > 1) {
        e.preventDefault();
        onChangeIndex(((index ?? 0) + 1) % reviews.length);
      }
      if (e.key === 'ArrowLeft' && reviews.length > 1) {
        e.preventDefault();
        onChangeIndex(((index ?? 0) - 1 + reviews.length) % reviews.length);
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], iframe, video, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, reviews.length, onClose, onChangeIndex]);

  return (
    <AnimatePresence>
      {open && review && (
        <motion.div
          className="tp-modal"
          role="dialog"
          aria-modal="true"
          aria-label={review.name}
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
        >
          <button
            type="button"
            className="tp-modal-backdrop"
            aria-label="Close"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            className="tp-modal-panel"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: EASE }}
          >
            <button
              ref={closeRef}
              type="button"
              className="tp-modal-close nav-focus"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {source && (
              <div className="tp-modal-video">
                {source.type === 'file' ? (
                  <video
                    key={source.embedUrl}
                    src={source.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="tp-modal-video-el"
                  />
                ) : (
                  <iframe
                    key={source.embedUrl}
                    src={source.embedUrl}
                    title={review.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="tp-modal-video-el"
                  />
                )}
              </div>
            )}

            <div className="tp-modal-body">
              <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-transparent text-[var(--border-subtle)]'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>

              <p className={`tp-modal-quote${source ? '' : ' tp-modal-quote-lg'}`}>
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="tp-modal-person">
                <div
                  className={`tp-card-avatar bg-gradient-to-tr ${avatarGradient(review.id)}`}
                  aria-hidden="true"
                >
                  {initials(review.name)}
                </div>
                <div>
                  <div id={titleId} className="tp-card-name">
                    {review.name}
                  </div>
                  <div className="tp-card-role">{review.role}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
