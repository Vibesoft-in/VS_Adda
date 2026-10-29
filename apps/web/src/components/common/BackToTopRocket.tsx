import React, { useEffect, useState } from 'react';
import FlyingButton from './FlyingButton.js';

export function BackToTopRocket() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    // Sync with html[data-theme]
    const updateTheme = () => {
      const current = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
      setTheme(current);
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Track scroll proximity to bottom
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // Visible when user has scrolled down significantly and is within 1000px of bottom
      const reachedNearBottom = scrollY > 200 && (scrollY + windowHeight >= docHeight - 950);
      setIsNearBottom(reachedNearBottom);
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
      lenis.scrollTo(0, { duration: 1.9 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isDark = theme === 'dark';

  return (
    <aside
      className="back-to-top-launcher"
      aria-label="Back to top ascent launcher"
      style={{
        margin: '48px 0 24px',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: isNearBottom ? 1 : 0.85,
        transform: isNearBottom ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {/* Launchpad Mission Badge & Glass Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '840px',
          borderRadius: '32px',
          padding: '28px 24px 16px',
          background: isDark
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.2) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.65)',
          boxShadow: isDark
            ? '0 24px 48px -20px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 24px 48px -20px rgba(22, 26, 30, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '120px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(ellipse, rgba(142, 197, 255, 0.22), transparent 70%)'
              : 'radial-gradient(ellipse, rgba(59, 130, 246, 0.18), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Mission Status Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '8px', zIndex: 2 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(22, 25, 29, 0.06)',
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(22, 25, 29, 0.75)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.7)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            End of Stream • Ready to Ascend
          </span>
          <h3
            style={{
              fontSize: '19px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '4px 0 0',
              color: 'var(--text)',
            }}
          >
            Lift off back to top
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--muted)',
              maxWidth: '360px',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Click or interact with the thrusters to blast smoothly back to the top of your feed.
          </p>
        </div>

        {/* WebGL Flight Arena */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '320px',
            maxWidth: '720px',
            marginTop: '-10px',
          }}
        >
          <FlyingButton
            theme={theme}
            size="medium"
            altitude={180}
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
      </div>
    </aside>
  );
}
