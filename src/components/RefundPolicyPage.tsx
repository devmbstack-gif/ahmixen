'use client';

import dynamic from 'next/dynamic';
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

export function RefundPolicyPage() {
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
            <h1 className="static-doc-title">Refund Policy</h1>
            <p className="static-doc-meta">
              Last updated: April 15, 2026 • AmiXen Institute of Artificial
              Intelligence
            </p>
          </motion.header>

          <article className="static-doc-article">
            <section className="static-doc-section" aria-labelledby="refund-window">
              <h2 id="refund-window">10-Day Refund Window</h2>
              <p>
                We offer a 100% money-back guarantee for eligible purchases when
                a refund request is submitted within 10 days of the original
                payment date.
              </p>
            </section>

            <section
              className="static-doc-section"
              aria-labelledby="eligibility"
            >
              <h2 id="eligibility">Eligibility Conditions</h2>
              <ul>
                <li>
                  Refund request is submitted within 10 calendar days of
                  purchase.
                </li>
                <li>
                  You attended the first 4 live sessions (where applicable).
                </li>
                <li>You completed core assignments from those sessions.</li>
                <li>
                  Program completion is below 30% at the time of request.
                </li>
              </ul>
            </section>

            <section
              className="static-doc-section"
              aria-labelledby="non-eligible"
            >
              <h2 id="non-eligible">Non-Eligible Cases</h2>
              <ul>
                <li>Refund requests submitted after the 10-day window.</li>
                <li>Completed programs and issued certifications.</li>
                <li>
                  Accounts with policy abuse or repeated chargeback misuse.
                </li>
              </ul>
            </section>

            <section
              className="static-doc-section"
              aria-labelledby="how-to-request"
            >
              <h2 id="how-to-request">How to Request a Refund</h2>
              <ol>
                <li>
                  Email us at{' '}
                  <a
                    href="mailto:info@amixen.com"
                    className="static-doc-link nav-focus"
                  >
                    info@amixen.com
                  </a>{' '}
                  from your registered account email.
                </li>
                <li>
                  Use subject line: Refund Request - Your Program Name.
                </li>
                <li>
                  Include your full name, purchase date, and payment reference
                  number.
                </li>
              </ol>
            </section>

            <section
              className="static-doc-section"
              aria-labelledby="processing"
            >
              <h2 id="processing">Processing Timeline</h2>
              <p>
                We review requests in 2 to 3 business days. Once approved,
                refunds are processed in 5 to 10 business days to your original
                payment method.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
