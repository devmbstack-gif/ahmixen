'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from './Navbar';
import { IntroHero } from './IntroHero';
import { Hero } from './Hero';
import { WorkshopPreview } from './WorkshopPreview';
import { StatCounters } from './StatCounters';
import { Registration } from './Registration';
import { Footer } from './Footer';
import { WhatsAppFloat } from './WhatsAppFloat';
import { SmoothScroll, useSmoothScroll } from './SmoothScroll';
import { SectionReveal } from './Reveal';
import { SectionPlaceholder } from './SectionPlaceholder';
import type { PublicSessionDisplay } from '../lib/sessions/publicShared';
import type { Review } from '../data/reviews';
import type { Instructor as InstructorData } from '../data/instructor';
import type { HeroContentData } from '@/lib/content/landingSchemas';
import type { IntroContentData } from '@/lib/content/landingSchemas';
import type { PreviewContentData } from '@/lib/content/landingSchemas';
import type { AiJobsContentData } from '@/lib/content/landingSchemas';
import type { AgendaContentData } from '@/lib/content/landingSchemas';
import type { StatsContentData } from '@/lib/content/landingSchemas';

/**
 * Below-fold / heavy UI — client-only code-split.
 * `ssr: false` avoids flaky webpack SSR chunk paths that surface as "[object Event]".
 */
const AnimatedBackground = dynamic(
  () => import('./AnimatedBackground').then((m) => ({ default: m.AnimatedBackground })),
  { ssr: false, loading: () => null }
);

const Community = dynamic(
  () => import('./Community').then((m) => ({ default: m.Community })),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeight="28rem" label="Loading community" />,
  }
);

const RiseInAiJobs = dynamic(
  () => import('./RiseInAiJobs').then((m) => ({ default: m.RiseInAiJobs })),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeight="20rem" label="Loading AI jobs section" />,
  }
);

const WorkshopAgenda = dynamic(
  () => import('./WorkshopAgenda').then((m) => ({ default: m.WorkshopAgenda })),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeight="18rem" label="Loading agenda" />,
  }
);

const Instructor = dynamic(
  () => import('./Instructor').then((m) => ({ default: m.Instructor })),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeight="22rem" label="Loading instructor" />,
  }
);

const Testimonials = dynamic(
  () => import('./Testimonials').then((m) => ({ default: m.Testimonials })),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeight="16rem" label="Loading testimonials" />,
  }
);

export type HomeLandingContent = {
  intro: IntroContentData & { photoUrl: string; photoAlt: string };
  hero: HeroContentData & { headlineLine1Resolved: string };
  preview: PreviewContentData & { posterUrl: string | null };
  aiJobs: AiJobsContentData;
  agenda: AgendaContentData;
  stats: StatsContentData;
};

const HomePageInner: React.FC<{
  publicSession: PublicSessionDisplay;
  instructor: InstructorData;
  reviews: Review[];
  landing: HomeLandingContent;
}> = ({ publicSession, instructor, reviews, landing }) => {
  const smooth = useSmoothScroll();

  const handleExploreWorkshop = () => {
    smooth?.scrollTo('#preview', { offset: -80 });
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink transition-colors duration-300 antialiased selection:bg-brand selection:text-white relative">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <AnimatedBackground />

      <Navbar />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <IntroHero content={landing.intro} />
        <Hero
          onExploreWorkshop={handleExploreWorkshop}
          session={publicSession}
          content={landing.hero}
        />
        <SectionReveal>
          <WorkshopPreview
            videoUrl={landing.preview.videoUrl}
            durationLabel={publicSession.durationLabel}
            heading={landing.preview.heading}
            posterUrl={landing.preview.posterUrl}
          />
        </SectionReveal>
        <SectionReveal>
          <StatCounters content={landing.stats} />
        </SectionReveal>
        <SectionReveal>
          <Community />
        </SectionReveal>
        <SectionReveal>
          <RiseInAiJobs content={landing.aiJobs} />
        </SectionReveal>
        <SectionReveal>
          <WorkshopAgenda content={landing.agenda} />
        </SectionReveal>
        <SectionReveal>
          <Instructor data={instructor} />
        </SectionReveal>
        <SectionReveal>
          <Testimonials reviews={reviews} />
        </SectionReveal>
        <SectionReveal>
          <Registration
            seatsAvailable={publicSession.seatsAvailable}
            showLimitedSeatsBadge={publicSession.showLimitedSeatsBadge}
            durationLabel={publicSession.durationLabel}
          />
        </SectionReveal>
      </main>

      <SectionReveal>
        <Footer instructor={instructor} />
      </SectionReveal>
      <WhatsAppFloat />
    </div>
  );
};

export const HomePage: React.FC<{
  publicSession: PublicSessionDisplay;
  instructor: InstructorData;
  reviews: Review[];
  landing: HomeLandingContent;
}> = ({ publicSession, instructor, reviews, landing }) => {
  return (
    <SmoothScroll>
      <HomePageInner
        publicSession={publicSession}
        instructor={instructor}
        reviews={reviews}
        landing={landing}
      />
    </SmoothScroll>
  );
};
