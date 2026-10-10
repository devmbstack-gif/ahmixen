'use client';

import { Bot } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function AgentsIcon({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <span className={`bento-anim-icon ${className}`} aria-hidden="true">
      <span className="bento-anim-glow" />
      <motion.span
        className="bento-agents-float"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Bot className="bento-anim-svg" strokeWidth={1.75} />
        <motion.span
          className="bento-bot-eye bento-bot-eye-l"
          animate={reduce ? undefined : { opacity: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.42, 0.48, 0.54, 1] }}
        />
        <motion.span
          className="bento-bot-eye bento-bot-eye-r"
          animate={reduce ? undefined : { opacity: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.42, 0.48, 0.54, 1] }}
        />
      </motion.span>
    </span>
  );
}
