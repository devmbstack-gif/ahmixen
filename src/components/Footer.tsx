import React from 'react';
import { ArrowUp, Mail, MapPin, MessageSquare } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Workshop Preview', href: '#preview' },
    { label: 'Community Metrics', href: '#community' },
    { label: "What You'll Learn", href: '#benefits' },
    { label: 'Live Agenda', href: '#agenda' },
    { label: 'Instructor Profile', href: '#instructor' },
    { label: 'Registration & Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const tracks = [
    { label: 'AI Fundamentals & Prompting', href: '#benefits' },
    { label: 'Autonomous Agent Pipelines', href: '#benefits' },
    { label: 'Workflow Automation (n8n)', href: '#benefits' },
    { label: 'Vibe Coding & App Building', href: '#benefits' },
  ];

  return (
    <footer className="relative bg-[#030206] text-white pt-20 pb-12 border-t border-[var(--border-subtle)] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-purple-600/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          
          {/* Brand Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block p-1.5 rounded-xl bg-black border border-purple-500/20">
              <img
                src="/ahmixen-logo.png"
                alt="AhmiXen Logo"
                className="h-9 w-auto object-contain"
                width="160"
                height="40"
              />
            </div>

            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              Empowering developers, founders, and professionals to master practical AI systems, autonomous agents, and future-ready workflows.
            </p>

            {/* Contact Placeholders */}
            <div className="space-y-2 text-xs text-gray-400 pt-2">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <a
                  href={`mailto:${WORKSHOP_CONFIG.contactEmail}`}
                  className="hover:text-purple-300 transition-colors"
                >
                  {WORKSHOP_CONFIG.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Global Remote Cohort (Live via Zoom)</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                aria-label="AhmiXen Twitter / X"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                aria-label="AhmiXen LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.05 1.53 1.53 0 0 0 0 3.05m1.39 9.74v-8.37H5.07v8.37h2.78z"/></svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                aria-label="AhmiXen GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                aria-label="AhmiXen YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-400 hover:bg-purple-600/20 transition-all cursor-pointer"
                aria-label="AhmiXen Discord Community"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Column (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {navLinks.slice(0, 5).map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Curriculum Tracks (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Curriculum Tracks
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {tracks.map((track, idx) => (
                <li key={idx}>
                  <a href={track.href} className="hover:text-white transition-colors">
                    {track.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="pt-3">
              <span className="inline-block text-xs font-mono text-purple-300 bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-lg">
                Next Cohort: {WORKSHOP_CONFIG.date}
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} {WORKSHOP_CONFIG.brandName}. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <span className="text-gray-600">Privacy Policy (Placeholder)</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">Terms of Service (Placeholder)</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer ml-2"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
