'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ShieldCheck, Mail, User, ArrowRight } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
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
      setFormData({ name: '', email: '' });
      previouslyFocusedElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.email.trim()) {
      setIsSubmitted(true);
      // Backend wiring comes later — frontend confirmation only
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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md"
          style={{ backgroundColor: 'var(--overlay-scrim)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden border border-[var(--border-highlight)] bg-[var(--card-bg)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h3
                id="registration-modal-title"
                className="text-base font-bold text-[var(--text-main)]"
              >
                {isSubmitted ? 'Seat reserved' : 'Reserve your seat'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--hover-fill)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {WORKSHOP_CONFIG.date} · {WORKSHOP_CONFIG.time} ·{' '}
                    {WORKSHOP_CONFIG.priceEarlyBird.amount}
                  </p>

                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                    >
                      Full name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-subtle)] text-sm text-[var(--text-main)] bg-[var(--bg-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-subtle)] text-sm text-[var(--text-main)] bg-[var(--bg-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="submit-reservation-btn"
                    className="btn-ahmixen w-full py-3.5 px-6 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Confirm reservation
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Frontend only — no payment yet
                  </p>
                </form>
              ) : (
                <div className="text-center space-y-5 py-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-extrabold text-[var(--text-main)]">
                      You&apos;re on the list
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Thanks, <strong className="text-[var(--text-main)]">{formData.name}</strong>.
                      We&apos;ll use <strong className="text-[var(--purple-soft-text)]">{formData.email}</strong>{' '}
                      when backend email/payment is connected.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ahmixen w-full py-3 rounded-xl font-bold text-sm cursor-pointer"
                  >
                    Done
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
