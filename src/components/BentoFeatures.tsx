'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BENTO_FEATURES } from '../data/workshopData';
import { Reveal } from './Reveal';
import {
  AgentsIcon,
  AutomationIcon,
  BuildIcon,
  CertificateIcon,
  FundamentalsIcon,
  QnAIcon,
} from './bento-icons';
import {
  AgentsScene,
  AutomationScene,
  BuildScene,
  CertificateScene,
  FundamentalsScene,
  QnAScene,
} from './bento-scenes';

const LIST_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  fundamentals: FundamentalsIcon,
  agents: AgentsIcon,
  automation: AutomationIcon,
  building: BuildIcon,
  'live-qa': QnAIcon,
  certificate: CertificateIcon,
};

const SCENES: Record<string, ComponentType> = {
  fundamentals: FundamentalsScene,
  agents: AgentsScene,
  automation: AutomationScene,
  building: BuildScene,
  'live-qa': QnAScene,
  certificate: CertificateScene,
};

const INTERVAL_MS = 4000;
const EASE = [0.16, 1, 0.3, 1] as const;

export const BentoFeatures: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [edgeFade, setEdgeFade] = useState({ left: false, right: true });
  const total = BENTO_FEATURES.length;

  const updateEdgeFade = useCallback(() => {
    const list = listRef.current;
    if (!list || window.matchMedia('(min-width: 1024px)').matches) {
      setEdgeFade({ left: false, right: false });
      return;
    }
    const maxScroll = list.scrollWidth - list.clientWidth;
    setEdgeFade({
      left: list.scrollLeft > 4,
      right: maxScroll > 4 && list.scrollLeft < maxScroll - 4,
    });
  }, []);

  const select = useCallback(
    (index: number, focusTab = false) => {
      const next = ((index % total) + total) % total;
      setActive(next);
      if (focusTab) {
        requestAnimationFrame(() => {
          document.getElementById(`${baseId}-tab-${BENTO_FEATURES[next].id}`)?.focus();
        });
      }
    },
    [total, baseId]
  );

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % total);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, total, active]);

  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    const tab = tabRefs.current[active];
    if (!tab) return;
    tab.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
    updateEdgeFade();
  }, [active, reduceMotion, updateEdgeFade]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    updateEdgeFade();
    list.addEventListener('scroll', updateEdgeFade, { passive: true });
    window.addEventListener('resize', updateEdgeFade);
    return () => {
      list.removeEventListener('scroll', updateEdgeFade);
      window.removeEventListener('resize', updateEdgeFade);
    };
  }, [updateEdgeFade]);

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      select(active + 1, true);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      select(active - 1, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      select(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      select(total - 1, true);
    }
  };

  const feature = BENTO_FEATURES[active];
  const Scene = SCENES[feature.id] ?? FundamentalsScene;

  return (
    <section
      id="benefits"
      className="relative section-y overflow-hidden bg-transparent"
      aria-labelledby="bento-heading"
    >
      <div className="container-page">
        <Reveal className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-2">
          <p className="inline-flex px-3.5 py-1.5 rounded-full purple-badge type-micro">
            What you&apos;ll learn
          </p>
          <h2 id="bento-heading" className="type-title text-ink">
            Skills that stick —{' '}
            <span className="gradient-text-ahmixen">in one live session</span>
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            className="learn-shell"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setPaused(false);
              }
            }}
          >
            <div
              ref={listRef}
              className={[
                'learn-list',
                edgeFade.left ? 'has-fade-left' : '',
                edgeFade.right ? 'has-fade-right' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="tablist"
              aria-label="What you'll learn"
              onKeyDown={onListKeyDown}
            >
              {BENTO_FEATURES.map((item, index) => {
                const Icon = LIST_ICONS[item.id] ?? FundamentalsIcon;
                const isActive = index === active;
                const tabId = `${baseId}-tab-${item.id}`;
                const panelId = `${baseId}-panel-${item.id}`;

                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={tabId}
                    aria-selected={isActive}
                    aria-controls={panelId}
                    tabIndex={isActive ? 0 : -1}
                    className={`learn-tab${isActive ? ' is-active' : ''}`}
                    onClick={() => select(index)}
                  >
                    {isActive && !reduceMotion && (
                      <motion.span
                        layoutId="learn-tab-indicator"
                        className="learn-tab-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    {isActive && reduceMotion && (
                      <span className="learn-tab-indicator" />
                    )}
                    <span className="learn-tab-icon">
                      <Icon />
                    </span>
                    <span className="learn-tab-title">{item.title}</span>
                    <span className="sr-only">{item.description}</span>
                    {isActive && !reduceMotion && (
                      <span className="learn-tab-progress" aria-hidden="true">
                        <motion.span
                          key={`progress-${active}-${paused}`}
                          className="learn-tab-progress-bar"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: paused ? 0 : 1 }}
                          transition={
                            paused
                              ? { duration: 0.25 }
                              : { duration: INTERVAL_MS / 1000, ease: 'linear' }
                          }
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div
              className="learn-preview"
              role="tabpanel"
              id={`${baseId}-panel-${feature.id}`}
              aria-labelledby={`${baseId}-tab-${feature.id}`}
            >
              <p className="sr-only">{feature.description}</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={feature.id}
                  className="learn-preview-inner"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: EASE }}
                >
                  <Scene />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
