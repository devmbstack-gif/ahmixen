import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Ticket,
  Users,
  Tag,
  BadgeDollarSign,
  MessageSquareQuote,
  PanelsTopLeft,
  GraduationCap,
  ImageIcon,
  Settings,
} from 'lucide-react';

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroupId = 'daily' | 'website' | 'setup';

export type AdminNavGroup = {
  id: AdminNavGroupId;
  label: string;
  /** Setup starts collapsed; expands when route is inside the group. */
  collapsible?: boolean;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'daily',
    label: 'Daily',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Sessions', href: '/admin/sessions', icon: CalendarDays },
      { label: 'Bookings', href: '/admin/orders', icon: CreditCard },
      { label: 'Reservations', href: '/admin/reservations', icon: Ticket },
      { label: 'Leads', href: '/admin/leads', icon: Users },
    ],
  },
  {
    id: 'website',
    label: 'Website',
    items: [
      { label: 'Landing Content', href: '/admin/content', icon: PanelsTopLeft },
      { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
      { label: 'Instructor', href: '/admin/instructor', icon: GraduationCap },
      { label: 'Media', href: '/admin/media', icon: ImageIcon },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    collapsible: true,
    items: [
      { label: 'Pricing', href: '/admin/pricing', icon: BadgeDollarSign },
      { label: 'Coupons', href: '/admin/coupons', icon: Tag },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

/** Flat list for title lookup and any callers that need every link. */
export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function groupContainsPath(group: AdminNavGroup, pathname: string): boolean {
  return group.items.some((item) => isNavItemActive(pathname, item.href));
}

export function titleForPath(pathname: string): string {
  const exact = ADMIN_NAV.find((item) => item.href === pathname);
  if (exact) return exact.label;
  const nested = ADMIN_NAV.find(
    (item) => item.href !== '/admin' && pathname.startsWith(item.href)
  );
  return nested?.label ?? 'Admin';
}
