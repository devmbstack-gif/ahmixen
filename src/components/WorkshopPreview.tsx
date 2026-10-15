'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';
import { Reveal } from './Reveal';
import { useReserveFlow } from './checkout/ReserveFlowProvider';

interface WorkshopPreviewProps {
  videoUrl: string;
  durationLabel: string;
  heading: string;
  posterUrl?: string | null;
}

export const WorkshopPreview: React.FC<WorkshopPreviewProps> = ({
  videoUrl,
  durationLabel,
  heading,
  posterUrl,
}) => {
  const { startWorkshopReserveFlow, workshopCta } = useReserveFlow();
  const label =
    workshopCta.label === 'Reserve' ? 'Reserve My Seat' : workshopCta.label;

  const parts = heading.split(/\s+[—–-]\s+/);
  const headingBefore = parts.length > 1 ? parts.slice(0, -1).join(' — ') : heading;
  const headingAccent = parts.length > 1 ? parts[parts.length - 1] : '';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    try {
      await video.play();
      setIsPlaying(true);
      setNeedsGesture(false);
    } catch {
      // Browsers often block unmuted autoplay until a user gesture.
      setIsPlaying(false);
      setNeedsGesture(true);
    }
  }, []);

  const handleManualPlay = useCallback(() => {
    void tryPlay();
  }, [tryPlay]);

  useEffect(() => {
    const frame = frameRef.current;
    const video = videoRef.current;
    if (!frame || !video || !videoUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          void tryPlay();
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.45, 0.6, 1] }
    );

    observer.observe(frame);
    return () => observer.disconnect();
  }, [tryPlay, videoUrl]);

  return (
    <section
      id="preview"
      className="pt-8 md:pt-10 lg:pt-6 pb-[var(--section-y)] bg-transparent"
      aria-labelledby="preview-heading"
    >
      <div className="container-narrow space-y-6">
        <Reveal className="text-center">
          <h2 id="preview-heading" className="type-title text-ink">
            {headingAccent ? (
              <>
                {headingBefore}{' '}
                <span className="gradient-text-ahmixen">{headingAccent}</span>
              </>
            ) : (
              headingBefore
            )}
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            ref={frameRef}
            className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--media-surface)] shadow-[0_20px_50px_-24px_rgba(124,58,237,0.55)]"
          >
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl || undefined}
              className="absolute inset-0 h-full w-full object-cover bg-black"
              playsInline
              preload="metadata"
              controls={isPlaying}
              onPlay={() => {
                setIsPlaying(true);
                setNeedsGesture(false);
              }}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            {!posterUrl && !isPlaying && (
              <div className="absolute inset-0 tech-grid-pattern opacity-40 pointer-events-none" />
            )}

            {!isPlaying && (
              <button
                type="button"
                onClick={handleManualPlay}
                aria-label="Play workshop teaser video"
                className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 cursor-pointer text-left group"
              >
                <div className="relative">
                  <span className="ahmixen-play-pulse absolute inset-0 rounded-full" />
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full btn-ahmixen flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white ml-1" />
                  </div>
                </div>
                <span className="text-sm sm:text-base font-semibold text-white drop-shadow">
                  {needsGesture ? 'Tap to play with sound' : 'Watch teaser'}
                </span>
              </button>
            )}

            {!isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 z-[1] p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <span className="text-xs sm:text-sm text-purple-200 font-medium">
                  {durationLabel || WORKSHOP_CONFIG.duration} · Live interactive session
                </span>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.12} className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (!workshopCta.disabled) {
                startWorkshopReserveFlow(null, {
                  forTitle: 'Live AI Workshop',
                });
              }
            }}
            disabled={workshopCta.disabled}
            aria-disabled={workshopCta.disabled}
            className="btn-ahmixen py-3 px-7 rounded-xl font-semibold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {label}
            {!workshopCta.disabled ? <ArrowRight className="w-4 h-4" /> : null}
          </button>
        </Reveal>
      </div>
    </section>
  );
};
