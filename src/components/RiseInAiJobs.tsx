'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from './Reveal';
import { PROOF_ITEMS, type ProofItem } from '../data/proofItems';
import type { AiJobsContentData } from '@/lib/content/landingSchemas';

const ROTATIONS = [-2, 0, 2] as const;
const EASE = [0.16, 1, 0.3, 1] as const;

function useCountUp(target: number, active: boolean, reduceMotion: boolean | null) {
  const [value, setValue] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    if (!active) return;

    const duration = 1200;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduceMotion, target]);

  return value;
}

function ProofCard({
  item,
  index,
  reduceMotion,
}: {
  item: ProofItem;
  index: number;
  reduceMotion: boolean | null;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [active, setActive] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const count = useCountUp(item.number, active, reduceMotion);
  const restRotate = reduceMotion || !desktop ? 0 : ROTATIONS[index] ?? 0;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <motion.a
      ref={ref}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`proof-card proof-card-${index}`}
      aria-label={`${item.publisher}: ${item.prefix}${item.number}${item.suffix}. ${item.headline}`}
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: -28, rotate: restRotate === 0 ? 0 : restRotate - 4 }
      }
      whileInView={{ opacity: 1, y: 0, rotate: restRotate }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.55,
        delay: reduceMotion ? 0 : index * 0.1,
        ease: EASE,
      }}
      whileHover={
        reduceMotion
          ? { y: -8 }
          : { y: -8, rotate: 0, transition: { duration: 0.28, ease: EASE } }
      }
    >
      <span className="proof-card-inner">
        <span className="proof-publisher">{item.publisher}</span>
        <span className="proof-number tabular-nums">
          {item.prefix}
          {count}
          {item.suffix}
        </span>
        <span className="proof-headline">{item.headline}</span>
        <ArrowUpRight className="proof-arrow" aria-hidden="true" strokeWidth={2.25} />
      </span>
    </motion.a>
  );
}

export const RiseInAiJobs: React.FC<{ content?: AiJobsContentData }> = ({
  content,
}) => {
  const reduceMotion = useReducedMotion();
  const items = (content?.items as ProofItem[]) || PROOF_ITEMS;
  const eyebrow = content?.eyebrow ?? 'The AI job shift';
  const headingBefore = content?.headingBefore ?? 'Jobs are moving to';
  const headingAccent = content?.headingAccent ?? 'AI-ready people';

  return (
    <section
      id="rise-ai-jobs"
      className="section-y-lg relative overflow-hidden bg-transparent"
      aria-labelledby="rise-ai-jobs-heading"
    >
      <div className="relative container-narrow">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
          <p className="inline-flex px-3.5 py-1.5 rounded-full purple-badge type-micro">
            {eyebrow}
          </p>
          <h2 id="rise-ai-jobs-heading" className="type-title text-ink">
            {headingBefore}{' '}
            <span className="gradient-text-ahmixen">{headingAccent}</span>
          </h2>
        </Reveal>

        <div className="proof-row mb-10">
          {items.map((item, index) => (
            <ProofCard
              key={`${item.publisher}-${item.number}-${item.headline}`}
              item={item}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
