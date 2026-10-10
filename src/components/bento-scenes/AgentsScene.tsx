'use client';

import { Bot, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const STEPS = [0, 1, 2];

export function AgentsScene() {
  const reduce = useReducedMotion();

  return (
    <div className="learn-scene learn-scene-agents" aria-hidden="true">
      <div className="learn-steps">
        {STEPS.map((i) => (
          <div key={i} className="learn-step">
            <motion.span
              className="learn-step-ring"
              animate={
                reduce
                  ? undefined
                  : { opacity: [0.4, 1, 1, 0.4], scale: [0.95, 1.05, 1, 0.95] }
              }
              transition={{
                duration: 3.6,
                times: [0, 0.2, 0.55, 1],
                delay: i * 0.9,
                repeat: Infinity,
              }}
            />
            <motion.span
              className="learn-step-check"
              animate={
                reduce
                  ? { opacity: 1, scale: 1 }
                  : { opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.55] }
              }
              transition={{
                duration: 3.6,
                times: [0, 0.22, 0.7, 1],
                delay: i * 0.9,
                repeat: Infinity,
              }}
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
            </motion.span>
            <motion.span
              className="learn-step-bot"
              animate={
                reduce
                  ? { opacity: i === 0 ? 1 : 0 }
                  : { opacity: [0, 1, 1, 0], y: [6, 0, 0, -4] }
              }
              transition={{
                duration: 3.6,
                times: [0, 0.15, 0.55, 1],
                delay: i * 0.9,
                repeat: Infinity,
              }}
            >
              <Bot className="w-6 h-6" strokeWidth={1.75} />
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
}
