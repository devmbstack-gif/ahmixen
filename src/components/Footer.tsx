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

/** Row-major 2-column footer nav order */
const FOOTER_LINKS = [
  { label: 'Programs', href: '/programs' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Our Mission', href: '/our-mission' },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

export const Footer: React.FC<{ instructor?: InstructorData }> = ({
  instructor = staticInstructor,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <footer className="site-footer">
      <motion.div
        className="container-narrow"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.55, ease: EASE }}
      >
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link href="/" className="nav-focus inline-flex" aria-label="AhmiXen home">
              <AhmiXenLogo className="text-2xl sm:text-3xl" />
            </Link>
            <p className="site-footer-copy hidden lg:block">
              &copy; {new Date().getFullYear()} {WORKSHOP_CONFIG.brandName}
            </p>
          </div>

          <nav className="site-footer-nav" aria-label="Footer">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="site-footer-link nav-focus">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="site-footer-contact">
            <a
              href={`mailto:${WORKSHOP_CONFIG.contactEmail}`}
              className="site-footer-email nav-focus"
            >
              {WORKSHOP_CONFIG.contactEmail}
            </a>
            <div className="site-footer-socials">
              <a
                href={instructor.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${instructor.name} on LinkedIn`}
                className="site-footer-social nav-focus"
              >
                <LinkedInIcon className="w-5 h-5" />
              </a>
              <a
                href={instructor.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${instructor.name} on Instagram`}
                className="site-footer-social nav-focus"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            </div>
            <p className="site-footer-copy site-footer-copy-mobile lg:hidden">
              &copy; {new Date().getFullYear()} {WORKSHOP_CONFIG.brandName}
            </p>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};
