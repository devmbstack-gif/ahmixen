'use client';

import { Play, ArrowRight } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';
import { Reveal } from './Reveal';

interface WorkshopPreviewProps {
  onOpenVideo: () => void;
  onOpenRegister: () => void;
}

export const WorkshopPreview: React.FC<WorkshopPreviewProps> = ({
  onOpenVideo,
  onOpenRegister,
}) => {
  return (
    <section id="preview" className="py-16 md:py-20 border-t border-[var(--border-subtle)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Reveal className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Workshop <span className="gradient-text-ahmixen">Preview</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            A short look at what you&apos;ll cover in the live session.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <button
            type="button"
            onClick={onOpenVideo}
            aria-label="Play workshop teaser video"
            className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--media-surface)] group cursor-pointer text-left"
          >
            <div className="absolute inset-0 tech-grid-pattern opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <span className="ahmixen-play-pulse absolute inset-0 rounded-full" />
                <div className="relative w-16 h-16 rounded-full btn-ahmixen flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>
              </div>
              <span className="text-sm font-semibold text-white drop-shadow">Watch teaser</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-xs text-purple-200 font-medium">
                {WORKSHOP_CONFIG.duration} · Live interactive session
              </span>
            </div>
          </button>
        </Reveal>

        <Reveal delay={0.12} className="flex justify-center">
          <button
            type="button"
            onClick={onOpenRegister}
            className="btn-ahmixen py-3 px-7 rounded-xl font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            Reserve My Seat
            <ArrowRight className="w-4 h-4" />
          </button>
        </Reveal>
      </div>
    </section>
  );
};
