import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="theme-toggle-btn"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 border border-[var(--border-subtle)] bg-[var(--card-bg)] hover:border-[var(--bright-violet)] hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] text-[var(--text-main)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-purple-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
