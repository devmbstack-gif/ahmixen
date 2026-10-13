import React from 'react';
import Image from 'next/image';

interface AhmiXenLogoProps {
  className?: string;
}

/**
 * Official AhmiXen wordmark from /public/ahmixen-logo.png.
 * Height follows the parent font-size via h-[1em] so existing
 * text-* size classes on className keep working.
 */
export const AhmiXenLogo: React.FC<AhmiXenLogoProps> = ({ className = '' }) => {
  return (
    <span
      className={`ahmixen-logo inline-flex items-center leading-none select-none ${className}`}
      aria-label="AhmiXen"
    >
      <Image
        src="/ahmixen-logo.png"
        alt="AhmiXen"
        width={960}
        height={191}
        className="ahmixen-logo-img h-[1em] w-auto"
        priority
      />
    </span>
  );
};
