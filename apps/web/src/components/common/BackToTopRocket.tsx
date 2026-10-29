import React, { useEffect, useState } from 'react';
import FlyingButton from './FlyingButton.js';

export function BackToTopRocket() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sync with html[data-theme]
    const updateTheme = () => {
      const current = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark';
      setTheme(current);
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Reveal when scrolled down past 40px or near bottom
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      const isScrolled = scrollY > 40 || (scrollY + windowHeight >= docHeight - 400);
      setIsVisible(isScrolled);
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
      aria-label="Back to top ascent rocket"
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '440px',
        height: '420px',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.94)',
        transition: 'opacity 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <FlyingButton
          align="right"
          theme={theme}
          size="medium"
          altitude={170}
          hoverTime={2.4}
          jets={2}
          thrusters={true}
          trigger="hover"
          carryCursor={true}
          smoke={1}
          turbulence={1}
          wobble={1}
          ramp={false}
          thrustColor={isDark ? '#8ec5ff' : '#4f8cff'}
          smokeColor={isDark ? '#eef1f6' : '#e9ebf0'}
          buttonColor={isDark ? '#27272a' : '#18181b'}
          textColor={isDark ? '#f5f5f5' : '#fafafa'}
          onClick={handleAscent}
        >
          Take off
        </FlyingButton>
      </div>
    </aside>
  );
}
