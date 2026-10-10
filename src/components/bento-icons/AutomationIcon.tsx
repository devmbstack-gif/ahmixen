'use client';

import { Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function AutomationIcon({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <span className={`bento-anim-icon ${className}`} aria-hidden="true">
      <span className="bento-anim-glow" />
      <svg
        className="bento-workflow-svg"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="18" cy="40" r="7" className="bento-workflow-node" />
        <circle cx="62" cy="22" r="7" className="bento-workflow-node" />
        <circle cx="62" cy="58" r="7" className="bento-workflow-node" />
        <path
          d="M25 40 H40 C48 40 48 22 55 22"
          className="bento-workflow-line"
          strokeLinecap="round"
        />
        <path
          d="M25 40 H40 C48 40 48 58 55 58"
          className="bento-workflow-line"
          strokeLinecap="round"
        />
        {!reduce && (
          <motion.circle
            r="3.2"
            className="bento-workflow-traveler"
            animate={{
              cx: [25, 40, 55, 62],
              cy: [40, 40, 22, 22],
              opacity: [0.4, 1, 1, 0.5],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.35 }}
          />
        )}
      </svg>
      <motion.span
        className="bento-sparkle"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
      </motion.span>
    </span>
  );
}
