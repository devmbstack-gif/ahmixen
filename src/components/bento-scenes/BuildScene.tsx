'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function BuildScene() {
  const reduce = useReducedMotion();

  return (
    <div className="learn-scene learn-scene-build" aria-hidden="true">
      <div className="learn-code">
        <div className="learn-code-chrome">
          <span />
          <span />
          <span />
        </div>
        <div className="learn-code-body">
          {[0.55, 0.8, 0.4, 0.72, 0.5].map((w, i) => (
            <motion.span
              key={i}
              className="learn-skel"
              style={{ width: `${w * 100}%` }}
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reduce ? 0 : 0.35,
                delay: reduce ? 0 : i * 0.2,
                repeat: reduce ? 0 : Infinity,
                repeatDelay: 2.2,
              }}
            />
          ))}
        </div>
      </div>
      <motion.div
        className="learn-app-preview"
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: reduce ? 0 : 0.5,
          delay: reduce ? 0 : 1.1,
          repeat: reduce ? 0 : Infinity,
          repeatDelay: 2.2,
        }}
      >
        <span className="learn-app-hero" />
        <span className="learn-skel learn-skel-soft" style={{ width: '70%' }} />
        <span className="learn-skel learn-skel-soft" style={{ width: '45%' }} />
      </motion.div>
    </div>
  );
}
