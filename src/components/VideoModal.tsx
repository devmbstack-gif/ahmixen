import React, { useEffect, useState } from 'react';
import { X, Play, Pause, Volume2, Maximize, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, onOpenRegister }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsPlaying(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl glass-panel rounded-3xl overflow-hidden border border-[var(--border-highlight)] shadow-[0_25px_60px_-15px_rgba(124,58,237,0.5)] bg-[var(--card-bg)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-black/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h3 id="video-modal-title" className="text-sm sm:text-base font-bold text-[var(--text-main)] truncate">
              {WORKSHOP_CONFIG.brandName} Workshop Teaser & Walkthrough Preview
            </h3>
          </div>
          <button
            type="button"
            id="close-video-modal-btn"
            onClick={onClose}
            aria-label="Close video preview modal"
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Area */}
        <div className="relative aspect-video w-full bg-gradient-to-br from-black via-[#0d0a17] to-[#160f29] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
          
          {/* Subtle Ambient Background Grids & Orbs */}
          <div className="absolute inset-0 tech-grid-pattern opacity-40 pointer-events-none" />
          <div className="absolute w-72 h-72 bg-purple-600/20 rounded-full blur-[90px] pointer-events-none" />

          {/* Interactive Player Placeholder Content */}
          <div className="relative z-10 max-w-lg space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full purple-badge text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TEASER PREVIEW PLAYER</span>
            </div>

            <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Watch What You&apos;ll Build in 2.5 Hours
            </h4>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Experience the live workshop curriculum overview. This player is ready for video embed (Loom / YouTube / Vimeo). The full live session streams interactively on {WORKSHOP_CONFIG.date}.
            </p>

            {/* Play/Pause Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full btn-ahmixen flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.6)] hover:scale-110 transition-transform cursor-pointer mx-auto"
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                )}
              </button>
            </div>
            
            <div className="text-[11px] text-purple-300 font-mono">
              {isPlaying ? '▶ Preview Simulation Playing (0:45 / 2:30)' : 'Click play to simulate playback'}
            </div>
          </div>

          {/* Mock Video Control Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 to-transparent flex flex-col gap-2">
            {/* Progress Scrub Bar */}
            <div
              className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
              onClick={() => setProgress((prev) => (prev >= 80 ? 20 : prev + 25))}
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-white transition-colors"
                  aria-label="Toggle playback"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="font-mono text-[11px]">00:38 / 02:30</span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 cursor-pointer hover:text-white" />
                <Maximize className="w-4 h-4 cursor-pointer hover:text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Reassurance & Action */}
        <div className="p-6 bg-black/50 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Live Q&A with Instructor
            </span>
            <span className="hidden sm:inline text-gray-600">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Templates & Code Repository
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="btn-ahmixen w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Reserve Your Seat Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
