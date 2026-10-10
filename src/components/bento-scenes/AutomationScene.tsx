'use client';

import { motion, useReducedMotion } from 'framer-motion';

const NODES = [
  { x: 12, y: 50 },
  { x: 32, y: 28 },
  { x: 52, y: 58 },
  { x: 72, y: 32 },
  { x: 90, y: 52 },
];

export function AutomationScene() {
  const reduce = useReducedMotion();

  return (
    <div className="learn-scene learn-scene-auto" aria-hidden="true">
      <svg className="learn-auto-svg" viewBox="0 0 100 80" fill="none">
        <path
          d="M12 50 C22 50 22 28 32 28 C42 28 42 58 52 58 C62 58 62 32 72 32 C82 32 82 52 90 52"
          className="learn-auto-path"
          strokeLinecap="round"
        />
        {NODES.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r="4.5"
            className="learn-auto-node"
            animate={
              reduce
                ? undefined
                : { opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }
            }
            transition={{
              duration: 2.8,
              delay: i * 0.35,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {!reduce && (
          <motion.circle
            r="2.8"
            className="learn-auto-dot"
            animate={{
              cx: [12, 32, 52, 72, 90],
              cy: [50, 28, 58, 32, 52],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </svg>
    </div>
  );
}
