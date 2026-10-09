import React, { useState } from 'react';
import { CalendarDays, ChevronDown, Clock, CheckCircle, Wrench, Layers, ArrowRight } from 'lucide-react';
import { WORKSHOP_AGENDA } from '../data/workshopData';

interface WorkshopAgendaProps {
  onOpenRegister: () => void;
}

export const WorkshopAgenda: React.FC<WorkshopAgendaProps> = ({ onOpenRegister }) => {
  // Allow multiple accordions open, default first 2 open
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    'module-1': true,
    'module-2': true,
  });

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    WORKSHOP_AGENDA.forEach((m) => {
      allOpen[m.id] = true;
    });
    setOpenModules(allOpen);
  };

  const collapseAll = () => {
    setOpenModules({});
  };

  return (
    <section id="agenda" className="py-24 relative bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] ambient-purple-radial pointer-events-none -z-10 opacity-30" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-badge text-xs font-semibold">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>SESSION BREAKDOWN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            The 2.5-Hour <span className="gradient-text-ahmixen">Live Agenda</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            A carefully timed, high-density walkthrough designed to take you from foundational principles to autonomous agent workflows.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
            >
              Expand All Modules
            </button>
            <span className="text-[var(--border-subtle)]">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[var(--text-secondary)] hover:text-[var(--text-main)] underline font-medium cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Modules Timeline List */}
        <div className="space-y-4">
          {WORKSHOP_AGENDA.map((module) => {
            const isOpen = !!openModules[module.id];

            return (
              <div
                key={module.id}
                className={`glass-panel rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'border-purple-500/40 shadow-[0_10px_30px_rgba(124,58,237,0.12)]'
                    : 'border-[var(--border-subtle)] hover:border-purple-500/30'
                }`}
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer focus-visible:outline-none"
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    {/* Module Number Stamp */}
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-lg font-mono font-extrabold text-purple-300 shrink-0">
                      {module.moduleNumber}
                    </div>

                    {/* Module Titles and Timings */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          {module.timeRange}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          ({module.durationMin})
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] leading-snug">
                        {module.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate mt-0.5 hidden sm:block">
                        {module.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Arrow */}
                  <div
                    className={`w-9 h-9 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-purple-500/20 text-purple-300 border-purple-500/30' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {/* Expanded Accordion Body */}
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[var(--border-subtle)] animate-in fade-in duration-200">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
                      {module.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                      {/* Left: Key Topics List */}
                      <div className="md:col-span-7 space-y-2.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5 mb-2">
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          Key Topics Covered
                        </div>
                        {module.keyTopics.map((topic, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                            <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <span>{topic}</span>
                          </div>
                        ))}
                      </div>

                      {/* Right: Deliverable and Tools Used */}
                      <div className="md:col-span-5 flex flex-col justify-between space-y-4 bg-purple-950/15 p-4 rounded-2xl border border-purple-500/20">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            Live Hands-On Deliverable
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                            {module.handsOnDeliverable}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-purple-400" />
                            Tools Utilized
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {module.toolsUsed.map((tool, i) => (
                              <span
                                key={i}
                                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/40 text-purple-200 border border-purple-500/20"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section Bottom CTA */}
        <div className="mt-14 text-center">
          <button
            type="button"
            id="agenda-reserve-cta"
            onClick={onOpenRegister}
            className="btn-ahmixen py-4 px-8 rounded-2xl font-bold text-base inline-flex items-center gap-3 shadow-lg cursor-pointer"
          >
            <span>Lock In Your Spot For All 5 Modules</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
};
