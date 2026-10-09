import React from 'react';
import { User, CheckCircle2 } from 'lucide-react';
import { INSTRUCTOR_DATA } from '../data/workshopData';

export const Instructor: React.FC = () => {
  return (
    <section id="instructor" className="py-24 relative bg-[var(--bg-secondary)]/60 backdrop-blur-sm border-y border-[var(--border-subtle)]">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-purple-700/10 blur-[140px] pointer-events-none -z-10 opacity-60" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-badge text-xs font-semibold">
            <User className="w-3.5 h-3.5" />
            <span>LIVE INSTRUCTOR GUIDANCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Learn from a <span className="gradient-text-ahmixen">Dedicated Systems Builder</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            Taught by an engineer with hundreds of hours spent testing frontier models, designing agent pipelines, and automating complex workflows.
          </p>
        </div>

        {/* Instructor Profile Card */}
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-[var(--border-subtle)] relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Avatar & Visual Frame */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="relative group">
                {/* Glow ring */}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-purple-600 to-violet-400 opacity-60 blur-lg group-hover:opacity-90 transition-opacity" />
                
                {/* Avatar container */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl bg-gradient-to-b from-purple-900/60 to-black border-2 border-purple-500/40 p-2 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
                  {/* High tech abstract avatar */}
                  <div className="w-full h-full rounded-2xl bg-[#0e0c18] flex flex-col items-center justify-center relative tech-grid-pattern">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                      AR
                    </div>
                    <span className="mt-3 text-xs font-mono text-purple-300 font-semibold">
                      @{INSTRUCTOR_DATA.name.toLowerCase().replace(' ', '')}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/90 border border-emerald-500/40 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LEAD INSTRUCTOR
                </div>
              </div>

              {/* Social Links Placeholders */}
              <div className="flex items-center gap-3 mt-8">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl glass-panel border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                  aria-label="Instructor LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.05 1.53 1.53 0 0 0 0 3.05m1.39 9.74v-8.37H5.07v8.37h2.78z"/></svg>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl glass-panel border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                  aria-label="Instructor X / Twitter"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl glass-panel border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                  aria-label="Instructor GitHub"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl glass-panel border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                  aria-label="Instructor YouTube"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            {/* Right Column: Bio & Credentials */}
            <div className="lg:col-span-8 space-y-6 text-left">
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
                  {INSTRUCTOR_DATA.name}
                </h3>
                <p className="text-sm sm:text-base font-semibold text-purple-400 mt-1">
                  {INSTRUCTOR_DATA.title}
                </p>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                  {INSTRUCTOR_DATA.roleDescription}
                </p>
              </div>

              {/* Bio Paragraphs */}
              <div className="space-y-3 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {INSTRUCTOR_DATA.bioParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* 4 Credentials Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {INSTRUCTOR_DATA.credentials.map((cred, idx) => (
                  <div key={idx} className="glass-panel p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-purple-950/10">
                    <div className="text-xl font-extrabold text-[var(--text-main)] gradient-text-ahmixen">
                      {cred.value}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                      {cred.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Highlights List */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                {INSTRUCTOR_DATA.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-main)]">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
