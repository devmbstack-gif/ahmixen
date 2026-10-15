'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WORKSHOP_CONFIG } from '../data/workshopData';

const AnimatedBackground = dynamic(
  () =>
    import('./AnimatedBackground').then((m) => ({
      default: m.AnimatedBackground,
    })),
  { ssr: false, loading: () => null }
);

const EASE = [0.16, 1, 0.3, 1] as const;

export function PrivacyPolicyPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink transition-colors duration-300 antialiased selection:bg-brand selection:text-white relative">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1">
        <div className="container-narrow static-doc-inner">
          <motion.header
            className="static-doc-header"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.45, ease: EASE }}
          >
            <h1 className="static-doc-title">Privacy Policy</h1>
            <p className="static-doc-meta">
              Last updated: October 15, 2026 • {WORKSHOP_CONFIG.brandName}
            </p>
          </motion.header>

          <article className="static-doc-article">
            <section className="static-doc-section" aria-labelledby="intro">
              <h2 id="intro">Overview</h2>
              <p>
                This Privacy Policy explains how {WORKSHOP_CONFIG.brandName}{' '}
                collects, uses, and protects information when you visit our
                website, reserve a workshop seat, or enroll in mentorship.
              </p>
            </section>

            <section className="static-doc-section" aria-labelledby="collect">
              <h2 id="collect">Information We Collect</h2>
              <ul>
                <li>
                  Contact details you submit (name, email, phone) during
                  reservation or enrollment.
                </li>
                <li>
                  Payment-related details needed to verify transfers (for
                  example, transaction reference). We do not store full card
                  numbers on our servers.
                </li>
                <li>
                  Basic technical data such as browser type and pages visited,
                  used to improve the site.
                </li>
              </ul>
            </section>

            <section className="static-doc-section" aria-labelledby="use">
              <h2 id="use">How We Use Information</h2>
              <ul>
                <li>To process workshop and mentorship reservations.</li>
                <li>
                  To send confirmations, session updates, and support messages.
                </li>
                <li>To improve our website, content, and learning experience.</li>
              </ul>
            </section>

            <section className="static-doc-section" aria-labelledby="share">
              <h2 id="share">Sharing</h2>
              <p>
                We do not sell your personal information. We may share data only
                with trusted providers who help us run the service (for example,
                email delivery or hosting), under appropriate safeguards, or
                when required by law.
              </p>
            </section>

            <section className="static-doc-section" aria-labelledby="contact">
              <h2 id="contact">Contact</h2>
              <p>
                Privacy questions? Email{' '}
                <a href={`mailto:${WORKSHOP_CONFIG.contactEmail}`}>
                  {WORKSHOP_CONFIG.contactEmail}
                </a>
                . See also our{' '}
                <Link href="/terms">Terms of Service</Link> and{' '}
                <Link href="/refund-policy">Refund Policy</Link>.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
