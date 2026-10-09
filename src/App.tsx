import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { WorkshopPreview } from './components/WorkshopPreview';
import { CommunityStats } from './components/CommunityStats';
import { Benefits } from './components/Benefits';
import { WorkshopAgenda } from './components/WorkshopAgenda';
import { Testimonials } from './components/Testimonials';
import { Instructor } from './components/Instructor';
import { Registration } from './components/Registration';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { VideoModal } from './components/VideoModal';
import { RegistrationModal } from './components/RegistrationModal';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ImageLightbox, type LightboxItem } from './components/ImageLightbox';

const GALLERY_ITEMS: LightboxItem[] = [
  {
    id: 'logo',
    src: '/ahmixen-logo.png',
    alt: 'AhmiXen Official Brand Logo Asset',
    title: 'AhmiXen Official Brand Logo Asset',
    description:
      'Original brand mark featuring the signature white lettering, violet dot accent, and white-to-purple gradient on "Xen".',
    badge: 'BRAND ASSET',
    meta: 'High-Resolution PNG • Authentic Brand Asset',
  },
  {
    id: 'blueprint',
    src: '/agent-architecture-blueprint.svg',
    alt: 'Autonomous Agent Orchestration Blueprint',
    title: 'Autonomous Agent Orchestration Blueprint',
    description:
      'The end-to-end multi-step agent architecture covered in Modules 02 & 03: tool calling, reasoning loops, n8n webhook triggers, and structured output verification.',
    badge: 'CURRICULUM BLUEPRINT',
    meta: 'Vector SVG • 1200x700 Architecture Schematic',
  },
  {
    id: 'certificate',
    src: '/ahmixen-certificate-preview.svg',
    alt: 'AhmiXen AI Practitioner Certificate of Completion',
    title: 'Verifiable Certificate of Completion',
    description:
      'Every participant who finishes the 2.5-hour live cohort receives an authenticated AhmiXen credential with verifiable serial number and instructor signature.',
    badge: 'ACCREDITATION',
    meta: 'Vector SVG • Verifiable Credential Sample',
  },
];

export const AppContent: React.FC = () => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);

  const handleOpenRegister = () => {
    setRegisterModalOpen(true);
  };

  const handleCloseRegister = () => {
    setRegisterModalOpen(false);
  };

  const handleOpenVideo = () => {
    setVideoModalOpen(true);
  };

  const handleCloseVideo = () => {
    setVideoModalOpen(false);
  };

  const handleOpenLightbox = (idOrIndex: string | number = 0) => {
    if (typeof idOrIndex === 'string') {
      const idx = GALLERY_ITEMS.findIndex((item) => item.id === idOrIndex);
      setCurrentLightboxIndex(idx !== -1 ? idx : 0);
    } else {
      setCurrentLightboxIndex(idOrIndex);
    }
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  const handleNavigateLightbox = (index: number) => {
    setCurrentLightboxIndex(index);
  };

  const handleExploreWorkshop = () => {
    const el = document.getElementById('preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[var(--text-main)] transition-colors duration-300 antialiased selection:bg-purple-600 selection:text-white relative">
      {/* Premium Animated Background Layer */}
      <AnimatedBackground />

      {/* 1. Navigation Bar */}
      <Navbar
        onOpenRegister={handleOpenRegister}
        onOpenLightbox={handleOpenLightbox}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          onOpenRegister={handleOpenRegister}
          onExploreWorkshop={handleExploreWorkshop}
          onOpenLightbox={handleOpenLightbox}
        />

        {/* 3. Workshop Preview Area */}
        <WorkshopPreview
          onOpenVideo={handleOpenVideo}
          onOpenRegister={handleOpenRegister}
          onOpenLightbox={handleOpenLightbox}
        />

        {/* 4. Trust and Community Statistics */}
        <CommunityStats onOpenRegister={handleOpenRegister} />

        {/* 5. Workshop Benefits (What You'll Learn) */}
        <Benefits onOpenRegister={handleOpenRegister} />

        {/* 6. Workshop Agenda */}
        <WorkshopAgenda onOpenRegister={handleOpenRegister} />

        {/* 7. Testimonials Layout */}
        <Testimonials />

        {/* 8. Instructor Introduction */}
        <Instructor />

        {/* 9. Registration and Pricing Section */}
        <Registration
          onOpenRegister={handleOpenRegister}
          onOpenLightbox={handleOpenLightbox}
        />

        {/* 10. Frequently Asked Questions */}
        <FAQ />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* Modals & Overlays */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={handleCloseVideo}
        onOpenRegister={handleOpenRegister}
      />

      <RegistrationModal
        isOpen={registerModalOpen}
        onClose={handleCloseRegister}
      />

      <ImageLightbox
        isOpen={lightboxOpen}
        item={GALLERY_ITEMS[currentLightboxIndex]}
        items={GALLERY_ITEMS}
        currentIndex={currentLightboxIndex}
        onClose={handleCloseLightbox}
        onNavigate={handleNavigateLightbox}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
