export type NavLink = {
  label: string;
  href: string;
};

/** Single source of truth for navbar + footer site links */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Programs', href: '/programs' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'Our Mission', href: '/our-mission' },
] as const;
