import React from 'react';
import { Users, TrendingUp, ArrowRight } from 'lucide-react';
import { COMMUNITY_STATS, MARKET_INSIGHTS } from '../data/workshopData';

interface CommunityStatsProps {
  onOpenRegister: () => void;
}

export const CommunityStats: React.FC<CommunityStatsProps> = ({ onOpenRegister }) => {
  return (
    <section id="community" className="py-20 relative bg-[var(--bg-secondary)]/60 backdrop-blur-sm border-y border-[var(--border-subtle)]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 ambient-side-glow pointer-events-none opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-badge text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>COMMUNITY ACCELERATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Backed by Numbers, <span className="gradient-text-ahmixen">Proven by Outcomes</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            Join hundreds of proactive builders, creators, and engineers learning practical AI systems that compound efficiency.
          </p>
        </div>

        {/* 4 Core Quantitative Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {COMMUNITY_STATS.map((stat) => (
            <div
              key={stat.id}
              className="glass-panel p-6 sm:p-7 rounded-3xl border border-[var(--border-subtle)] glass-panel-hover transition-all duration-300 relative group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-main)] gradient-text-ahmixen group-hover:scale-105 transition-transform origin-left">
                  {stat.value}
                </div>
                <div className="text-base font-bold text-[var(--text-main)]">
                  {stat.label}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-4 leading-relaxed">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>

        {/* The Industry Shift / Market Context (Inspired by reference layout) */}
        <div className="mt-8 pt-10 border-t border-[var(--border-subtle)]">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>THE 2026 AI INFLECTION</span>
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Work Isn&apos;t Disappearing — It&apos;s Shifting to <span className="text-purple-400">AI Operators</span>
            </h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">
              Leading global economic research indicates that professionals who orchestrate AI models deliver output in hours that previously demanded weeks of manual labor.
            </p>
          </div>

          {/* 3 Market Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {MARKET_INSIGHTS.map((insight, index) => (
              <div
                key={index}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-[var(--border-subtle)] flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {insight.tag}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                      {insight.source}
                    </span>
                  </div>
                  
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                    {insight.metric}
                  </div>

                  <h4 className="text-base font-bold text-[var(--text-main)]">
                    {insight.headline}
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Call to Action within Community Section */}
          <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-[var(--card-bg)] to-violet-950/20 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2 max-w-xl">
              <h4 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
                Don&apos;t Fall Behind the Curve — Get Hands-On Today
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Spend 2.5 focused hours with us and gain actionable automation capabilities you will use every single week.
              </p>
            </div>

            <button
              type="button"
              id="community-join-cta"
              onClick={onOpenRegister}
              className="btn-ahmixen py-3.5 px-7 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shrink-0 shadow-lg cursor-pointer"
            >
              <span>Join the 2.5-Hour Cohort</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
