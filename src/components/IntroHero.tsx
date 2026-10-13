'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { IntroContentData } from '@/lib/content/landingSchemas';
import { useSmoothScroll } from './SmoothScroll';

const EASE = [0.16, 1, 0.3, 1] as const;

type IntroHeroProps = {
  content: IntroContentData & { photoUrl: string; photoAlt: string };
};

export const IntroHero: React.FC<IntroHeroProps> = ({ content }) => {
  const reduceMotion = useReducedMotion();
  const smooth = useSmoothScroll();

  const fadeUp = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: EASE },
        };

  const onJoinWorkshop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    smooth?.scrollTo('#hero', { offset: -80, immediate: reduce });
  };

  return (
    <section
      id="intro"
      className="intro-hero relative flex items-center pt-24 pb-12 md:pt-28 md:pb-16 lg:min-h-[calc(100svh-4rem)]"
      aria-labelledby="intro-heading"
    >
      <div className="container-page w-full">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="flex flex-col justify-center text-left min-w-0">
            <motion.span
              {...fadeUp(0.05)}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary-purple)]"
                aria-hidden="true"
              />
              {content.badge}
            </motion.span>

            <h1
              id="intro-heading"
              className="mt-5 text-5xl font-extrabold leading-[1.08] tracking-tight text-[var(--text-main)] sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              <motion.span
                {...fadeUp(0.12)}
                className="intro-gradient-text block"
              >
                {content.headlineAccent}
              </motion.span>
              <motion.span {...fadeUp(0.2)} className="mt-1 block">
                {content.headlineMain}
              </motion.span>
            </h1>

            <motion.p
              {...fadeUp(0.28)}
              className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
            >
              {content.subtext}
            </motion.p>

            <motion.div
              {...fadeUp(0.36)}
              className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <Link
                href="/programs"
                className="btn-ahmixen nav-focus inline-flex min-h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold sm:w-auto"
              >
                {content.primaryCtaLabel}
              </Link>
              <button
                type="button"
                onClick={onJoinWorkshop}
                className="nav-focus inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--border-highlight)] bg-transparent px-6 text-sm font-semibold text-[var(--text-main)] transition-[background-color,transform,border-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--hover-fill)] sm:w-auto"
              >
                {content.secondaryCtaLabel}
              </button>
            </motion.div>
          </div>

          <motion.div
            {...(reduceMotion
              ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
              : {
                  initial: { opacity: 0, y: 22 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.55, delay: 0.18, ease: EASE },
                })}
            className="intro-hero-photo min-w-0 w-full flex justify-center lg:justify-end"
          >
            <div className="instructor-photo-wrap w-full max-w-md lg:max-w-lg">
              <div className="instructor-photo-frame">
                <Image
                  src={encodeURI(content.photoUrl)}
                  alt={content.photoAlt}
                  fill
                  sizes="(max-width: 768px) 416px, (max-width: 1024px) 480px, 544px"
                  className="instructor-photo-img"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
