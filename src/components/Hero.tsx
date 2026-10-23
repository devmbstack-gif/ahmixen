'use client';

import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { PublicSessionDisplay } from '../lib/sessions/publicShared';
import {
  HERO_INFO_CARDS,
  type HeroContentData,
} from '@/lib/content/landingSchemas';
import type { HeroLogoBlend } from '@/lib/content/heroToolLogos';
import { Countdown } from './Countdown';
import { useReserveFlow } from './checkout/ReserveFlowProvider';

interface HeroProps {
  onExploreWorkshop: () => void;
  session: PublicSessionDisplay;
  content: Omit<HeroContentData, 'tools'> & {
    headlineLine1Resolved: string;
    tools: Array<
      HeroContentData['tools'][number] & {
        logoUrl: string | null;
        logoBlend?: HeroLogoBlend;
      }
    >;
  };
}

const LOGO_BLEND_CLASS: Record<HeroLogoBlend, string> = {
  normal: '',
  screen: 'hero-tool-logo--screen',
  lighten: 'hero-tool-logo--lighten',
  multiply: 'hero-tool-logo--multiply',
};

const EASE = [0.16, 1, 0.3, 1] as const;

function splitWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

export const Hero: React.FC<HeroProps> = ({
  onExploreWorkshop,
  session,
  content,
}) => {
  const reduceMotion = useReducedMotion();
  const { startWorkshopReserveFlow, workshopCta } = useReserveFlow();
  const heroCtaLabel =
    workshopCta.label === 'Reserve'
      ? content.primaryCtaLabel
      : workshopCta.label;

  const mainLine1Words = useMemo(
    () => splitWords(content.mainHeadlineLine1),
    [content.mainHeadlineLine1]
  );
  const mainLine2Words = useMemo(
    () => splitWords(content.mainHeadlineLine2),
    [content.mainHeadlineLine2]
  );

  const subcopy = [content.badgeText, content.badgeSuffix]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');

  const infoCards = useMemo(
    () =>
      HERO_INFO_CARDS.map((card) =>
        card.label === 'Workshop Length'
          ? { ...card, value: session.durationLabel || card.value }
          : card
      ),
    [session.durationLabel]
  );

  const workshopWhenLabel = useMemo(() => {
    const long = session.dateLong?.trim() || '';
    // Prefer "Saturday, Oct 24, 2026 · 10:00 PM PKT"
    const weekday = long.split(',')[0]?.trim();
    if (weekday && session.dateShort && session.timeLabel) {
      return `${weekday}, ${session.dateShort} · ${session.timeLabel}`;
    }
    return 'Saturday, Oct 24, 2026 · 10:00 PM PKT';
  }, [session.dateLong, session.dateShort, session.timeLabel]);

  const wordInitial = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 };
  const wordAnimate = { opacity: 1, y: 0 };

  const blockVariants = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: EASE },
    },
  };

  return (
    <section
      id="hero"
      className="hero-premium relative flex items-center pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-10 lg:pb-16 bg-transparent overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="relative z-10 w-full container-page text-center">
        <div className="hero-header-block">
          <motion.p
            initial="hidden"
            animate="show"
            variants={blockVariants}
            className="hero-topline"
          >
            <span className="hero-topline-lead">
              {content.headlineLine1Resolved}
            </span>
            {content.headlineLine2?.trim() ? (
              <>
                {' '}
                <span className="hero-topline-muted">
                  {content.headlineLine2}
                </span>
              </>
            ) : null}
          </motion.p>

          <h1 id="hero-heading" className="hero-main-title">
            <span className="hero-main-line hero-main-line-solid">
              {mainLine1Words.map((word, i) => (
                <motion.span
                  key={`m1-${word}-${i}`}
                  initial={wordInitial}
                  animate={wordAnimate}
                  transition={{
                    duration: reduceMotion ? 0 : 0.55,
                    delay: reduceMotion ? 0 : 0.08 + i * 0.07,
                    ease: EASE,
                  }}
                  className="hero-main-word"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="hero-main-line hero-main-line-accent">
              {mainLine2Words.map((word, i) => (
                <motion.span
                  key={`m2-${word}-${i}`}
                  initial={wordInitial}
                  animate={wordAnimate}
                  transition={{
                    duration: reduceMotion ? 0 : 0.55,
                    delay: reduceMotion
                      ? 0
                      : 0.08 + (mainLine1Words.length + i) * 0.07,
                    ease: EASE,
                  }}
                  className="hero-main-word hero-gradient-text"
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>

          {subcopy ? (
            <motion.p
              initial="hidden"
              animate="show"
              variants={blockVariants}
              transition={{ delay: reduceMotion ? 0 : 0.5 }}
              className="hero-subcopy"
            >
              {subcopy}
            </motion.p>
          ) : null}
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.62 }}
          className="hero-info-block"
        >
          <div className="hero-info-rule" aria-hidden="true" />
          <ul className="hero-info-cards" aria-label="Workshop details">
            {infoCards.map((card) => (
              <li key={card.label} className="hero-info-card">
                <span className="hero-info-card-label">{card.label}</span>
                <span className="hero-info-card-value">{card.value}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.78 }}
          className="mt-8 md:mt-10 flex flex-col items-center gap-3"
        >
          <p className="hero-workshop-when m-0">{workshopWhenLabel}</p>
          {session.showLimitedSeatsBadge && (
            <span className="hero-urgency-badge">
              <span className="hero-urgency-dot" aria-hidden="true" />
              {session.seatsAvailable > 0
                ? `Limited seats · ${session.seatsAvailable} left`
                : 'Sold out'}
            </span>
          )}
          <Countdown startsAt={session.startsAt} />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={blockVariants}
          transition={{ delay: reduceMotion ? 0 : 0.9 }}
          className="mt-7 md:mt-8 flex flex-col items-center gap-4"
        >
          <motion.button
            type="button"
            id="hero-reserve-cta"
            onClick={() => {
              if (!workshopCta.disabled) {
                startWorkshopReserveFlow(null, {
                  forTitle: 'AI Money Lab',
                });
              }
            }}
            disabled={workshopCta.disabled}
            aria-disabled={workshopCta.disabled}
            className="btn-ahmixen relative py-3.5 px-8 sm:px-10 rounded-full font-bold text-base sm:text-lg inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="relative z-[2] inline-flex items-center gap-2">
              {heroCtaLabel}
              {!workshopCta.disabled ? <ArrowRight className="w-5 h-5" /> : null}
            </span>
          </motion.button>
          <button
            type="button"
            id="hero-explore-cta"
            onClick={onExploreWorkshop}
            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] underline-offset-4 hover:underline cursor-pointer"
          >
            {content.secondaryLinkLabel}
          </button>
        </motion.div>

        {content.tools?.length ? (
          <motion.div
            initial="hidden"
            animate="show"
            variants={blockVariants}
            transition={{ delay: reduceMotion ? 0 : 1.0 }}
            className="hero-tools mt-10 md:mt-12"
          >
            <p className="hero-tools-label">{content.toolsTitle}</p>
            <ul className="hero-tools-row" aria-label={content.toolsTitle}>
              {content.tools.map((tool) => (
                <li key={tool.id} className="hero-tool-tile" title={tool.name}>
                  {tool.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- static public logos
                    <img
                      src={encodeURI(tool.logoUrl)}
                      alt=""
                      className={[
                        'hero-tool-logo object-contain bg-transparent',
                        LOGO_BLEND_CLASS[tool.logoBlend ?? 'normal'],
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="hero-tool-fallback" aria-hidden="true">
                      {tool.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="sr-only">{tool.name}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
};
