'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from './Navbar';
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
import { useReserveFlow } from './checkout/ReserveFlowProvider';

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

const BentoFeatures = dynamic(
  () => import('./BentoFeatures').then((m) => ({ default: m.BentoFeatures })),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeight="22rem" label="Loading features" />,
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

const VideoModal = dynamic(
  () => import('./VideoModal').then((m) => ({ default: m.VideoModal })),
  { ssr: false }
);

const HomePageInner: React.FC<{ publicSession: PublicSessionDisplay }> = ({
  publicSession,
}) => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const smooth = useSmoothScroll();
  const { startReserveFlow } = useReserveFlow();

  const handleOpenVideo = () => setVideoModalOpen(true);
  const handleCloseVideo = () => setVideoModalOpen(false);

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
        <Hero
          onExploreWorkshop={handleExploreWorkshop}
          session={publicSession}
        />
        <SectionReveal>
          <WorkshopPreview
            onOpenVideo={handleOpenVideo}
            durationLabel={publicSession.durationLabel}
          />
        </SectionReveal>
        <SectionReveal>
          <StatCounters />
        </SectionReveal>
        <SectionReveal>
          <Community />
        </SectionReveal>
        <SectionReveal>
          <BentoFeatures />
        </SectionReveal>
        <SectionReveal>
          <RiseInAiJobs />
        </SectionReveal>
        <SectionReveal>
          <WorkshopAgenda />
        </SectionReveal>
        <SectionReveal>
          <Instructor />
        </SectionReveal>
        <SectionReveal>
          <Testimonials />
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
        <Footer />
      </SectionReveal>
      <WhatsAppFloat />

      {videoModalOpen && (
        <VideoModal
          isOpen={videoModalOpen}
          onClose={handleCloseVideo}
          onOpenRegister={() => {
            handleCloseVideo();
            window.setTimeout(() => startReserveFlow(), 0);
          }}
          sessionDate={publicSession.dateLong}
          durationLabel={publicSession.durationLabel}
        />
      )}
    </div>
  );
};

export const HomePage: React.FC<{ publicSession: PublicSessionDisplay }> = ({
  publicSession,
}) => {
  return (
    <SmoothScroll>
      <HomePageInner publicSession={publicSession} />
    </SmoothScroll>
  );
};
