'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { AhmiXenLogo } from './AhmiXenLogo';
import { useSmoothScroll } from './SmoothScroll';

interface NavbarProps {
  onOpenRegister: () => void;
}

const navLinks = [
  { name: 'Community', href: '#community' },
  { name: 'Learn', href: '#benefits' },
  { name: 'AI Jobs', href: '#rise-ai-jobs' },
  { name: 'Agenda', href: '#agenda' },
  { name: 'Instructor', href: '#instructor' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'FAQ', href: '#faq' },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ onOpenRegister }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>('');
  const smooth = useSmoothScroll();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector<HTMLElement>(link.href))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const ratios = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(`#${entry.target.id}`, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let best = '';
        let bestRatio = 0;
        for (const [href, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = href;
          }
        }

        if (window.scrollY < 120) {
          setActiveHref('');
          return;
        }

        if (best) setActiveHref(best);
      },
      {
        rootMargin: '-28% 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      }
    );

    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveHref(href);
    smooth?.scrollTo(href, { offset: -80 });
  };

  return (
    <header
      className={`nav-bar fixed top-0 left-0 right-0 z-50 transition-[background,border-color,box-shadow,backdrop-filter] duration-300 ${
        isScrolled ? 'nav-bar-scrolled' : 'nav-bar-top'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, '#hero')}
            className="flex items-center"
            aria-label="AhmiXen home"
          >
            <AhmiXenLogo className="text-[1.65rem] sm:text-3xl" />
          </a>

          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main">
            {navLinks.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-[var(--text-main)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {isActive && !reduceMotion && (
                    <motion.span
                      layoutId="nav-active-indicator"
                      className="nav-active-pill absolute inset-0 rounded-lg"
                      transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.6 }}
                    />
                  )}
                  {isActive && reduceMotion && (
                    <span className="nav-active-pill absolute inset-0 rounded-lg" />
                  )}
                  <span className="relative z-[1]">{link.name}</span>
                </a>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onOpenRegister}
              className="btn-ahmixen inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
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
              className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-main)] cursor-pointer"
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
            {navLinks.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'text-[var(--text-main)] bg-[var(--hover-fill)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--hover-fill)]'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegister();
              }}
              className="btn-ahmixen w-full py-3 rounded-xl font-semibold mt-2"
            >
              Reserve Seat
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
