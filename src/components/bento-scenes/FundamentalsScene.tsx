'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function FundamentalsScene() {
  const reduce = useReducedMotion();

  return (
    <div className="learn-scene" aria-hidden="true">
      <div className="learn-prompt">
        <div className="learn-prompt-bar" />
        <div className="learn-prompt-lines">
          {[0.92, 0.7, 0.55].map((w, i) => (
            <motion.span
              key={`q-${i}`}
              className="learn-skel"
              style={{ width: `${w * 100}%` }}
              initial={reduce ? false : { opacity: 0, scaleX: 0.2 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                duration: reduce ? 0 : 0.45,
                delay: reduce ? 0 : 0.15 + i * 0.28,
                ease: [0.16, 1, 0.3, 1],
                repeat: reduce ? 0 : Infinity,
                repeatDelay: 2.4,
              }}
            />
          ))}
        </div>
      </div>
      <div className="learn-answer">
        {[0.85, 0.95, 0.6].map((w, i) => (
          <motion.span
            key={`a-${i}`}
            className="learn-skel learn-skel-soft"
            style={{ width: `${w * 100}%` }}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0 : 0.4,
              delay: reduce ? 0 : 1.2 + i * 0.22,
              ease: [0.16, 1, 0.3, 1],
              repeat: reduce ? 0 : Infinity,
              repeatDelay: 2.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}
