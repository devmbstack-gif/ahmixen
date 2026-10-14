'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const AnimatedBackground = dynamic(
  () =>
    import('./AnimatedBackground').then((m) => ({
      default: m.AnimatedBackground,
    })),
  { ssr: false, loading: () => null }
);

const EASE = [0.16, 1, 0.3, 1] as const;

export function TermsOfServicePage() {
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
            <h1 className="static-doc-title">Terms of Service</h1>
            <p className="static-doc-meta">
              Last updated: September 29, 2025 • AmiXen Institute of Artificial
              Intelligence
            </p>
          </motion.header>

          <article className="static-doc-article">
            <section className="static-doc-section" aria-labelledby="acceptance">
              <h2 id="acceptance">Acceptance of Terms</h2>
              <p>
                By accessing and using AmiXen AI Institute&apos;s website and
                services, you accept and agree to be bound by the terms and
                provisions of this agreement. If you do not agree to these
                terms, please do not use our services.
              </p>
            </section>

            <section
              className="static-doc-section"
              aria-labelledby="description"
            >
              <h2 id="description">Description of Service</h2>
              <p>
                AmiXen AI Institute provides online artificial intelligence
                education programs, training programs, and related educational
                services. Our platform offers various learning materials,
                interactive content, and certification programs designed to help
                members learn AI concepts and applications.
              </p>
            </section>

            <section
              className="static-doc-section"
              aria-labelledby="accounts"
            >
              <h2 id="accounts">User Accounts and Registration</h2>
              <ul>
                <li>
                  You must provide accurate and complete information during
                  registration.
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of
                  your account.
                </li>
                <li>You must be at least 16 years old to create an account.</li>
                <li>One person may not maintain multiple accounts.</li>
                <li>
                  You are responsible for all activities under your account.
                </li>
              </ul>
            </section>

            <section
              className="static-doc-section"
              aria-labelledby="program-access"
            >
              <h2 id="program-access">Program Access and Content</h2>
              <h3 id="access-rights">Access Rights</h3>
              <ul>
                <li>
                  Program access is granted upon successful payment and
                  enrollment.
                </li>
                <li>
                  Access duration varies by Program and is specified at
                  purchase.
                </li>
                <li>
                  We reserve the right to modify Program content and structure.
                </li>
                <li>Program materials are for personal use only.</li>
              </ul>
              <h3 id="content-restrictions">Content Restrictions</h3>
              <ul>
                <li>
                  You may not share, distribute, or resell Program materials.
                </li>
                <li>
                  Recording or copying of Program content is prohibited.
                </li>
                <li>
                  Content is protected by copyright and intellectual property
                  laws.
                </li>
                <li>
                  Reverse engineering of Program materials is not allowed.
                </li>
              </ul>
            </section>

            <section
              className="static-doc-section"
              aria-labelledby="payment"
            >
              <h2 id="payment">Payment Terms</h2>
              <ul>
                <li>All fees are clearly stated at checkout.</li>
                <li>
                  Payments are handled securely according to our payment terms.
                </li>
                <li>
                  For refund details, please refer to our{' '}
                  <Link
                    href="/refund-policy"
                    className="static-doc-link nav-focus"
                  >
                    Refund Policy
                  </Link>
                  .
                </li>
              </ul>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
