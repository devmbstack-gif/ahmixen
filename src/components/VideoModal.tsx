import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  ArrowRight,
  MonitorPlay,
} from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';
import { getVideoSource, videoEmbedAllow } from '@/lib/video';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  sessionDate: string;
  durationLabel: string;
  instructorName: string;
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
  sessionDate,
  durationLabel,
  instructorName,
  videoUrl = '',
  videoTitle = `${WORKSHOP_CONFIG.brandName} Workshop Teaser & Walkthrough Preview`,
  videoDuration = '02:30',
}) => {
  const embed = videoUrl ? getVideoSource(videoUrl) : null;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(30);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Focus management: preserve focus on open and restore on close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      setIsPlaying(false);
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard controls: Escape to close, Space to toggle play/pause, M for mute
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' || e.code === 'Space') {
        // Toggle play if focus is not on an input/button
        const target = e.target as HTMLElement;
        if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT') {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
        }
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md select-none focus:outline-none"
          style={{ backgroundColor: 'var(--overlay-scrim)' }}
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl glass-panel rounded-3xl overflow-hidden border border-[var(--border-highlight)] shadow-[0_25px_70px_rgba(124,58,237,0.45)] bg-[var(--card-bg)] flex flex-col"
          >
            {/* Modal Top Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--modal-chrome)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
                <h3
                  id="video-modal-title"
                  className="text-sm sm:text-base font-bold text-[var(--text-main)] truncate"
                >
                  {videoTitle}
                </h3>
              </div>
              <button
                type="button"
                id="close-video-modal-btn"
                onClick={onClose}
                aria-label="Close video preview modal"
                title="Close (Escape)"
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--hover-fill)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Canvas Area */}
            <div className="relative aspect-video w-full bg-gradient-to-br from-black via-[#0d0a17] to-[#160f29] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
              {embed?.type === 'file' ? (
                <video
                  key={embed.embedUrl}
                  title={videoTitle}
                  src={embed.embedUrl}
                  className="absolute inset-0 h-full w-full bg-black object-contain"
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                />
              ) : embed ? (
                <iframe
                  title={videoTitle}
                  src={`${embed.embedUrl}${embed.type === 'youtube' ? '?rel=0' : ''}`}
                  className="absolute inset-0 h-full w-full border-0"
                  allow={videoEmbedAllow()}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <>
              {/* Subtle Ambient Background Grids & Orbs */}
              <div className="absolute inset-0 tech-grid-pattern opacity-40 pointer-events-none" />
              <div className="absolute w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

              {/* Interactive Player Placeholder Content */}
              <div className="relative z-10 max-w-lg space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full purple-badge text-xs font-semibold">
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span>TEASER PREVIEW PLAYER • PRODUCTION READY</span>
                </div>

                <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Watch What You&apos;ll Build in {durationLabel}
                </h4>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Experience the live workshop curriculum overview. This player is ready for video embed (Loom / YouTube / Vimeo). The full live session streams interactively on {sessionDate}.
                </p>

                {/* Big Central Play/Pause Trigger */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full btn-ahmixen flex items-center justify-center shadow-[0_0_35px_rgba(147,51,234,0.6)] hover:scale-110 active:scale-95 transition-transform cursor-pointer mx-auto"
                    aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    ) : (
                      <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white ml-1" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-purple-300 font-mono">
                  {isPlaying ? '▶ Preview Simulation Playing (0:45 / ' + videoDuration + ')' : 'Click to simulate video player'}
                </div>
              </div>

              {/* Mock Video Control Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 to-transparent flex flex-col gap-2">
                {/* Progress Scrub Bar */}
                <div
                  className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                  onClick={() => setProgress((prev) => (prev >= 80 ? 20 : prev + 25))}
                  title="Click to seek"
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
                      onClick={togglePlay}
                      className="hover:text-white transition-colors cursor-pointer"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-[11px]">00:45 / {videoDuration}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="hover:text-white transition-colors cursor-pointer"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">Space: Play • M: Mute</span>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>

            {/* Modal Footer Reassurance & Action */}
            <div className="p-5 sm:p-6 bg-[var(--modal-chrome)] border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  Live Q&A with {instructorName}
                </span>
                <span className="hidden sm:inline text-[var(--text-muted)]">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  Code Templates Included
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  onClose();
                  onOpenRegister();
                }}
                className="btn-ahmixen w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Reserve Your Seat Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
