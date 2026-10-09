'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, mounted, toggleTheme } = useTheme();

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
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 border border-[var(--border-subtle)] bg-[var(--card-bg)] hover:border-[var(--bright-violet)] hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] text-[var(--text-main)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${className}`}
    >
      {/* Stable placeholder until mounted — avoids SSR/client icon mismatch */}
      {!mounted ? (
        <span className="w-5 h-5" aria-hidden="true" />
      ) : theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-purple-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
