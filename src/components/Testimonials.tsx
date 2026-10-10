'use client';

import { Star } from 'lucide-react';
import { TESTIMONIALS } from '../data/workshopData';
import { Reveal } from './Reveal';

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-10 sm:py-12 md:py-14 border-t border-[var(--border-subtle)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            What Attendees <span className="gradient-text-ahmixen">Say</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Short feedback from recent cohorts.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, index) => (
            <Reveal key={t.id} delay={index * 0.06}>
              <blockquote className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] space-y-4 h-full">
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${t.gradient} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {t.avatarInitials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-main)]">{t.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{t.role}</div>
                  </div>
                </div>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
