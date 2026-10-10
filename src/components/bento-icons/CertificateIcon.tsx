'use client';

import { Award } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function CertificateIcon({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <span className={`bento-anim-icon ${className}`} aria-hidden="true">
      <span className="bento-anim-glow" />
      <Award className="bento-anim-svg" strokeWidth={1.75} />
      {!reduce && (
        <motion.span
          className="bento-cert-shine"
          animate={{ x: ['-120%', '140%'] }}
          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 2.8, ease: 'easeInOut' }}
        />
      )}
    </span>
  );
}
