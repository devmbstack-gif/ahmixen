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
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white pl-3.5 pr-4 py-3 shadow-[0_10px_30px_rgba(37,211,102,0.45)] hover:bg-[#20bd5a] hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
    >
      <MessageCircle className="w-5 h-5 fill-white" />
      <span className="text-sm font-semibold hidden sm:inline">Let&apos;s have a chat!</span>
    </a>
  );
};
