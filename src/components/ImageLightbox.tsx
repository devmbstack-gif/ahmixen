import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface LightboxItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  description?: string;
  badge?: string;
  meta?: string;
}

interface ImageLightboxProps {
  isOpen: boolean;
  item: LightboxItem | null;
  items?: LightboxItem[];
  currentIndex?: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  item,
  items = [],
  currentIndex = 0,
  onClose,
  onNavigate,
}) => {
  const [scale, setScale] = useState(1);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Focus management: preserve focus on open and restore on close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      setScale(1);
      // Move focus to modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard navigation: Escape to close, arrows to navigate, +/- for zoom
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' && onNavigate && items.length > 1) {
        e.preventDefault();
        onNavigate((currentIndex + 1) % items.length);
        setScale(1);
      } else if (e.key === 'ArrowLeft' && onNavigate && items.length > 1) {
        e.preventDefault();
        onNavigate((currentIndex - 1 + items.length) % items.length);
        setScale(1);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale((prev) => Math.min(prev + 0.25, 2.5));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setScale((prev) => Math.max(prev - 0.25, 0.75));
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setScale(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length, onClose, onNavigate]);

  const activeItem = item || (items.length > 0 ? items[currentIndex] : null);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setScale(1);

  return (
    <AnimatePresence>
      {isOpen && activeItem && (
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title || 'Image preview lightbox'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none focus:outline-none"
        >
          {/* Main Lightbox Modal Window */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[92vh] glass-panel rounded-3xl overflow-hidden border border-[var(--border-highlight)] shadow-[0_25px_70px_rgba(124,58,237,0.45)] bg-[#090810] flex flex-col"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] bg-black/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-main)] truncate">
                    {activeItem.title}
                  </h3>
                  {activeItem.meta && (
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block truncate">
                      {activeItem.meta}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Zoom Out */}
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.75}
                  aria-label="Zoom out"
                  title="Zoom out (-)"
                  className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Scale readout / reset */}
                <button
                  type="button"
                  onClick={handleResetZoom}
                  aria-label="Reset zoom"
                  title="Reset zoom (R or 0)"
                  className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-white/5 border border-white/10 text-purple-300 hover:text-white transition-colors cursor-pointer"
                >
                  {Math.round(scale * 100)}%
                </button>

                {/* Zoom In */}
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 2.5}
                  aria-label="Zoom in"
                  title="Zoom in (+)"
                  className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  id="close-lightbox-btn"
                  onClick={onClose}
                  aria-label="Close image lightbox"
                  title="Close (Escape)"
                  className="p-2 ml-1 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-red-500/20 hover:border-red-500/40 border border-transparent transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Canvas Viewer */}
            <div className="relative flex-1 min-h-[320px] max-h-[68vh] overflow-hidden bg-black/60 flex items-center justify-center p-4">
              {/* Subtle Tech Grid Background */}
              <div className="absolute inset-0 tech-grid-pattern opacity-30 pointer-events-none" />

              {/* Prev Gallery Button */}
              {items.length > 1 && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate((currentIndex - 1 + items.length) % items.length);
                    setScale(1);
                  }}
                  aria-label="Previous image"
                  className="absolute left-4 z-20 p-3 rounded-full bg-black/70 border border-purple-500/30 text-white hover:bg-purple-600/80 transition-all shadow-xl hover:scale-110 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Image Preview with Smooth Scaling */}
              <div className="relative max-w-full max-h-full flex items-center justify-center overflow-auto p-2">
                <motion.img
                  key={activeItem.src}
                  src={activeItem.src}
                  alt={activeItem.alt}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale }}
                  transition={{ duration: 0.2 }}
                  className="max-h-[62vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl"
                />
              </div>

              {/* Next Gallery Button */}
              {items.length > 1 && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate((currentIndex + 1) % items.length);
                    setScale(1);
                  }}
                  aria-label="Next image"
                  className="absolute right-4 z-20 p-3 rounded-full bg-black/70 border border-purple-500/30 text-white hover:bg-purple-600/80 transition-all shadow-xl hover:scale-110 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bottom Caption Bar */}
            <div className="px-6 py-4 bg-black/50 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  {activeItem.badge && (
                    <span className="px-2 py-0.5 rounded-full purple-badge text-[10px] font-bold">
                      {activeItem.badge}
                    </span>
                  )}
                  <span className="font-bold text-[var(--text-main)]">
                    {activeItem.title}
                  </span>
                  {items.length > 1 && (
                    <span className="text-purple-400 font-mono text-[11px]">
                      ({currentIndex + 1} / {items.length})
                    </span>
                  )}
                </div>
                {activeItem.description && (
                  <p className="text-[var(--text-secondary)] leading-relaxed text-xs">
                    {activeItem.description}
                  </p>
                )}
              </div>

              {/* Keyboard shortcut hint */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)] shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Esc</span> close
                <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">+/-</span> zoom
                {items.length > 1 && (
                  <>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">←/→</span> browse
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
