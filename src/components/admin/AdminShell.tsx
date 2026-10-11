'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AhmiXenLogo } from '@/components/AhmiXenLogo';
import { ADMIN_NAV, titleForPath } from './admin-nav';

type AdminShellProps = {
  adminName: string;
  children: React.ReactNode;
};

export function AdminShell({ adminName, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const drawerId = useId();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const title = titleForPath(pathname);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = document.getElementById(drawerId);
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen, drawerId]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.replace('/admin/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1 p-3">
      {ADMIN_NAV.map((item) => {
        const active =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`admin-nav-link nav-focus ${active ? 'is-active' : ''}`}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-shell bg-[var(--bg-primary)] text-[var(--text-main)]">
      {/* Desktop sidebar — fixed to viewport; only nav list scrolls if needed */}
      <aside className="admin-sidebar admin-sidebar-desktop hidden lg:flex">
        <div className="admin-sidebar-brand px-4 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <Link href="/admin" className="nav-focus inline-flex" aria-label="Admin home">
            <AhmiXenLogo className="text-xl" />
          </Link>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Admin</p>
        </div>
        <div className="admin-sidebar-nav flex-1 min-h-0 overflow-y-auto">{nav}</div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu overlay"
            onClick={() => setDrawerOpen(false)}
          />
          <motion.aside
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            initial={reduceMotion ? false : { x: -24, opacity: 0.96 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            className="admin-sidebar relative z-10 flex h-full w-[min(18rem,88vw)] shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)]">
              <AhmiXenLogo className="text-lg" />
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="admin-icon-btn nav-focus"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
          </motion.aside>
        </div>
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="admin-menu-toggle admin-icon-btn nav-focus"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <h1 className="text-base sm:text-lg font-bold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <span className="hidden sm:inline text-sm text-[var(--text-secondary)] max-w-[10rem] truncate">
              {adminName}
            </span>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="admin-logout-btn nav-focus"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{loggingOut ? '…' : 'Logout'}</span>
            </button>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
