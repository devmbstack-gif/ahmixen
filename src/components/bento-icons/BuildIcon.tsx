'use client';

import { Code2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function BuildIcon({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <span className={`bento-anim-icon ${className}`} aria-hidden="true">
      <span className="bento-anim-glow" />
      <span className="bento-build-row">
        <Code2 className="bento-anim-svg" strokeWidth={1.75} />
        <motion.span
          className="bento-build-cursor"
          animate={reduce ? undefined : { opacity: [1, 0, 1] }}
          transition={{ duration: 1.05, repeat: Infinity, ease: 'linear' }}
        />
      </span>
    </span>
  );
}
