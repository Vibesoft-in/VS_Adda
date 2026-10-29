import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // High-performance physics-based Lerp momentum scrolling (Zero Jitter)
    // autoRaf: true synchronizes directly with the browser's display refresh rate (60Hz / 120Hz ProMotion)
    const lenis = new Lenis({
      lerp: 0.082,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      autoResize: true,
    });

    lenisRef.current = lenis;
    (window as any).__lenis = lenis;

    return () => {
      lenis.destroy();
      (window as any).__lenis = null;
      lenisRef.current = null;
    };
  }, []);

  // When changing pages/routes, reset scroll cleanly to top
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return <>{children}</>;
}
