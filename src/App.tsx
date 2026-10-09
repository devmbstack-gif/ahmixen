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

export const AppContent: React.FC = () => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

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
      <Navbar onOpenRegister={handleOpenRegister} />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          onOpenRegister={handleOpenRegister}
          onExploreWorkshop={handleExploreWorkshop}
        />

        {/* 3. Workshop Preview Area */}
        <WorkshopPreview
          onOpenVideo={handleOpenVideo}
          onOpenRegister={handleOpenRegister}
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
        <Registration onOpenRegister={handleOpenRegister} />

        {/* 10. Frequently Asked Questions */}
        <FAQ />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* Modals */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={handleCloseVideo}
        onOpenRegister={handleOpenRegister}
      />

      <RegistrationModal
        isOpen={registerModalOpen}
        onClose={handleCloseRegister}
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
