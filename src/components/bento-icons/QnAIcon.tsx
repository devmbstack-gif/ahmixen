'use client';

import { MessageCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function QnAIcon({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <span className={`bento-anim-icon ${className}`} aria-hidden="true">
      <span className="bento-anim-glow" />
      <MessageCircle className="bento-anim-svg" strokeWidth={1.75} />
      <span className="bento-qna-dots">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="bento-qna-dot"
            animate={reduce ? undefined : { y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.18,
            }}
          />
        ))}
      </span>
    </span>
  );
}
