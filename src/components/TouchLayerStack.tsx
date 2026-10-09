'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface TouchLayerStackProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T, isFront: boolean, index: number) => ReactNode;
  stackClassName?: string;
  hint?: string;
}

function readMetrics(el: HTMLElement) {
  const cardProbe = document.createElement('div');
  cardProbe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;height:var(--layer-card-h)';
  const peekProbe = document.createElement('div');
  peekProbe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;height:var(--layer-peek)';
  el.appendChild(cardProbe);
  el.appendChild(peekProbe);
  const cardH = cardProbe.offsetHeight || 180;
  const peek = peekProbe.offsetHeight || 48;
  el.removeChild(cardProbe);
  el.removeChild(peekProbe);
  return { cardH, peek };
}

export function TouchLayerStack<T>({
  items,
  getKey,
  renderCard,
  stackClassName = '',
  hint = 'Tap a layer to open · tap front for next',
}: TouchLayerStackProps<T>) {
  const reduceMotion = useReducedMotion();
  const stackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const [metrics, setMetrics] = useState({ cardH: 180, peek: 48 });
  const total = items.length;

  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    const update = () => setMetrics(readMetrics(el));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const openLayer = (index: number) => {
    if (index === activeIndex) {
      setActiveIndex((prev) => (prev + 1) % total);
      return;
    }
    setActiveIndex(index);
  };

  return (
    <div className="w-full">
      <motion.div
        ref={stackRef}
        className={`touch-layer-stack relative mx-auto ${stackClassName}`}
        style={{ ['--layer-count' as string]: total }}
        viewport={{ once: true, amount: 0.3 }}
        onViewportEnter={() => setEntered(true)}
      >
        {items.map((item, index) => {
          const depth =
            index === activeIndex
              ? 0
              : index < activeIndex
                ? total - activeIndex + index
                : index - activeIndex;

          const isFront = depth === 0;
          const top = (total - 1 - depth) * metrics.peek;
          const height = isFront ? metrics.cardH : metrics.peek + 4;
          const scale = 1 - depth * 0.015;
          const fromLeft = index % 2 === 0;

          return (
            <motion.article
              key={getKey(item)}
              role="button"
              tabIndex={0}
              aria-pressed={isFront}
              onClick={() => openLayer(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLayer(index);
                }
              }}
              initial={false}
              animate={{
                top,
                height,
                scale: isFront ? 1 : scale,
                zIndex: total - depth,
                rotate: isFront ? 0 : fromLeft ? -0.6 : 0.6,
              }}
              whileHover={
                reduceMotion || !isFront
                  ? undefined
                  : { scale: 1.015, transition: { duration: 0.2 } }
              }
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 290, damping: 28, mass: 0.85 }
              }
              className={`touch-layer absolute left-0 right-0 cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isFront ? 'touch-layer-active' : ''
              }`}
              style={{ transformOrigin: 'center top' }}
            >
              <div className="touch-layer-shimmer" aria-hidden="true" />

              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: 42, x: fromLeft ? -24 : 24 }
                }
                animate={
                  entered || reduceMotion
                    ? { opacity: 1, y: 0, x: 0 }
                    : { opacity: 0, y: 42, x: fromLeft ? -24 : 24 }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness: 250,
                        damping: 24,
                        delay: index * 0.16,
                      }
                }
                className="relative h-full w-full"
              >
                {renderCard(item, isFront, index)}
              </motion.div>
            </motion.article>
          );
        })}
      </motion.div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-2">
          {items.map((item, i) => (
            <motion.button
              key={getKey(item)}
              type="button"
              aria-label={`Show item ${i + 1}`}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full cursor-pointer ${
                i === activeIndex ? 'bg-purple-500' : 'bg-purple-500/30 hover:bg-purple-500/50'
              }`}
              animate={{
                width: i === activeIndex ? 20 : 6,
                boxShadow:
                  i === activeIndex ? '0 0 10px rgba(168,85,247,0.65)' : '0 0 0 rgba(0,0,0,0)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            />
          ))}
        </div>
        <p className="text-[11px] sm:text-xs text-[var(--text-muted)] text-center px-2">
          {hint}
        </p>
      </div>
    </div>
  );
}
