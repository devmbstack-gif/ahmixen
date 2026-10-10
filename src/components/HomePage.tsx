'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { WorkshopPreview } from './WorkshopPreview';
import { Community } from './Community';
import { Benefits } from './Benefits';
import { RiseInAiJobs } from './RiseInAiJobs';
import { WorkshopAgenda } from './WorkshopAgenda';
import { Instructor } from './Instructor';
import { Testimonials } from './Testimonials';
import { Registration } from './Registration';
import { FAQ } from './FAQ';
import { Footer } from './Footer';
import { VideoModal } from './VideoModal';
import { RegistrationModal } from './RegistrationModal';
import { AnimatedBackground } from './AnimatedBackground';
import { WhatsAppFloat } from './WhatsAppFloat';

export const HomePage: React.FC = () => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const handleOpenRegister = () => setRegisterModalOpen(true);
  const handleCloseRegister = () => setRegisterModalOpen(false);
  const handleOpenVideo = () => setVideoModalOpen(true);
  const handleCloseVideo = () => setVideoModalOpen(false);

  const handleExploreWorkshop = () => {
    document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[var(--text-main)] transition-colors duration-300 antialiased selection:bg-purple-600 selection:text-white relative">
      <AnimatedBackground />

      <Navbar onOpenRegister={handleOpenRegister} />

      <main className="flex-1">
        <Hero
          onOpenRegister={handleOpenRegister}
          onExploreWorkshop={handleExploreWorkshop}
        />
        <WorkshopPreview
          onOpenVideo={handleOpenVideo}
          onOpenRegister={handleOpenRegister}
        />
        <Community />
        <Benefits />
        <RiseInAiJobs onOpenRegister={handleOpenRegister} />
        <WorkshopAgenda />
        <Instructor />
        <Testimonials />
        <Registration onOpenRegister={handleOpenRegister} />
        <FAQ />
      </main>

      <Footer />
      <WhatsAppFloat />

      <VideoModal
        isOpen={videoModalOpen}
        onClose={handleCloseVideo}
        onOpenRegister={handleOpenRegister}
      />
      <RegistrationModal isOpen={registerModalOpen} onClose={handleCloseRegister} />
    </div>
  );
};
