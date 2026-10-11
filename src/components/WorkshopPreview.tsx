'use client';

import { Play, ArrowRight } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';
import { Reveal } from './Reveal';
import { useReserveFlow } from './checkout/ReserveFlowProvider';

interface WorkshopPreviewProps {
  onOpenVideo: () => void;
  durationLabel: string;
}

export const WorkshopPreview: React.FC<WorkshopPreviewProps> = ({
  onOpenVideo,
  durationLabel,
}) => {
  const { startReserveFlow, reserveCta } = useReserveFlow();
  const label =
    reserveCta.label === 'Reserve' ? 'Reserve My Seat' : reserveCta.label;

  return (
    <section
      id="preview"
      className="pt-8 md:pt-10 lg:pt-6 pb-[var(--section-y)] bg-transparent"
      aria-labelledby="preview-heading"
    >
      <div className="container-narrow space-y-6">
        <Reveal className="text-center">
          <h2 id="preview-heading" className="type-title text-ink">
            Workshop <span className="gradient-text-ahmixen">Preview</span>
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <button
            type="button"
            onClick={onOpenVideo}
            aria-label="Play workshop teaser video"
            className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--media-surface)] group cursor-pointer text-left shadow-[0_20px_50px_-24px_rgba(124,58,237,0.55)]"
          >
            <div className="absolute inset-0 tech-grid-pattern opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <span className="ahmixen-play-pulse absolute inset-0 rounded-full" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full btn-ahmixen flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white ml-1" />
                </div>
              </div>
              <span className="text-sm sm:text-base font-semibold text-white drop-shadow">
                Watch teaser
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-xs sm:text-sm text-purple-200 font-medium">
                {durationLabel || WORKSHOP_CONFIG.duration} · Live interactive session
              </span>
            </div>
          </button>
        </Reveal>

        <Reveal delay={0.12} className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (!reserveCta.disabled) startReserveFlow();
            }}
            disabled={reserveCta.disabled}
            aria-disabled={reserveCta.disabled}
            className="btn-ahmixen py-3 px-7 rounded-xl font-semibold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {label}
            {!reserveCta.disabled ? <ArrowRight className="w-4 h-4" /> : null}
          </button>
        </Reveal>
      </div>
    </section>
  );
};
