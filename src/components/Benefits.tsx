'use client';

import { Cpu, Bot, Sparkles, Code2 } from 'lucide-react';
import { WORKSHOP_BENEFITS } from '../data/workshopData';
import { Reveal } from './Reveal';

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-5 h-5 text-purple-400" />,
  Bot: <Bot className="w-5 h-5 text-violet-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-fuchsia-400" />,
  Code2: <Code2 className="w-5 h-5 text-indigo-400" />,
};

export const Benefits: React.FC = () => {
  return (
    <section id="benefits" className="py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            What You&apos;ll <span className="gradient-text-ahmixen">Learn</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Four practical topics — clear, focused, and ready to use at work.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {WORKSHOP_BENEFITS.map((benefit, index) => (
            <Reveal key={benefit.id} delay={index * 0.06}>
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  {iconMap[benefit.iconName] || (
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">{benefit.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
