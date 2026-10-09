import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, ArrowRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenLightbox?: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRegister, onOpenLightbox }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Workshop', href: '#preview' },
    { name: "What You'll Learn", href: '#benefits' },
    { name: 'Agenda', href: '#agenda' },
    { name: 'About', href: '#instructor' },
    { name: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-subtle)] shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with preserved original asset */}
          <div className="flex items-center gap-3">
            <a
              href="#hero"
              onClick={(e) => handleNavClick(e, '#hero')}
              className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
              aria-label="AhmiXen Homepage"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-black shadow-md'
                    : 'bg-black/60 border border-purple-500/20 group-hover:border-purple-500/50'
                }`}
              >
                <img
                  src="/ahmixen-logo.png"
                  alt="AhmiXen Logo"
                  className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  width="160"
                  height="40"
                />
              </div>
            </a>
            {onOpenLightbox ? (
              <button
                type="button"
                onClick={() => onOpenLightbox('logo')}
                title="Inspect high-resolution brand asset in lightbox"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full purple-badge hover:border-purple-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>LIVE COHORT</span>
                <span className="text-[10px] opacity-75">🔍</span>
              </button>
            ) : (
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full purple-badge">
                LIVE COHORT
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors rounded-lg hover:bg-white/5 relative group"
              >
                {link.name}
                <span className="absolute bottom-1 left-3.5 right-3.5 h-[2px] bg-gradient-to-r from-purple-500 to-violet-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
              </a>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              id="desktop-nav-reserve-btn"
              onClick={onOpenRegister}
              className="btn-ahmixen inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <span>Reserve Your Seat</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
              className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-main)] hover:border-purple-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 top-20 z-40 lg:hidden bg-black/60 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-6 py-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-4 py-3 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <ArrowRight className="w-4 h-4 text-purple-400 opacity-60" />
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] px-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Next live cohort: Oct 24, 2026 • Limited 100 spots</span>
              </div>
              <button
                type="button"
                id="mobile-drawer-reserve-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister();
                }}
                className="btn-ahmixen w-full py-3.5 px-6 rounded-xl font-semibold text-center flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Reserve Your Seat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
