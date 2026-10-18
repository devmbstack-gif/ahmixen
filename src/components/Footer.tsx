'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { WORKSHOP_CONFIG } from '../data/workshopData';
import {
  instructor as staticInstructor,
  type Instructor as InstructorData,
} from '../data/instructor';
import { AhmiXenLogo } from './AhmiXenLogo';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

const PROGRAM_LINKS = [
  { label: 'Programs', href: '/programs' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'Feedback', href: '/feedback' },
  { label: 'Our Mission', href: '/our-mission' },
] as const;

const LEGAL_LINKS = [
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
] as const;

const linkClass =
  'text-slate-400 hover:text-white transition-colors text-sm nav-focus';

const EASE = [0.16, 1, 0.3, 1] as const;

export const Footer: React.FC<{ instructor?: InstructorData }> = ({
  instructor = staticInstructor,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <footer className="site-footer relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(124,58,237,0.12)_0%,transparent_72%)]"
        aria-hidden="true"
      />

      <motion.div
        className="relative z-[1] mx-auto w-full max-w-6xl py-12 px-6 md:px-12"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.55, ease: EASE }}
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-12 md:items-start">
          {/* Brand */}
          <div className="flex min-w-0 flex-col gap-4">
            <Link
              href="/"
              className="nav-focus inline-flex w-fit"
              aria-label="AhmiXen home"
            >
              <AhmiXenLogo className="text-2xl sm:text-3xl" />
            </Link>
            <p className="m-0 max-w-xs text-sm leading-relaxed text-slate-400">
              Practical AI for real work. Live online workshops to build,
              automate, and monetize with practical AI.
            </p>
            <p className="m-0 mt-auto pt-2 text-sm text-slate-500">
              &copy; 2026 {WORKSHOP_CONFIG.brandName}. All rights reserved.
            </p>
          </div>

          {/* Programs */}
          <nav
            className="flex min-w-0 flex-col"
            aria-labelledby="footer-programs-heading"
          >
            <h2
              id="footer-programs-heading"
              className="mb-4 text-base font-medium text-slate-300"
            >
              Programs
            </h2>
            <ul className="m-0 flex list-none flex-col space-y-3 p-0">
              {PROGRAM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav
            className="flex min-w-0 flex-col"
            aria-labelledby="footer-legal-heading"
          >
            <h2
              id="footer-legal-heading"
              className="mb-4 text-base font-medium text-slate-300"
            >
              Legal &amp; Policies
            </h2>
            <ul className="m-0 flex list-none flex-col space-y-3 p-0">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div
            className="flex min-w-0 flex-col"
            aria-labelledby="footer-contact-heading"
          >
            <h2
              id="footer-contact-heading"
              className="mb-4 text-base font-medium text-slate-300"
            >
              Contact
            </h2>
            <ul className="m-0 flex list-none flex-col space-y-3 p-0">
              <li>
                <a
                  href={`mailto:${WORKSHOP_CONFIG.contactEmail}`}
                  className={`${linkClass} break-all`}
                >
                  {WORKSHOP_CONFIG.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-3 pt-1">
                <a
                  href={instructor.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${instructor.name} on LinkedIn`}
                  className="nav-focus inline-flex h-10 w-10 items-center justify-center text-slate-400 transition-colors hover:text-white"
                >
                  <LinkedInIcon className="h-5 w-5" />
                </a>
                <a
                  href={instructor.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${instructor.name} on Instagram`}
                  className="nav-focus inline-flex h-10 w-10 items-center justify-center text-slate-400 transition-colors hover:text-white"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};
