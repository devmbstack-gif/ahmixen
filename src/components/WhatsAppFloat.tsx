'use client';

import { MessageCircle } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';

export const WhatsAppFloat: React.FC = () => {
  const href = `https://wa.me/${WORKSHOP_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    WORKSHOP_CONFIG.whatsappPrefill
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with AhmiXen on WhatsApp"
      className="whatsapp-float"
    >
      <span className="whatsapp-float-pulse" aria-hidden="true" />
      <MessageCircle className="relative z-[1] w-5 h-5 fill-white shrink-0" />
      <span className="whatsapp-float-label">Let&apos;s have a chat!</span>
    </a>
  );
};
