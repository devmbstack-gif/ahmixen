'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

type AdminIconActionProps = {
  tip: string;
  ariaLabel: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  /** Open href in a new tab (WhatsApp, mailto, etc.). */
  external?: boolean;
  /** Purple — primary / landing highlight */
  accent?: boolean;
  /** Red — destructive */
  danger?: boolean;
  /** Blue — edit */
  edit?: boolean;
  /** Amber — lock / caution */
  warn?: boolean;
  children: ReactNode;
};

export function AdminIconAction({
  tip,
  ariaLabel,
  disabled,
  onClick,
  href,
  external,
  accent,
  danger,
  edit,
  warn,
  children,
}: AdminIconActionProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.top - 8, left: r.left + r.width / 2 });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, place]);

  const show = () => {
    place();
    setOpen(true);
  };
  const hide = () => setOpen(false);

  const className = [
    'admin-icon-btn admin-session-icon-btn nav-focus',
    edit ? 'is-edit' : '',
    accent ? 'is-accent' : '',
    warn ? 'is-warn' : '',
    danger ? 'is-danger' : '',
    disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const tipNode =
    mounted && open
      ? createPortal(
          <span
            role="tooltip"
            className="admin-action-tooltip"
            style={{ top: pos.top, left: pos.left }}
          >
            {tip}
          </span>,
          document.body
        )
      : null;

  const control = href && external ? (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {children}
    </a>
  ) : href ? (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {children}
    </Link>
  ) : (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.();
      }}
    >
      {children}
    </button>
  );

  return (
    <>
      <span ref={wrapRef} className="admin-session-icon-wrap">
        {control}
      </span>
      {tipNode}
    </>
  );
}
