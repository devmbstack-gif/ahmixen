'use client';

import { CheckCircle2 } from 'lucide-react';
import { INSTRUCTOR_DATA } from '../data/workshopData';
import { Reveal } from './Reveal';

export const Instructor: React.FC = () => {
  return (
    <section id="instructor" className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-10 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Your <span className="gradient-text-ahmixen">Instructor</span>
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)]">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 flex items-center justify-center text-2xl font-extrabold text-white shrink-0 shadow-lg">
              AR
            </div>

            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-[var(--text-main)]">
                  {INSTRUCTOR_DATA.name}
                </h3>
                <p className="text-sm font-medium text-purple-400 mt-0.5">
                  {INSTRUCTOR_DATA.title}
                </p>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {INSTRUCTOR_DATA.bio}
              </p>
              <ul className="space-y-2">
                {INSTRUCTOR_DATA.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-center sm:justify-start gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
