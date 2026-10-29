import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useToastStore } from '../../stores/toastStore.js';
import { NetworkIcon } from '../common/NetworkIcon.js';
import { animateElasticPill } from '../../lib/elasticPill.js';
import { initMagnetic } from '../../lib/magnetic.js';
import { animatePageEntrance, initContinuousIconFloat } from '../../lib/entrance.js';
import { BackToTopRocket } from '../common/BackToTopRocket.js';

const getBrandMonogram = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const NETWORKS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'x', name: 'X' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'threads', name: 'Threads' },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, workspace, role, brands, logout, selectedBrandId, setSelectedBrandId } = useAuthStore();
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTodayQueueOpen, setIsTodayQueueOpen] = useState(false);
  const clockBtnRef = React.useRef<HTMLButtonElement>(null);
  const todayPopRef = React.useRef<HTMLDivElement>(null);

  // Quick Create Menu state
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createBtnRef = React.useRef<HTMLButtonElement>(null);
  const createPopRef = React.useRef<HTMLDivElement>(null);

  // Connect Channel Modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectNet, setConnectNet] = useState('instagram');
  const [connectBrandId, setConnectBrandId] = useState(brands[0]?.id || 'b_eo');

  // Invite Teammate Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteBrand, setInviteBrand] = useState('all');

  const addToast = useToastStore((s) => s.addToast);

  const todayDateFormatted = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isTodayQueueOpen &&
        todayPopRef.current &&
        !todayPopRef.current.contains(target) &&
        clockBtnRef.current &&
        !clockBtnRef.current.contains(target)
      ) {
        setIsTodayQueueOpen(false);
      }
      if (
        isCreateMenuOpen &&
        createPopRef.current &&
        !createPopRef.current.contains(target) &&
        createBtnRef.current &&
        !createBtnRef.current.contains(target)
      ) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTodayQueueOpen, isCreateMenuOpen]);

  React.useEffect(() => {
    setIsTodayQueueOpen(false);
    setIsCreateMenuOpen(false);
  }, [location.pathname]);

  // Global keyboard shortcuts (N for quick create, Esc to close)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsCreateMenuOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCreateMenuOpen(false);
        setIsTodayQueueOpen(false);
        setShowConnectModal(false);
        setShowInviteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', next);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Open Command Palette event
  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  const currentPath = location.pathname;
  const currentView = currentPath.split('/')[1] || 'overview';

  const selectedBrand = brands.find(
    (b) => b.id === selectedBrandId || (selectedBrandId !== 'all' && (b.id.toLowerCase() === selectedBrandId.toLowerCase() || b.name.toLowerCase() === selectedBrandId.toLowerCase()))
  );

  const tabsTrackRef = React.useRef<HTMLDivElement>(null);
  const tabsPillRef = React.useRef<HTMLSpanElement>(null);
  const mainRef = React.useRef<HTMLElement>(null);

  // Sync Elastic Tab Pill, Magnetic Physics, and Entrance on route change
  React.useEffect(() => {
    const track = tabsTrackRef.current;
    const pill = tabsPillRef.current;
    if (track && pill) {
      const activeTab = track.querySelector<HTMLElement>('.tab[aria-current="page"]');
      animateElasticPill(pill, track, activeTab, true);
    }

    const triggerAnimations = () => {
      if (mainRef.current) {
        animatePageEntrance(mainRef.current);
      }
      initMagnetic(document);
      initContinuousIconFloat(document);
    };

    // Staggered page entrance animation for the current view with deliberate delay
    const timer = setTimeout(triggerAnimations, 100);

    const handleResize = () => {
      if (track && pill) {
        const currentActive = track.querySelector<HTMLElement>('.tab[aria-current="page"]');
        animateElasticPill(pill, track, currentActive, false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [currentPath]);

  return (
    <div className="app">
      {/* Top Header */}
      <header className="top">
        <NavLink to="/overview" className="brand" aria-label="Murmura — overview">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 15.5c2.2-3.6 4.4-3.6 6.6 0s4.4 3.6 6.6 0" />
              <path d="M6.5 10c1.6-2.4 3.2-2.4 4.8 0s3.2 2.4 4.8 0" />
              <circle cx="19.2" cy="8.2" r="1.3" />
            </svg>
          </span>
          <span className="brand__name">murmura</span>
        </NavLink>

        {/* Primary Tabs with Elastic Ink Pill */}
        <nav className="tabs" aria-label="Main">
          <div className="tabs__track" ref={tabsTrackRef}>
            <NavLink
              to="/overview"
              className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
              aria-current={currentView === 'overview' ? 'page' : undefined}
            >
              Overview
            </NavLink>
            <NavLink
              to="/compose"
              className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
              aria-current={currentView === 'compose' ? 'page' : undefined}
            >
              Compose
            </NavLink>
            <NavLink
              to="/calendar"
              className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
              aria-current={currentView === 'calendar' ? 'page' : undefined}
            >
              Calendar
            </NavLink>
            <NavLink
              to="/inbox"
              className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
              aria-current={currentView === 'inbox' ? 'page' : undefined}
            >
              Inbox <span className="tab-count">3</span>
            </NavLink>
            <NavLink
              to="/approvals"
              className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
              aria-current={currentView === 'approvals' ? 'page' : undefined}
            >
              Approvals <span className="tab-count">4</span>
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
              aria-current={currentView === 'analytics' ? 'page' : undefined}
            >
              Analytics
            </NavLink>
            <NavLink
              to="/listening"
              className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
              aria-current={currentView === 'listening' ? 'page' : undefined}
            >
              Listening
            </NavLink>

            {/* Elastic Ink Pill overlay layer */}
            <span className="tabs__pill" aria-hidden="true" ref={tabsPillRef}>
              <span>Overview</span>
              <span>Compose</span>
              <span>Calendar</span>
              <span>Inbox <span className="tab-count">3</span></span>
              <span>Approvals <span className="tab-count">4</span></span>
              <span>Analytics</span>
              <span>Listening</span>
            </span>
          </div>
        </nav>

        {/* Top Tools: Search, Brand Switcher, Bell, Me */}
        <div className="top__tools">
          <button
            type="button"
            className="ibtn ibtn--glass top__search"
            onClick={openSearch}
            aria-label="Search"
            title="Search (⌘K)"
          >
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </button>

          {/* Brand Switcher */}
          <div className="relative">
            <button
              id="btn-brand"
              type="button"
              className="bswitch magnetic"
              onClick={() => setIsBrandMenuOpen(!isBrandMenuOpen)}
              aria-label={`Brand: ${selectedBrand ? selectedBrand.name : 'all brands'}`}
            >
              {selectedBrand ? (
                <span
                  className="bmark bmark--xs"
                  style={{
                    background: selectedBrand.color,
                    color: selectedBrand.name.toLowerCase().includes('hollow') ? '#1c1b18' : '#fff',
                    fontWeight: 700,
                  }}
                >
                  {getBrandMonogram(selectedBrand.name)}
                </span>
              ) : (
                <span className="bswitch__all">
                  <svg className="ico" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                  </svg>
                </span>
              )}
              <span className="bswitch__name">{selectedBrand ? selectedBrand.name : 'All brands'}</span>
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9.5 6 6 6-6" />
              </svg>
            </button>

            {isBrandMenuOpen && (
              <div
                className="pop pop--wide"
                style={{ top: '54px', right: 0, zIndex: 70 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pop__head">
                  <span className="pop__title">Switch Brand</span>
                </div>
                <div className="pop__list">
                  <button
                    type="button"
                    className="menu__item"
                    onClick={() => {
                      setSelectedBrandId('all');
                      setIsBrandMenuOpen(false);
                    }}
                  >
                    <span className="bswitch__all" style={{ width: 28, height: 28 }}>
                      <svg className="ico" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                        <rect x="3" y="3" width="7" height="7" rx="2" />
                        <rect x="14" y="3" width="7" height="7" rx="2" />
                        <rect x="3" y="14" width="7" height="7" rx="2" />
                        <rect x="14" y="14" width="7" height="7" rx="2" />
                      </svg>
                    </span>
                    <span>All Brands</span>
                  </button>
                  <hr />
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="menu__item"
                      onClick={() => {
                        setSelectedBrandId(b.id);
                        setIsBrandMenuOpen(false);
                      }}
                    >
                      <span
                        className="bmark bmark--xs"
                        style={{
                          background: b.color,
                          color: b.name.toLowerCase().includes('hollow') ? '#1c1b18' : '#fff',
                          fontWeight: 700,
                        }}
                      >
                        {getBrandMonogram(b.name)}
                      </span>
                      <span>{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            id="btn-bell"
            type="button"
            className="ibtn ibtn--glass magnetic"
            aria-label="Notifications"
            title="Notifications"
            onClick={openSearch}
          >
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
              <path d="M10 20.5a2 2 0 0 0 4 0" />
            </svg>
          </button>

          {/* Profile / Account Menu */}
          <div className="relative">
            <button
              id="btn-me"
              type="button"
              className="me magnetic"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="Account menu"
            >
              <div className="av av--md av--t1">
                {user?.name
                  ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  : 'VA'}
              </div>
              <div className="me__text">
                <b>{user?.name || 'Devon Miles'}</b>
                <small>{role || 'Owner'}</small>
              </div>
            </button>

            {isUserMenuOpen && (
              <div
                className="pop"
                style={{ top: '54px', right: 0, zIndex: 70, minWidth: '220px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pop__head">
                  <span className="pop__title">{user?.name}</span>
                </div>
                <div className="pop__list">
                  <NavLink
                    to="/team"
                    className="menu__item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <span>Team & Roles</span>
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="menu__item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <span>Settings</span>
                  </NavLink>
                  <hr />
                  <button
                    type="button"
                    className="menu__item is-danger"
                    onClick={handleLogout}
                  >
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Vertical Dock */}
      <nav className="dock" aria-label="Quick actions">
        <button
          type="button"
          className="dock__btn"
          onClick={openSearch}
          aria-label="Search (⌘K)"
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <span className="dock__tip">
            Search <kbd>⌘K</kbd>
          </span>
        </button>

        <button
          ref={createBtnRef}
          type="button"
          className={`dock__btn dock__btn--new ${isCreateMenuOpen ? 'is-active' : ''}`}
          onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
          aria-label="Create"
          aria-expanded={isCreateMenuOpen}
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span
            className="dock__tip"
            style={isCreateMenuOpen ? { display: 'none', opacity: 0 } : undefined}
          >
            Create <kbd>N</kbd>
          </span>
        </button>

        <button
          ref={clockBtnRef}
          type="button"
          className={`dock__btn ${isTodayQueueOpen ? 'is-active' : ''}`}
          onClick={() => setIsTodayQueueOpen(!isTodayQueueOpen)}
          aria-label="Today’s queue"
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </svg>
          <span className="dock__tip">Today’s queue</span>
        </button>

        <NavLink
          to="/library"
          className={({ isActive }) => `dock__btn ${isActive ? 'is-active' : ''}`}
          aria-label="Library"
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <circle cx="9" cy="9.5" r="1.8" />
            <path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" />
          </svg>
          <span className="dock__tip">Library</span>
        </NavLink>

        <span className="dock__sep" aria-hidden="true" />

        <NavLink
          to="/channels"
          className={({ isActive }) => `dock__btn ${isActive ? 'is-active' : ''}`}
          aria-label="Channels"
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </svg>
          <span className="dock__tip">Channels</span>
        </NavLink>

        <NavLink
          to="/team"
          className={({ isActive }) => `dock__btn ${isActive ? 'is-active' : ''}`}
          aria-label="Team & roles"
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.5 5 6v5.5c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6z" />
            <path d="m9 12 2.2 2.2L15.5 10" />
          </svg>
          <span className="dock__tip">Team & roles</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `dock__btn ${isActive ? 'is-active' : ''}`}
          aria-label="Settings"
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2.8l2 2.1 2.9-.4.7 2.8 2.6 1.4-1 2.8 1 2.8-2.6 1.4-.7 2.8-2.9-.4-2 2.1-2-2.1-2.9.4-.7-2.8-2.6-1.4 1-2.8-1-2.8 2.6-1.4.7-2.8 2.9.4Z" />
          </svg>
          <span className="dock__tip">Settings</span>
        </NavLink>

        <button
          type="button"
          className="dock__btn dock__theme"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <svg className="ico ico--moon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
          </svg>
          <svg className="ico ico--sun" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
          </svg>
          <span className="dock__tip">Theme</span>
        </button>
      </nav>

      {/* Quick Create Popover */}
      {isCreateMenuOpen && (
        <div
          ref={createPopRef}
          className="pop"
          style={{
            position: 'fixed',
            left: 'calc(var(--dock-x, 18px) + var(--dock-w, 68px) + 12px)',
            top: createBtnRef.current
              ? `${Math.max(16, createBtnRef.current.getBoundingClientRect().top - 8)}px`
              : '120px',
            zIndex: 90,
            width: '260px',
            borderRadius: '20px',
            background: 'var(--float, #ffffff)',
            border: '1px solid var(--line, rgba(22, 26, 30, 0.12))',
            boxShadow: '0 24px 60px -18px rgba(20, 24, 28, 0.35), 0 2px 6px rgba(20, 24, 28, 0.08)',
            padding: '6px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="menu__item"
            onClick={() => {
              setIsCreateMenuOpen(false);
              navigate('/compose');
            }}
          >
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            <span>New post</span>
          </button>
          <button
            type="button"
            className="menu__item"
            onClick={() => {
              setIsCreateMenuOpen(false);
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              navigate('/compose', { state: { scheduledAt: tomorrow.getTime() } });
            }}
          >
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="12" y1="14" x2="12" y2="18" />
              <line x1="10" y1="16" x2="14" y2="16" />
            </svg>
            <span>Schedule for tomorrow 9:00</span>
          </button>
          <hr
            style={{
              background: 'var(--line, rgba(22, 26, 30, 0.12))',
              border: 0,
              height: '1px',
              margin: '4px 6px',
            }}
          />
          <button
            type="button"
            className="menu__item"
            onClick={() => {
              setIsCreateMenuOpen(false);
              setShowConnectModal(true);
            }}
          >
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Connect a channel</span>
          </button>
          <button
            type="button"
            className="menu__item"
            onClick={() => {
              setIsCreateMenuOpen(false);
              setShowInviteModal(true);
            }}
          >
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <span>Invite a teammate</span>
          </button>
        </div>
      )}

      {/* Today's Queue Popover */}
      {isTodayQueueOpen && (
        <div
          ref={todayPopRef}
          className="pop pop--wide"
          style={{
            position: 'fixed',
            left: 'calc(var(--dock-x, 18px) + var(--dock-w, 68px) + 12px)',
            top: clockBtnRef.current
              ? `${Math.max(16, clockBtnRef.current.getBoundingClientRect().top - 36)}px`
              : '200px',
            zIndex: 90,
            width: 'min(380px, calc(100vw - 110px))',
            borderRadius: '24px',
            background: 'var(--float, #ffffff)',
            border: '1px solid var(--line, rgba(22, 26, 30, 0.12))',
            boxShadow: '0 24px 60px -18px rgba(20, 24, 28, 0.35), 0 2px 6px rgba(20, 24, 28, 0.08)',
            padding: '22px 24px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '28px',
            }}
          >
            <span
              style={{
                fontSize: '19px',
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: 'var(--text, #16191d)',
              }}
            >
              Today
            </span>
            <span
              style={{
                fontSize: '13.5px',
                color: 'var(--muted, #5b6064)',
                fontWeight: 500,
              }}
            >
              {todayDateFormatted}
            </span>
          </div>

          <div
            style={{
              textAlign: 'center',
              padding: '36px 12px 42px',
              color: 'var(--muted, #5b6064)',
              fontSize: '15.5px',
              fontWeight: 500,
            }}
          >
            Nothing goes out today.
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '6px',
            }}
          >
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => {
                setIsTodayQueueOpen(false);
                navigate('/calendar');
              }}
              style={{
                borderRadius: '999px',
                padding: '0 18px',
                fontWeight: 600,
                fontSize: '13.5px',
                border: '1px solid var(--line-2, rgba(22, 26, 30, 0.16))',
                background: 'transparent',
                color: 'var(--text, #16191d)',
                height: '40px',
                cursor: 'pointer',
              }}
            >
              Open calendar
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ink"
              onClick={() => {
                setIsTodayQueueOpen(false);
                navigate('/compose');
              }}
              style={{
                borderRadius: '999px',
                padding: '0 20px',
                fontWeight: 600,
                fontSize: '13.5px',
                background: 'var(--pill, #16191d)',
                color: 'var(--on-pill, #ffffff)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '40px',
                cursor: 'pointer',
              }}
            >
              <svg className="ico" viewBox="0 0 24 24" style={{ width: 15, height: 15, strokeWidth: 2.2 }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>New post</span>
            </button>
          </div>
        </div>
      )}

      {/* Connect a Channel Modal (matching Screenshot 2) */}
      {showConnectModal && (
        <div
          className="scrim"
          style={{
            opacity: 1,
            visibility: 'visible',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            zIndex: 100,
            background: 'rgba(16, 18, 20, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="modal"
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--float, #fdfdfb)',
              borderRadius: '26px',
              border: '1px solid var(--rim, var(--line, rgba(22, 26, 30, 0.15)))',
              boxShadow: 'var(--shadow-pop)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form
              className="mform"
              onSubmit={(e) => {
                e.preventDefault();
                const targetBrand = brands.find((b) => b.id === connectBrandId) || brands[0];
                const netName = NETWORKS.find((n) => n.id === connectNet)?.name || 'Account';
                addToast({
                  type: 'success',
                  message: `${targetBrand?.name || 'Brand'} · ${netName} connected`,
                });
                setShowConnectModal(false);
              }}
            >
              <div className="mform__head">
                <div>
                  <h3 className="mform__title">Connect a channel</h3>
                  <p className="mform__sub">
                    You’ll sign in to the network and choose which account Murmura may post to.
                  </p>
                </div>
                <button
                  type="button"
                  className="ibtn ibtn--sm"
                  onClick={() => setShowConnectModal(false)}
                  aria-label="Close"
                >
                  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="cc-nets" role="radiogroup" aria-label="Network">
                {NETWORKS.map((n) => {
                  const isSelected = connectNet === n.id;
                  return (
                    <label
                      key={n.id}
                      className="cc-net"
                      style={{
                        border: isSelected
                          ? '2px solid var(--text, #16191d)'
                          : '1.5px solid var(--line, rgba(22, 26, 30, 0.12))',
                        background: isSelected
                          ? 'var(--glass-3, rgba(255,255,255,0.85))'
                          : 'var(--glass-2, rgba(255,255,255,0.7))',
                        borderRadius: '18px',
                        cursor: 'pointer',
                        display: 'grid',
                        justifyItems: 'center',
                        gap: '8px',
                        padding: '16px 8px 14px',
                      }}
                    >
                      <input
                        type="radio"
                        name="net"
                        value={n.id}
                        checked={isSelected}
                        onChange={() => setConnectNet(n.id)}
                        style={{ position: 'absolute', opacity: 0 }}
                      />
                      <span className={`net net--md net--${n.id}`}>
                        <NetworkIcon network={n.id} className="ico" />
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                        {n.name}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="field field--wide" style={{ marginTop: '20px' }}>
                <span className="field__label">For brand</span>
                <select
                  className="input"
                  value={connectBrandId}
                  onChange={(e) => setConnectBrandId(e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mform__foot" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setShowConnectModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--ink">
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite a Teammate Modal (matching Screenshot 3) */}
      {showInviteModal && (
        <div
          className="scrim"
          style={{
            opacity: 1,
            visibility: 'visible',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            zIndex: 100,
            background: 'rgba(16, 18, 20, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="modal"
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--float, #fdfdfb)',
              borderRadius: '26px',
              border: '1px solid var(--rim, var(--line, rgba(22, 26, 30, 0.15)))',
              boxShadow: 'var(--shadow-pop)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form
              className="mform"
              onSubmit={(e) => {
                e.preventDefault();
                if (!inviteEmail.trim()) return;
                addToast({
                  type: 'success',
                  message: `Invite sent to ${inviteEmail.trim()}`,
                });
                setShowInviteModal(false);
                setInviteName('');
                setInviteEmail('');
              }}
            >
              <div className="mform__head">
                <div>
                  <h3 className="mform__title">Invite a teammate</h3>
                  <p className="mform__sub">
                    They get an email with a link to join {workspace?.name || 'Northlight Studio'}.
                  </p>
                </div>
                <button
                  type="button"
                  className="ibtn ibtn--sm"
                  onClick={() => setShowInviteModal(false)}
                  aria-label="Close"
                >
                  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="mform__grid">
                <label className="field">
                  <span className="field__label">Full name</span>
                  <input
                    type="text"
                    placeholder="Jordan Blake"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                    autoFocus
                  />
                </label>
                <label className="field">
                  <span className="field__label">Work email</span>
                  <input
                    type="email"
                    placeholder="jordan@northlight.studio"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="field field--wide">
                  <span className="field__label">Role</span>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="contributor">Contributor</option>
                  </select>
                  <span className="field__hint">
                    You can change this, or the role itself, any time on the Team page.
                  </span>
                </label>
                <label className="field field--wide">
                  <span className="field__label">Brands</span>
                  <select
                    value={inviteBrand}
                    onChange={(e) => setInviteBrand(e.target.value)}
                  >
                    <option value="all">All brands</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} only
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mform__foot" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--ink">
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <main id="main" className="main" ref={mainRef}>
        <section key={location.pathname} className="view" data-view={currentView}>
          <Outlet context={{ selectedBrandId, setSelectedBrandId }} />
        </section>
      </main>

      {/* Fixed bottom-right back to top ascent button */}
      <BackToTopRocket />
    </div>
  );
}
