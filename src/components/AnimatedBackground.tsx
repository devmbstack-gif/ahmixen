import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export const AnimatedBackground: React.FC = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Restrained scroll parallax tracking using requestAnimationFrame
  useEffect(() => {
    if (reducedMotion) return;

    let rafId: number;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  // Subtle Particle Canvas System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isVisible = true;

    // Handle visibility changes to save battery & CPU
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Dynamic resize handler
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Adaptive particle count: fewer on mobile for silky 60fps performance
    const isMobile = width < 768;
    const particleCount = isMobile ? 14 : 32;

    // Particle colors matching AhmiXen white-to-purple logo gradient
    const particleColors = theme === 'dark'
      ? ['rgba(250, 250, 250, 0.45)', 'rgba(216, 180, 254, 0.45)', 'rgba(168, 85, 247, 0.40)', 'rgba(192, 132, 252, 0.35)']
      : ['rgba(124, 58, 237, 0.35)', 'rgba(147, 51, 234, 0.30)', 'rgba(168, 85, 247, 0.25)', 'rgba(192, 132, 252, 0.20)'];

    interface Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      speedY: number;
      speedX: number;
      phase: number;
      amplitude: number;
      alpha: number;
    }

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.8, // 0.8px to 2.3px (refined & subtle)
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      speedY: Math.random() * 0.25 + 0.1, // slow upward drift
      speedX: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
      amplitude: Math.random() * 0.35 + 0.15,
      alpha: Math.random() * 0.3 + 0.2,
    }));

    // If reduced motion is requested, render a static single frame
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

    // Animation Loop
    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        particles.forEach((p) => {
          // Update positions with sinusoidal sway
          p.phase += 0.015;
          p.y -= p.speedY;
          p.x += Math.sin(p.phase) * p.amplitude + p.speedX;

          // Wrap around edges gracefully
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          // Draw particle with gentle glow
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
  }, [theme, reducedMotion]);

  // Parallax translation factors (restrained to avoid motion sickness or layout shifts)
  const orbParallaxOffset = reducedMotion ? 0 : Math.min(scrollY * -0.06, 200);
  const particleParallaxOffset = reducedMotion ? 0 : Math.min(scrollY * -0.02, 100);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none transition-colors duration-500"
      style={{
        backgroundColor: theme === 'dark' ? '#050505' : '#FAFAFC',
      }}
    >
      {/* LAYER 1: Deep Layered CSS Gradients & Tech Mesh */}
      <div className="absolute inset-0 tech-grid-pattern opacity-40 mix-blend-overlay pointer-events-none" />

      {/* Ambient Radial Top Glow */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] pointer-events-none transition-opacity duration-700 ${
          theme === 'dark' ? 'opacity-80' : 'opacity-35'
        }`}
        style={{
          background:
            theme === 'dark'
              ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124, 58, 237, 0.22) 0%, rgba(147, 51, 234, 0.09) 45%, transparent 75%)'
              : 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(147, 51, 234, 0.12) 0%, rgba(168, 85, 247, 0.04) 45%, transparent 75%)',
        }}
      />

      {/* LAYER 2: Slow Floating Violet Orbs with Restrained Parallax */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform pointer-events-none"
        style={{
          transform: `translate3d(0, ${orbParallaxOffset}px, 0)`,
          transition: reducedMotion ? 'none' : 'transform 0.15s cubic-bezier(0, 0, 0.2, 1)',
        }}
      >
        {/* Orb 1: Upper Right Violet Glow */}
        <div
          className={`absolute -top-20 right-[-8%] w-[580px] h-[580px] rounded-full blur-[140px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-1'
          }`}
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(147, 51, 234, 0.12) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(147, 51, 234, 0.10) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 75%)',
          }}
        />

        {/* Orb 2: Center Left Royal Purple Glow */}
        <div
          className={`absolute top-[35%] left-[-10%] w-[520px] h-[520px] rounded-full blur-[150px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-2'
          }`}
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(147, 51, 234, 0.20) 0%, rgba(109, 40, 217, 0.10) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(147, 51, 234, 0.04) 50%, transparent 75%)',
          }}
        />

        {/* Orb 3: Mid-Bottom Soft Lavender Accent */}
        <div
          className={`absolute top-[65%] right-[-5%] w-[480px] h-[480px] rounded-full blur-[140px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-3'
          }`}
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(192, 132, 252, 0.16) 0%, rgba(124, 58, 237, 0.08) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(168, 85, 247, 0.07) 0%, rgba(192, 132, 252, 0.03) 50%, transparent 75%)',
          }}
        />

        {/* Orb 4: Bottom-Left Base Glow */}
        <div
          className={`absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none ${
            reducedMotion ? '' : 'animate-orb-float-1'
          }`}
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(88, 28, 135, 0.18) 0%, rgba(124, 58, 237, 0.06) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(147, 51, 234, 0.06) 0%, rgba(124, 58, 237, 0.02) 50%, transparent 75%)',
          }}
        />
      </div>

      {/* LAYER 3: Subtle Particle Canvas Layer */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
        style={{
          transform: `translate3d(0, ${particleParallaxOffset}px, 0)`,
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* LAYER 4: Soft Vignette Overlay to maintain 100% text contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            theme === 'dark'
              ? 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(5, 5, 5, 0.5) 100%)'
              : 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(250, 250, 252, 0.4) 100%)',
        }}
      />
    </div>
  );
};
