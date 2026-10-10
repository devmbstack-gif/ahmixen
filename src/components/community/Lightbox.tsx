'use client';

import { useEffect, useId, useRef } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  COMMUNITY_BLUR_DATA_URL,
  type CommunityPhoto,
} from './communityPhotos';

const EASE = [0.16, 1, 0.3, 1] as const;

type LightboxProps = {
  photos: CommunityPhoto[];
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function Lightbox({ photos, index, onClose, onPrev, onNext }: LightboxProps) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const open = index !== null;
  const photo = index !== null ? photos[index] : null;

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          className="community-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.28 }}
        >
          <button
            type="button"
            className="community-lightbox-backdrop"
            aria-label="Close photo"
            onClick={onClose}
          />

          <motion.div
            className="community-lightbox-panel"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: EASE }}
          >
            <p id={titleId} className="sr-only">
              {photo.caption}
            </p>

            <button
              ref={closeRef}
              type="button"
              className="community-lightbox-close"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="community-lightbox-nav community-lightbox-prev"
              aria-label="Previous photo"
              onClick={onPrev}
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="community-lightbox-nav community-lightbox-next"
              aria-label="Next photo"
              onClick={onNext}
            >
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>

            <div className="community-lightbox-frame">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={photo.id}
                  className="community-lightbox-image-wrap"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: EASE }}
                >
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    placeholder="blur"
                    blurDataURL={COMMUNITY_BLUR_DATA_URL}
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="community-lightbox-caption">{photo.caption}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
