import React, { useEffect, useState } from 'react';
import FlyingButton from './FlyingButton.js';

export function BackToTopRocket() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sync with html[data-theme]
    const updateTheme = () => {
      const current = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
      setTheme(current);
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Track scroll position to reveal the button when scrolled down
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // Show once user scrolls down past 150px
      setIsVisible(scrollY > 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAscent = () => {
    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.8 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isDark = theme === 'dark';

  return (
    <aside
      className="fixed-rocket-dock"
      aria-label="Back to top"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '20px',
        width: '200px',
        height: '240px',
        zIndex: 99,
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.92)',
        transition: 'opacity 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <FlyingButton
          theme={theme}
          size="medium"
          altitude={150}
          hoverTime={2.2}
          jets={2}
          thrusters={true}
          trigger="click"
          carryCursor={true}
          smoke={1.2}
          turbulence={1}
          wobble={1}
          ramp={false}
          thrustColor={isDark ? '#8ec5ff' : '#3b82f6'}
          smokeColor={isDark ? '#eef1f6' : '#cbd5e1'}
          buttonColor={isDark ? '#27272a' : '#18181b'}
          textColor={isDark ? '#f5f5f5' : '#ffffff'}
          onClick={handleAscent}
        >
          🚀 Take off to Top
        </FlyingButton>
      </div>
    </aside>
  );
}
