'use client';

import { Award } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function CertificateScene() {
  const reduce = useReducedMotion();

  return (
    <div className="learn-scene learn-scene-cert" aria-hidden="true">
      <div className="learn-cert-card">
        <Award className="learn-cert-medal" strokeWidth={1.6} />
        <span className="learn-skel learn-skel-soft" style={{ width: '62%' }} />
        <span className="learn-skel learn-skel-soft" style={{ width: '40%' }} />
        {!reduce && (
          <motion.span
            className="learn-cert-shine"
            animate={{ x: ['-130%', '160%'] }}
            transition={{ duration: 1.15, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
          />
        )}
      </div>
    </div>
  );
}
