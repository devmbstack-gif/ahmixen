import React from 'react';

interface AhmiXenLogoProps {
  className?: string;
}

/**
 * Transparent text wordmark — no image plate / black background.
 * "Ahmi" follows theme; "Xen" keeps brand purple gradient in both modes.
 */
export const AhmiXenLogo: React.FC<AhmiXenLogoProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-baseline font-extrabold tracking-tight leading-none select-none ${className}`}
      aria-label="AhmiXen"
    >
      <span className="text-[var(--text-main)]">Ahmi</span>
      <span className="ahmixen-logo-xen">Xen</span>
    </span>
  );
};
