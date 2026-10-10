'use client';

import { motion, useReducedMotion } from 'framer-motion';

const BUBBLES = [
  { side: 'left', w: 0.7 },
  { side: 'right', w: 0.55 },
  { side: 'left', w: 0.8 },
  { side: 'right', w: 0.45 },
] as const;

export function QnAScene() {
  const reduce = useReducedMotion();

  return (
    <div className="learn-scene learn-scene-qna" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <motion.div
          key={i}
          className={`learn-bubble learn-bubble-${b.side}`}
          style={{ width: `${b.w * 100}%` }}
          initial={reduce ? false : { opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: reduce ? 0 : 0.4,
            delay: reduce ? 0 : i * 0.45,
            repeat: reduce ? 0 : Infinity,
            repeatDelay: 2,
          }}
        >
          <span className="learn-skel learn-skel-soft" style={{ width: '80%' }} />
          <span className="learn-skel learn-skel-soft" style={{ width: '55%' }} />
        </motion.div>
      ))}
    </div>
  );
}
