'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  /** False until client has synced theme — use to avoid hydration mismatches */
  mounted: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'ahmixen-theme';
const THEME_ANIM_MS = 420;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

function resolvePreferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function runThemeChange(apply: () => void) {
  const root = document.documentElement;

  const finishAnimClass = () => {
    root.classList.add('theme-animating');
    window.setTimeout(() => {
      root.classList.remove('theme-animating');
    }, THEME_ANIM_MS);
  };

  if (prefersReducedMotion()) {
    apply();
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };

  if (typeof doc.startViewTransition === 'function') {
    try {
      finishAnimClass();
      const transition = doc.startViewTransition(() => {
        apply();
      });
      // Aborted/skipped transitions reject with non-Error values (e.g. Event)
      void transition?.finished?.catch(() => undefined);
      return;
    } catch {
      // Fall through to non-VT path
    }
  }

  finishAnimClass();
  apply();
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start as 'dark' so server HTML matches the first client render.
  // Blocking script in layout still applies the real class for CSS before paint.
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolved = resolvePreferredTheme();
    setThemeState(resolved);
    applyThemeClass(resolved);
    persistTheme(resolved);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    if (newTheme === theme) return;
    runThemeChange(() => {
      setThemeState(newTheme);
      applyThemeClass(newTheme);
      persistTheme(newTheme);
    });
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    runThemeChange(() => {
      setThemeState(next);
      applyThemeClass(next);
      persistTheme(next);
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
