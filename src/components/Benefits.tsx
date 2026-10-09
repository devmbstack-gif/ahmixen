import React from 'react';
import { Cpu, Bot, Sparkles, Code2, Check, ArrowRight, Lightbulb } from 'lucide-react';
import { WORKSHOP_BENEFITS } from '../data/workshopData';

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-6 h-6 text-purple-400" />,
  Bot: <Bot className="w-6 h-6 text-violet-400" />,
  Sparkles: <Sparkles className="w-6 h-6 text-fuchsia-400" />,
  Code2: <Code2 className="w-6 h-6 text-indigo-400" />,
};

interface BenefitsProps {
  onOpenRegister: () => void;
}

export const Benefits: React.FC<BenefitsProps> = ({ onOpenRegister }) => {
  return (
    <section id="benefits" className="py-24 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-badge text-xs font-semibold">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>CORE CURRICULUM TRACKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            What You Will <span className="gradient-text-ahmixen">Actually Master</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            Forget abstract theories. Each track focuses on high-yield, reproducible techniques designed to give you an immediate unfair advantage in your work.
          </p>
        </div>

        {/* 4 Core Topic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {WORKSHOP_BENEFITS.map((benefit) => (
            <div
              key={benefit.id}
              className="glass-panel p-8 rounded-3xl border border-[var(--border-subtle)] glass-panel-hover transition-all duration-300 relative group flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Icon & Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-400 transition-all duration-300 shadow-inner">
                    {iconMap[benefit.iconName] || <Sparkles className="w-6 h-6 text-purple-400" />}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full purple-badge">
                    {benefit.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mb-3 group-hover:text-purple-300 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  {benefit.description}
                </p>

                {/* Key Bullet Takeaways */}
                <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
                  {benefit.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text-main)]">
                      <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="leading-snug">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Subtle Indicator */}
              <div className="mt-8 pt-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span className="font-mono text-purple-400/80">Track // 0{WORKSHOP_BENEFITS.indexOf(benefit) + 1}</span>
                <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1 text-purple-300 font-semibold">
                  Included in live cohort <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Callout */}
        <div className="text-center">
          <button
            type="button"
            id="benefits-reserve-cta"
            onClick={onOpenRegister}
            className="btn-ahmixen py-4 px-9 rounded-2xl font-bold text-base inline-flex items-center gap-3 shadow-lg hover:shadow-purple-500/40 cursor-pointer"
          >
            <span>Learn These Skills Live on Oct 24</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
};
