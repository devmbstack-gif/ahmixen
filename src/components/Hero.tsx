import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  Cpu,
} from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface HeroProps {
  onOpenRegister: () => void;
  onExploreWorkshop: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenRegister, onExploreWorkshop }) => {
  return (
    <section
      id="hero"
      className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden tech-grid-pattern"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] ambient-purple-radial pointer-events-none -z-10" />
      <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Workshop Introduction & Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full purple-badge text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
              </span>
              <span className="tracking-wide uppercase">{WORKSHOP_CONFIG.badgeText}</span>
              <span className="text-[var(--border-highlight)]">•</span>
              <span className="text-purple-300 font-medium">Batch 05 Open</span>
            </div>

            {/* Bold Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
              <span>{WORKSHOP_CONFIG.titlePrefix} </span>
              <span className="gradient-text-ahmixen">{WORKSHOP_CONFIG.titleHighlight}</span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 text-[var(--text-secondary)]">
                {WORKSHOP_CONFIG.titleSuffix}
              </span>
            </h1>

            {/* Short Natural Description */}
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl font-normal">
              {WORKSHOP_CONFIG.subtitle}
            </p>

            {/* 3 Compact Workshop Info Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl pt-2">
              <div className="glass-panel rounded-2xl p-3.5 flex items-center gap-3 transition-colors hover:border-[var(--bright-violet)]">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-medium">
                    Duration
                  </div>
                  <div className="text-sm font-bold text-[var(--text-main)]">
                    {WORKSHOP_CONFIG.duration}
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-3.5 flex items-center gap-3 transition-colors hover:border-[var(--bright-violet)]">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-medium">
                    Format
                  </div>
                  <div className="text-sm font-bold text-[var(--text-main)] truncate">
                    {WORKSHOP_CONFIG.deliveryFormat}
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-3.5 flex items-center gap-3 transition-colors hover:border-[var(--bright-violet)]">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-medium">
                    Date
                  </div>
                  <div className="text-sm font-bold text-[var(--text-main)] truncate">
                    {WORKSHOP_CONFIG.date}
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 w-full sm:w-auto">
              <button
                type="button"
                id="hero-reserve-cta"
                onClick={onOpenRegister}
                className="btn-ahmixen py-4 px-8 rounded-2xl font-bold text-base flex items-center justify-center gap-3 group shadow-[0_10px_35px_rgba(124,58,237,0.35)] cursor-pointer"
              >
                <span>Reserve Your Seat</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                id="hero-explore-cta"
                onClick={onExploreWorkshop}
                className="glass-panel py-4 px-7 rounded-2xl font-semibold text-base text-[var(--text-main)] hover:border-[var(--bright-violet)] hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore the Workshop</span>
              </button>
            </div>

            {/* Reassurance Micro-Copy */}
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                No Tech Degree Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                Full HD Replay Access
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                100% Satisfaction Guarantee
              </span>
            </div>
          </div>

          {/* Right Column: Original AI Interface Composition */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            {/* Outer Glow Halo */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600/30 via-violet-600/20 to-purple-800/30 blur-2xl opacity-75" />

            {/* Main Orchestration Panel */}
            <div className="relative glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)]">
              
              {/* Panel Top Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    ahmixen-agent-core v2.6
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                  <Activity className="w-3 h-3 animate-pulse" />
                  PIPELINE LIVE
                </div>
              </div>

              {/* Central Simulation Workflow */}
              <div className="mt-5 space-y-3.5">
                
                {/* Step 1: Objective Intake */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-300 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                      <span>Objective Task</span>
                      <span className="text-purple-400 font-mono">0.14s</span>
                    </div>
                    <div className="text-xs font-medium text-[var(--text-main)] truncate mt-0.5">
                      "Autonomous Market Intelligence & Agent Report"
                    </div>
                  </div>
                </div>

                {/* Step 2: Multi-Agent Tool Loop */}
                <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/30 flex items-center justify-center shrink-0 text-violet-300 mt-0.5">
                    <Zap className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-purple-300">
                      <span>Tool Execution Loop</span>
                      <span className="text-emerald-400 font-mono text-[10px]">VERIFIED ✓</span>
                    </div>
                    <div className="text-xs text-[var(--text-main)] mt-1 space-y-1">
                      <div className="font-mono text-[11px] text-purple-200 flex items-center gap-1.5">
                        <span className="text-purple-400">›</span> search_web(&ldquo;Frontier AI trends 2026&rdquo;)
                      </div>
                      <div className="font-mono text-[11px] text-purple-200 flex items-center gap-1.5">
                        <span className="text-purple-400">›</span> synthesize_report(format=&quot;structured_json&quot;)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Vibe Coding & Tool Creation */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-300 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                      <span>Vibe Prototype Output</span>
                      <span className="text-emerald-400 font-mono">100% Ready</span>
                    </div>
                    <div className="text-xs font-medium text-[var(--text-main)] mt-0.5 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Micro-Tool Deployed to Vercel in 12s
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Highlight Cards */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                
                {/* Floating Metric 1 */}
                <div className="glass-panel p-3 rounded-2xl border border-purple-500/20 bg-purple-900/10">
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-medium">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Stack Covered
                  </div>
                  <div className="text-lg font-extrabold text-[var(--text-main)] mt-1">
                    15+ Tools
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    Claude • n8n • Cursor
                  </div>
                </div>

                {/* Floating Metric 2 */}
                <div className="glass-panel p-3 rounded-2xl border border-purple-500/20 bg-purple-900/10">
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Remaining Seats
                  </div>
                  <div className="text-lg font-extrabold text-amber-300 mt-1">
                    {WORKSHOP_CONFIG.seatsRemaining} / {WORKSHOP_CONFIG.seatsTotal}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    82% Cohort Reserved
                  </div>
                </div>
              </div>

              {/* Bottom Subtle Badge */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--text-secondary)] px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                  Live Instructor Guided
                </span>
                <span className="text-purple-400 font-medium">
                  {WORKSHOP_CONFIG.brandName} Masterclass
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
