'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AI_STACK_TOOLS } from '@/data/aiStackTools';

const EASE = [0.16, 1, 0.3, 1] as const;

function ToolMark({
  name,
  logo,
  accent,
}: {
  name: string;
  logo: string | null;
  accent: string;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static public SVGs
      <img src={logo} alt="" className="ai-stack-logo" loading="lazy" />
    );
  }
  return (
    <span
      className="ai-stack-fallback"
      style={{
        background: `color-mix(in srgb, ${accent} 28%, #111019)`,
        color: accent,
      }}
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AiStack() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="ai-stack"
      className="section-y bg-transparent"
      aria-labelledby="ai-stack-heading"
    >
      <div className="ai-stack-container">
        <motion.div
          className="ai-stack-shell"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: EASE }}
        >
          <div className="ai-stack-layout">
            <div className="ai-stack-copy">
              <h2 id="ai-stack-heading" className="ai-stack-title">
                <span className="ai-stack-title-lead">Meet your future</span>
                <span className="ai-stack-title-accent gradient-text-ahmixen">
                  {' '}
                  AI stack
                </span>
              </h2>
            </div>

            <ul className="ai-stack-pills" aria-label="AI tools you will use">
              {AI_STACK_TOOLS.map((tool, index) => (
                <motion.li
                  key={tool.id}
                  className="ai-stack-pill"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.35,
                    delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.35),
                    ease: EASE,
                  }}
                >
                  <ToolMark
                    name={tool.name}
                    logo={tool.logo}
                    accent={tool.accent}
                  />
                  <span className="ai-stack-pill-name">{tool.name}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
