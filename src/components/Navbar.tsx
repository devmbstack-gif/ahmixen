'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { AhmiXenLogo } from './AhmiXenLogo';
import { NAV_LINKS } from '../data/navLinks';

interface NavbarProps {
  onOpenRegister: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRegister }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => pathname !== '/' && pathname === href;

  return (
    <header className="nav-bar nav-bar-top relative z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <Link href="/" className="nav-focus flex items-center shrink-0" aria-label="AhmiXen home">
            <AhmiXenLogo className="text-[1.65rem] sm:text-3xl" />
          </Link>

          <div className="hidden md:flex items-center gap-2.5 ml-auto">
            <nav
              className="nav-pill"
              aria-label="Main"
              onMouseLeave={() => setHoveredHref(null)}
            >
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                const showHoverPill = !reduceMotion && hoveredHref === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={() => setHoveredHref(link.href)}
                    className={`nav-pill-link nav-focus ${active ? 'nav-pill-link-active' : ''}`}
                  >
                    {showHoverPill && (
                      <motion.span
                        layoutId="nav-hover-pill"
                        className="nav-hover-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.55 }}
                      />
                    )}
                    {reduceMotion && active && <span className="nav-hover-pill" />}
                    <span className="relative z-[1]">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <ThemeToggle />
            <button
              type="button"
              onClick={onOpenRegister}
              className="btn-ahmixen nav-focus inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            >
              Reserve
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="nav-focus p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-main)] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 md:hidden backdrop-blur-md"
          style={{ backgroundColor: 'var(--overlay-soft)' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-4 py-5 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1" aria-label="Main">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-focus block px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                      active
                        ? 'text-[var(--text-main)] bg-[var(--hover-fill)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--hover-fill)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegister();
              }}
              className="btn-ahmixen nav-focus w-full py-3 rounded-xl font-semibold mt-2"
            >
              Reserve
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
