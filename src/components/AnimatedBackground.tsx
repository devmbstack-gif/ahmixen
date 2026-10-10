'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Decorative background. Static layers use CSS variables (hydration-safe).
 * Canvas particles sync after mount via theme from context.
 */
export const AnimatedBackground: React.FC = () => {
  const { theme, mounted } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let rafId = 0;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const isMobile = width < 768;
    const particleCount = isMobile ? 14 : 32;

    const particleColors =
      theme === 'dark'
        ? [
            'rgba(250, 250, 250, 0.45)',
            'rgba(216, 180, 254, 0.45)',
            'rgba(168, 85, 247, 0.40)',
            'rgba(192, 132, 252, 0.35)',
          ]
        : [
            'rgba(124, 58, 237, 0.35)',
            'rgba(147, 51, 234, 0.30)',
            'rgba(168, 85, 247, 0.25)',
            'rgba(192, 132, 252, 0.20)',
          ];

    interface Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      speedY: number;
      speedX: number;
      phase: number;
      amplitude: number;
    }

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.8,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      speedY: Math.random() * 0.25 + 0.1,
      speedX: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
      amplitude: Math.random() * 0.35 + 0.15,
    }));

    if (reducedMotion) {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p) => {
          p.phase += 0.015;
          p.y -= p.speedY;
          p.x += Math.sin(p.phase) * p.amplitude + p.speedX;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme, reducedMotion, mounted]);

  const orbParallaxOffset = reducedMotion ? 0 : Math.min(scrollY * -0.06, 200);
  const particleParallaxOffset = reducedMotion ? 0 : Math.min(scrollY * -0.02, 100);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none bg-[var(--bg-primary)] transition-colors duration-500"
    >
      {/* Same hero look for the whole page */}
      <div className="absolute inset-0 tech-grid-pattern opacity-40 mix-blend-overlay pointer-events-none" />

      <div className="ahmixen-bg-ambient absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[min(100vh,900px)] pointer-events-none opacity-70" />

      {/* Hero floor purple wash — fixed so every section shares it */}
      <div className="hero-floor-glow absolute inset-x-0 bottom-0 h-[75%] pointer-events-none" />

      <div
        className="absolute inset-0 w-full h-full will-change-transform pointer-events-none"
        style={{
          transform: `translate3d(0, ${orbParallaxOffset}px, 0)`,
          transition: reducedMotion ? 'none' : 'transform 0.15s cubic-bezier(0, 0, 0.2, 1)',
        }}
      >
        <div
          className={`ahmixen-bg-orb ahmixen-bg-orb-1 absolute -top-20 right-[-8%] w-[580px] h-[580px] rounded-full blur-[140px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-1'
          }`}
        />
        <div
          className={`ahmixen-bg-orb ahmixen-bg-orb-2 absolute top-[35%] left-[-10%] w-[520px] h-[520px] rounded-full blur-[150px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-2'
          }`}
        />
        <div
          className={`ahmixen-bg-orb ahmixen-bg-orb-3 absolute top-[65%] right-[-5%] w-[480px] h-[480px] rounded-full blur-[140px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-3'
          }`}
        />
        <div
          className={`ahmixen-bg-orb ahmixen-bg-orb-4 absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-1'
          }`}
        />
      </div>

      <div
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
        style={{ transform: `translate3d(0, ${particleParallaxOffset}px, 0)` }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="ahmixen-bg-vignette absolute inset-0 pointer-events-none" />
    </div>
  );
};
