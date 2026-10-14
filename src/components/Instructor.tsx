'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  platformCaption,
  splitHeadlineAccent,
  type Instructor as InstructorData,
  type ProofPlatform,
} from '../data/instructor';

const EASE = [0.16, 1, 0.3, 1] as const;

const INSTRUCTOR_HIGHLIGHTS = [
  { value: '3+', label: 'Years Experience' },
  { value: '100+', label: 'Students Trained' },
  { value: '10+', label: 'Keynotes & Awards' },
] as const;

/** Social preview cards — images live in /public (filenames include spaces). */
const SOCIAL_PREVIEW_CARDS = [
  {
    id: 'linkedin',
    platform: 'linkedin' as const,
    label: 'LinkedIn',
    imageSrc: '/linkdln account.jpeg',
    hrefKey: 'linkedin' as const,
  },
  {
    id: 'instagram',
    platform: 'instagram' as const,
    label: 'Instagram',
    imageSrc: '/insta account.jpeg',
    hrefKey: 'instagram' as const,
  },
  {
    id: 'youtube',
    platform: 'youtube' as const,
    label: 'YouTube',
    imageSrc: '/youtube account.jpeg',
    hrefKey: 'youtube' as const,
  },
] as const;

/** AhmiXen AI channel (@AhmiXen) */
const YOUTUBE_CHANNEL_HREF = 'https://www.youtube.com/@AhmiXen';

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

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a2.974 2.974 0 0 0-2.092-2.106C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.406.534A2.974 2.974 0 0 0 .502 6.186C0 8.09 0 12 0 12s0 3.91.502 5.814a2.974 2.974 0 0 0 2.092 2.106C4.495 20.454 12 20.454 12 20.454s7.505 0 9.406-.534a2.974 2.974 0 0 0 2.092-2.106C24 15.91 24 12 24 12s0-3.91-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function PlatformIcon({
  platform,
  className,
}: {
  platform: ProofPlatform;
  className?: string;
}) {
  if (platform === 'instagram') return <InstagramIcon className={className} />;
  if (platform === 'youtube') return <YouTubeIcon className={className} />;
  return <LinkedInIcon className={className} />;
}

function InstructorPortrait({ data }: { data: InstructorData }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.05, margin: '80px 0px' });
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setForceShow(true);
      return;
    }
    const t = window.setTimeout(() => setForceShow(true), 1000);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  const show = Boolean(reduceMotion || inView || forceShow);

  return (
    <motion.div
      ref={ref}
      className="instructor-photo-wrap"
      initial={reduceMotion || show ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: EASE }}
    >
      <div className="instructor-photo-frame instructor-photo-frame-natural">
        <Image
          src={encodeURI(data.photo)}
          alt={data.name}
          width={900}
          height={1200}
          sizes="(max-width: 768px) 360px, (max-width: 1024px) 420px, 520px"
          className="instructor-photo-img instructor-photo-img-natural"
          priority
          unoptimized
        />
      </div>
    </motion.div>
  );
}

function AccentedText({
  text,
  accent,
  as: Tag = 'span',
  className,
  accentClassName = 'instructor-accent',
  id,
}: {
  text: string;
  accent: string;
  as?: 'h2' | 'p' | 'span';
  className?: string;
  accentClassName?: string;
  id?: string;
}) {
  const split = splitHeadlineAccent(text, accent);

  if (!split) {
    return (
      <Tag id={id} className={className}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag id={id} className={className}>
      {split.before}
      <span className={accentClassName}>{split.accent}</span>
      {split.after}
    </Tag>
  );
}

export const Instructor: React.FC<{ data: InstructorData }> = ({ data }) => {
  const reduceMotion = useReducedMotion();
  const greeting = data.greeting?.trim() || "Hello I'm AHMI";
  const greetingAccent = data.greetingAccent?.trim() || "I'm";
  const differenceHeading =
    data.differenceHeading?.trim() || 'What makes me different is simple:';
  const differenceBody =
    data.differenceBody?.trim() || data.missionQuote?.trim() || '';

  const socialCards = SOCIAL_PREVIEW_CARDS.map((card) => ({
    ...card,
    href:
      card.hrefKey === 'linkedin'
        ? data.linkedin
        : card.hrefKey === 'instagram'
          ? data.instagram
          : YOUTUBE_CHANNEL_HREF,
  }));

  return (
    <section
      id="instructor"
      className="relative instructor-section bg-transparent py-16 md:py-20 lg:py-24"
      aria-labelledby="instructor-heading"
    >
      <div className="relative instructor-container">
        <div className="instructor-panel grid grid-cols-1 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] gap-8 md:gap-10 lg:gap-14 items-start">
          <div className="order-2 md:order-1 text-left min-w-0">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.45,
                ease: EASE,
              }}
            >
              <AccentedText
                as="h2"
                id="instructor-heading"
                className="instructor-greeting"
                text={greeting}
                accent={greetingAccent}
              />
              <AccentedText
                as="p"
                className="instructor-headline"
                text={data.headlineSub}
                accent={data.headlineAccent}
              />
            </motion.div>

            <motion.p
              className="instructor-bio"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.45,
                delay: reduceMotion ? 0 : 0.06,
                ease: EASE,
              }}
            >
              {data.bio}
            </motion.p>

            {differenceBody ? (
              <motion.div
                className="instructor-difference text-left"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.45,
                  delay: reduceMotion ? 0 : 0.12,
                  ease: EASE,
                }}
              >
                <h3 className="instructor-difference-heading">{differenceHeading}</h3>
                <p className="instructor-difference-body">{differenceBody}</p>
              </motion.div>
            ) : null}

            <motion.ul
              className="instructor-highlights"
              aria-label="Key highlights"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.4,
                delay: reduceMotion ? 0 : 0.16,
                ease: EASE,
              }}
            >
              {INSTRUCTOR_HIGHLIGHTS.map((item) => (
                <li key={item.label} className="instructor-highlight-pill">
                  <span className="instructor-highlight-value">{item.value}</span>
                  <span className="instructor-highlight-label">{item.label}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="instructor-photo-col order-1 md:order-2">
            <InstructorPortrait data={data} />
          </div>
        </div>

        <div
          className="instructor-proof-grid"
          aria-label="Proof and social images"
        >
          {socialCards.map((card, i) => (
            <motion.a
              key={card.id}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="instructor-proof-card group nav-focus"
              aria-label={`Preview ${card.label} (opens in a new tab)`}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.4,
                delay: reduceMotion ? 0 : i * 0.06,
                ease: EASE,
              }}
            >
              <span className="instructor-proof-media">
                <Image
                  src={encodeURI(card.imageSrc)}
                  alt={`${card.label} account preview`}
                  width={640}
                  height={400}
                  loading="lazy"
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 320px"
                  className="instructor-proof-img"
                  unoptimized
                />
                <span className="instructor-proof-overlay" aria-hidden="true">
                  <span className="instructor-proof-eye">
                    <Eye className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                </span>
              </span>
              <span className="instructor-proof-chip">
                <PlatformIcon
                  platform={card.platform}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span>{platformCaption(card.platform)}</span>
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};
