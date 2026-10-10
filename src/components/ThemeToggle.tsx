'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, mounted, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="theme-toggle-btn"
      aria-label={
        mounted
          ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
          : 'Toggle color theme'
      }
      title={
        mounted
          ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
          : 'Toggle color theme'
      }
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl transition-[background-color,border-color,box-shadow,color,transform] duration-300 border border-[var(--border-subtle)] bg-[var(--card-bg)] hover:border-[var(--bright-violet)] hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] text-[var(--text-main)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${className}`}
    >
      {!mounted ? (
        <span className="w-5 h-5" aria-hidden="true" />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            className="inline-flex"
            initial={reduceMotion ? false : { opacity: 0, rotate: -40, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, rotate: 40, scale: 0.7 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-300" />
            ) : (
              <Moon className="w-5 h-5 text-purple-600" />
            )}
          </motion.span>
        </AnimatePresence>
      )}
    </button>
  );
};
