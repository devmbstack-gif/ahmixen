import React from 'react';
import { Star, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { TESTIMONIALS } from '../data/workshopData';

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-10 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-badge text-xs font-semibold">
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>ALUMNI EXPERIENCES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Loved by Founders, <span className="gradient-text-ahmixen">Engineers &amp; Creators</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            Here is what past cohort participants say about AhmiXen&apos;s practical approach to applied artificial intelligence.
          </p>
          <div className="text-xs text-purple-400/80 bg-purple-500/10 px-3 py-1 rounded-full inline-block border border-purple-500/20">
            Note: Illustrative alumni testimonials placeholder format — easily customizable
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="glass-panel p-8 rounded-3xl border border-[var(--border-subtle)] glass-panel-hover transition-all duration-300 flex flex-col justify-between relative group"
            >
              <div className="space-y-4">
                {/* Star Rating & Verified Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {testimonial.verifiedCohort}
                  </span>
                </div>

                {/* Quote Text */}
                <p className="text-sm sm:text-base text-[var(--text-main)] italic leading-relaxed pt-2">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex items-center gap-4">
                {/* Styled Avatar Initial Pill */}
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${testimonial.gradient} flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0`}
                >
                  {testimonial.avatarInitials}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-bold text-[var(--text-main)] truncate">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {testimonial.role} • <span className="text-purple-300">{testimonial.organization}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats banner beneath testimonials */}
        <div className="mt-14 glass-panel rounded-2xl p-6 border border-[var(--border-subtle)] flex flex-wrap items-center justify-around gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-[var(--text-main)]">4.9 / 5.0</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">Average Cohort Rating</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-[var(--border-subtle)]" />
          <div>
            <div className="text-2xl font-bold text-[var(--text-main)]">98.6%</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">Would Recommend To Peers</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-[var(--border-subtle)]" />
          <div>
            <div className="text-2xl font-bold text-[var(--text-main)]">1,250+</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">Community Members</div>
          </div>
        </div>

      </div>
    </section>
  );
};
