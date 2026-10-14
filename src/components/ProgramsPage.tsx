'use client';

import dynamic from 'next/dynamic';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ProgramsSection } from './ProgramsSection';
import type { PublicSessionDisplay } from '../lib/sessions/publicShared';
import type { ProgramCardPublic } from '@/lib/content/landingPublic';

const AnimatedBackground = dynamic(
  () => import('./AnimatedBackground').then((m) => ({ default: m.AnimatedBackground })),
  { ssr: false, loading: () => null }
);

export const ProgramsPage: React.FC<{
  publicSession: PublicSessionDisplay;
  cards: ProgramCardPublic[];
}> = ({ publicSession, cards }) => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink transition-colors duration-300 antialiased selection:bg-brand selection:text-white relative">
      <AnimatedBackground />

      <Navbar />

      <main className="programs-page flex-1">
        <ProgramsSection
          publicSession={publicSession}
          cards={cards}
          headingAs="h1"
        />
      </main>

      <Footer />
    </div>
  );
};
