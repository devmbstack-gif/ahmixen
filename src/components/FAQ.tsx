import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Mail, ArrowRight } from 'lucide-react';
import { FAQS, WORKSHOP_CONFIG } from '../data/workshopData';

export const FAQ: React.FC = () => {
  // Allow toggling accordions, first item open by default
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({
    'faq-1': true,
  });

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="faq" className="py-24 relative bg-[var(--bg-secondary)]/60 backdrop-blur-sm border-t border-[var(--border-subtle)]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-900/10 blur-[150px] pointer-events-none -z-10 opacity-30" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-badge text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>COMMON INQUIRIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Frequently Asked <span className="gradient-text-ahmixen">Questions</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            Everything you need to know about the format, curriculum, technical requirements, and access.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = !!openFaq[faq.id];

            return (
              <div
                key={faq.id}
                className={`glass-panel rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'border-purple-500/40 shadow-[0_8px_25px_rgba(124,58,237,0.1)]'
                    : 'border-[var(--border-subtle)] hover:border-purple-500/30'
                }`}
              >
                <button
                  type="button"
                  id={`btn-${faq.id}`}
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`panel-${faq.id}`}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none"
                >
                  <span className="text-base sm:text-lg font-bold text-[var(--text-main)] leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-purple-500/20 text-purple-300 border-purple-500/30' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`panel-${faq.id}`}
                    role="region"
                    aria-labelledby={`btn-${faq.id}`}
                    className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] animate-in fade-in duration-200"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Help Box */}
        <div className="mt-14 glass-panel rounded-2xl p-6 sm:p-8 border border-[var(--border-subtle)] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)]">
            Have a Question Not Listed Here?
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Our team is happy to assist. Send your inquiry directly and we will respond within 24 hours.
          </p>
          <div className="pt-2">
            <a
              href={`mailto:${WORKSHOP_CONFIG.contactEmail}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>{WORKSHOP_CONFIG.contactEmail}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
