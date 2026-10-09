import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ShieldCheck, Mail, User, Briefcase, ArrowRight, Sparkles } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Founder / Entrepreneur',
    goal: 'AI Agents & Workflow Automation',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsSubmitted(false);
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.email.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-xl glass-panel rounded-3xl overflow-hidden border border-[var(--border-highlight)] shadow-[0_25px_60px_-15px_rgba(124,58,237,0.5)] bg-[var(--card-bg)] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-black/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h3 id="registration-modal-title" className="text-sm sm:text-base font-bold text-[var(--text-main)]">
              {isSubmitted ? 'Reservation Confirmed' : 'Reserve Your Cohort Seat'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration modal"
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    {WORKSHOP_CONFIG.priceEarlyBird.label}
                  </div>
                  <div className="text-xl font-extrabold text-[var(--text-main)]">
                    {WORKSHOP_CONFIG.priceEarlyBird.amount}{' '}
                    <span className="text-xs text-[var(--text-secondary)] font-normal">
                      ({WORKSHOP_CONFIG.priceEarlyBird.savings})
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs text-[var(--text-secondary)]">
                  <div className="font-medium text-[var(--text-main)]">{WORKSHOP_CONFIG.date}</div>
                  <div>{WORKSHOP_CONFIG.duration} • Live Zoom / Stream</div>
                </div>
              </div>

              {/* Notice that this is Phase 1 frontend */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Frontend Demonstration: Fill in your details below to test the instant confirmation workflow. No payment is processed in this phase.
                </span>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl glass-panel border border-[var(--border-subtle)] focus:border-purple-400 text-sm text-[var(--text-main)] bg-[var(--card-bg)] placeholder-[var(--text-secondary)]/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Email Address (For Zoom Access &amp; Replays) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl glass-panel border border-[var(--border-subtle)] focus:border-purple-400 text-sm text-[var(--text-main)] bg-[var(--card-bg)] placeholder-[var(--text-secondary)]/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Role / Background */}
                <div>
                  <label htmlFor="reg-role" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Professional Background / Role
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      id="reg-role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl glass-panel border border-[var(--border-subtle)] focus:border-purple-400 text-sm text-[var(--text-main)] bg-[var(--card-bg)] focus:outline-none"
                    >
                      <option value="Founder / Entrepreneur" className="bg-[#111019] text-white">Founder / Entrepreneur</option>
                      <option value="Software Engineer / Developer" className="bg-[#111019] text-white">Software Engineer / Developer</option>
                      <option value="Product Designer / UI/UX" className="bg-[#111019] text-white">Product Designer / UI/UX</option>
                      <option value="Marketing / Growth Specialist" className="bg-[#111019] text-white">Marketing / Growth Specialist</option>
                      <option value="Operations / Project Manager" className="bg-[#111019] text-white">Operations / Project Manager</option>
                      <option value="Student / Career Switcher" className="bg-[#111019] text-white">Student / Career Switcher</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="submit-reservation-btn"
                className="btn-ahmixen w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Complete Seat Reservation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust Footer */}
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] pt-1">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>100% Satisfaction Guarantee • No Spam Guarantee</span>
              </div>
            </form>
          ) : (
            /* Confirmation Success State */
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-extrabold text-[var(--text-main)]">
                  Seat Successfully Reserved!
                </h4>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                  Thank you, <strong className="text-[var(--text-main)]">{formData.name}</strong>. A confirmation message and private calendar link have been prepared for <strong className="text-purple-300">{formData.email}</strong>.
                </p>
              </div>

              {/* Mock Ticket Preview */}
              <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-purple-500/20 pb-2 text-purple-300">
                  <span>COHORT TICKET: #AHM-2026-LIVE</span>
                  <span className="text-emerald-400">STATUS: CONFIRMED</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[var(--text-secondary)]">
                  <div>ATTENDEE: <span className="text-white font-sans">{formData.name}</span></div>
                  <div>PASS: <span className="text-white font-sans">Early Bird Pass</span></div>
                  <div>DATE: <span className="text-white font-sans">{WORKSHOP_CONFIG.date}</span></div>
                  <div>TIME: <span className="text-white font-sans">{WORKSHOP_CONFIG.time}</span></div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn-ahmixen w-full py-3.5 px-6 rounded-xl font-bold text-sm cursor-pointer"
              >
                Done &amp; Return To Page
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
};
