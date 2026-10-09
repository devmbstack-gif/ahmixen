import React from 'react';
import { Play, ArrowRight, Video } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface WorkshopPreviewProps {
  onOpenVideo: () => void;
  onOpenRegister: () => void;
}

export const WorkshopPreview: React.FC<WorkshopPreviewProps> = ({
  onOpenVideo,
  onOpenRegister,
}) => {
  return (
    <section id="preview" className="py-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-900/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-badge text-xs font-semibold">
            <Video className="w-3.5 h-3.5" />
            <span>CURRICULUM PREVIEW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            See the Power of <span className="gradient-text-ahmixen">Applied AI Workflows</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            Take a 2-minute glimpse into how our live cohorts transition from basic prompting to engineering production-grade autonomous agent pipelines.
          </p>
        </div>

        {/* Video Card Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Card Frame with Glow Effect */}
          <div className="relative rounded-3xl overflow-hidden glass-panel border border-[var(--border-subtle)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
            
            {/* Custom High-Tech Video Thumbnail Canvas */}
            <div
              className="relative aspect-video w-full bg-gradient-to-tr from-[#050505] via-[#110d21] to-[#1e1338] flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={onOpenVideo}
              role="button"
              tabIndex={0}
              aria-label="Play workshop teaser video preview"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenVideo();
                }
              }}
            >
              {/* Geometric Grid Overlay */}
              <div className="absolute inset-0 tech-grid-pattern opacity-60" />
              
              {/* Radial Ambient Core */}
              <div className="absolute w-96 h-96 rounded-full bg-purple-600/25 blur-[100px] group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

              {/* Decorative Mock Interface Graphics */}
              <div className="absolute inset-8 rounded-2xl border border-purple-500/10 pointer-events-none hidden sm:block">
                <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono text-purple-300/80">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span>SESSION_SIMULATION // 02:30 TEASER</span>
                </div>
                <div className="absolute bottom-4 right-4 text-xs font-mono text-purple-400/60">
                  LIVE STREAM RESOLUTION: 4K UHD
                </div>
              </div>

              {/* Central Glowing Play Button */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="relative">
                  {/* Ping Ring */}
                  <span className="absolute -inset-3 rounded-full bg-purple-500/30 animate-ping pointer-events-none" />
                  {/* Main Play Circle */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full btn-ahmixen flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.7)] group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1.5 transition-transform group-hover:scale-105" />
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-sm sm:text-base font-bold text-white tracking-wide block drop-shadow-md">
                    Click To Watch Workshop Teaser
                  </span>
                  <span className="text-xs text-purple-200/80 block mt-0.5">
                    2.5-Hour Masterclass Preview • Zero Fluff
                  </span>
                </div>
              </div>

              {/* Bottom Gradient Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-purple-600/80 text-white text-xs font-bold uppercase tracking-wider">
                    HD Preview
                  </span>
                  <span className="text-sm font-semibold text-white drop-shadow">
                    Interactive AI Masterclass Walkthrough
                  </span>
                </div>
                <span className="text-xs text-purple-300 font-mono hidden sm:inline">
                  OCT 24 • 7:00 PM PKT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reassurance & Social Proof Bar Under Video */}
        <div className="mt-10 flex flex-col items-center justify-center space-y-5 text-center">
          
          {/* Reservation Prompt */}
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl">
            Reserve your spot for the live interactive cohort. Seats are strictly capped at 100 participants to ensure direct instructor interaction and personalized Q&amp;A.
          </p>

          {/* Quick CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              id="preview-reserve-cta"
              onClick={onOpenRegister}
              className="btn-ahmixen py-3.5 px-8 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(124,58,237,0.35)] cursor-pointer"
            >
              <span>Reserve My Seat Today</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Live Scarcity Counter Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/25 text-xs sm:text-sm text-red-400 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider">Live Availability:</span>
            <span>Only {WORKSHOP_CONFIG.seatsRemaining} seats remaining for the upcoming cohort</span>
          </div>

          {/* Avatar Stack Social Proof */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2.5 rtl:space-x-reverse overflow-hidden">
              <div className="inline-block h-9 w-9 rounded-full ring-2 ring-[var(--card-bg)] bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                AR
              </div>
              <div className="inline-block h-9 w-9 rounded-full ring-2 ring-[var(--card-bg)] bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white">
                SJ
              </div>
              <div className="inline-block h-9 w-9 rounded-full ring-2 ring-[var(--card-bg)] bg-gradient-to-tr from-indigo-600 to-purple-800 flex items-center justify-center text-xs font-bold text-white">
                TM
              </div>
              <div className="inline-block h-9 w-9 rounded-full ring-2 ring-[var(--card-bg)] bg-gradient-to-tr from-fuchsia-600 to-pink-600 flex items-center justify-center text-xs font-bold text-white">
                ER
              </div>
              <div className="inline-block h-9 w-9 rounded-full ring-2 ring-[var(--card-bg)] bg-[var(--card-bg)] border border-[var(--border-highlight)] flex items-center justify-center text-[10px] font-extrabold text-purple-300">
                +1.2k
              </div>
            </div>
            <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
              Trusted by 1,250+ ambitious professionals worldwide
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
