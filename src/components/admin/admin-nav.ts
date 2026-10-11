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

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Live Sessions', href: '/admin/sessions', icon: CalendarDays },
  { label: 'Orders & Payments', href: '/admin/orders', icon: CreditCard },
  { label: 'Reservations', href: '/admin/reservations', icon: Ticket },
  { label: 'Leads', href: '/admin/leads', icon: Users },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag },
  { label: 'Pricing Plans', href: '/admin/pricing', icon: BadgeDollarSign },
  { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
  { label: 'Landing Content', href: '/admin/content', icon: PanelsTopLeft },
  { label: 'Instructor & Mission', href: '/admin/instructor', icon: GraduationCap },
  { label: 'Media', href: '/admin/media', icon: ImageIcon },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function titleForPath(pathname: string): string {
  const exact = ADMIN_NAV.find((item) => item.href === pathname);
  if (exact) return exact.label;
  const nested = ADMIN_NAV.find(
    (item) => item.href !== '/admin' && pathname.startsWith(item.href)
  );
  return nested?.label ?? 'Admin';
}
