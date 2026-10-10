'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { TESTIMONIALS, TRUST_LOGOS } from '../data/workshopData';

export const SocialProofMarquee: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [pausedLogos, setPausedLogos] = useState(false);
  const [pausedQuotes, setPausedQuotes] = useState(false);

  const logoTrack = [...TRUST_LOGOS, ...TRUST_LOGOS];
  const quoteTrack = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section
      id="social-proof"
      className="section-y-sm overflow-hidden bg-transparent"
      aria-label="Tools covered and attendee feedback"
    >
      <div className="container-page mb-5 sm:mb-6 text-center">
        <p className="type-micro">Tools we cover · voices from the room</p>
      </div>

      {/* Logo marquee */}
      <div
        className="marquee-fade relative mb-5 sm:mb-6"
        onMouseEnter={() => setPausedLogos(true)}
        onMouseLeave={() => setPausedLogos(false)}
      >
        <div
          className={`marquee-track marquee-track-logos ${
            reduceMotion ? '' : 'marquee-run'
          } ${pausedLogos && !reduceMotion ? 'marquee-paused' : ''}`}
        >
          {logoTrack.map((logo, i) => (
            <span key={`${logo.id}-${i}`} className="marquee-logo-pill">
              {logo.name}
            </span>
          ))}
        </div>
      </div>

      {/* Testimonials marquee (opposite direction) */}
      <div
        className="marquee-fade relative"
        onMouseEnter={() => setPausedQuotes(true)}
        onMouseLeave={() => setPausedQuotes(false)}
      >
        <div
          className={`marquee-track marquee-track-quotes ${
            reduceMotion ? '' : 'marquee-run-reverse'
          } ${pausedQuotes && !reduceMotion ? 'marquee-paused' : ''}`}
        >
          {quoteTrack.map((t, i) => (
            <figure key={`${t.id}-${i}`} className="marquee-quote-card">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star
                    key={s}
                    className="w-3 h-3 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="text-sm text-[var(--text-secondary)] leading-snug line-clamp-2">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-2.5 flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${t.gradient} flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {t.avatarInitials}
                </span>
                <span className="text-xs font-semibold text-[var(--text-main)]">
                  {t.name}
                  <span className="font-normal text-[var(--text-secondary)]"> · {t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
