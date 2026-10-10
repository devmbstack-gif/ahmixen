'use client';

import { Cpu } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function FundamentalsIcon({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <span className={`bento-anim-icon ${className}`} aria-hidden="true">
      <span className="bento-anim-glow" />
      <motion.span
        className="bento-fund-ring"
        animate={reduce ? undefined : { opacity: [0.35, 0.9, 0.35], scale: [0.94, 1.08, 0.94] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="bento-orbit"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{
            duration: 7 + i,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.9,
          }}
        >
          <span className="bento-orbit-dot" />
        </motion.span>
      ))}
      <Cpu className="bento-anim-svg" strokeWidth={1.75} />
    </span>
  );
}
