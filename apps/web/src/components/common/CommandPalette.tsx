import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { NetworkIcon } from './NetworkIcon.js';
import {
  Search,
  LayoutDashboard,
  PenSquare,
  Calendar,
  MessageSquare,
  CheckCircle2,
  BarChart3,
  Radio,
  Share2,
  FolderOpen,
  Users,
  Settings,
  Moon,
  Sun,
  LogOut,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  // Keyboard shortcut listener: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['command-search', query],
    queryFn: async () => {
      if (!query.trim()) return null;
      return apiFetch<any>(`/search?q=${encodeURIComponent(query.trim())}`);
    },
    enabled: isOpen && query.trim().length > 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const staticNavigations = [
    { label: 'Overview Dashboard', path: '/overview', icon: LayoutDashboard, shortcut: 'G O' },
    { label: 'Compose Post', path: '/compose', icon: PenSquare, shortcut: 'N' },
    { label: 'Publishing Calendar', path: '/calendar', icon: Calendar, shortcut: 'G C' },
    { label: 'Community Inbox', path: '/inbox', icon: MessageSquare, shortcut: 'G I' },
    { label: 'Approval Queue', path: '/approvals', icon: CheckCircle2, shortcut: 'G A' },
    { label: 'Analytics & Benchmarks', path: '/analytics', icon: BarChart3, shortcut: 'G N' },
    { label: 'Brand & Social Listening', path: '/listening', icon: Radio, shortcut: 'G L' },
    { label: 'Social Channels', path: '/channels', icon: Share2, shortcut: 'G S' },
    { label: 'Content Library', path: '/library', icon: FolderOpen, shortcut: 'G M' },
    { label: 'Team & RBAC Matrix', path: '/team', icon: Users, shortcut: 'G T' },
    { label: 'Workspace Settings', path: '/settings', icon: Settings, shortcut: 'G ,' },
  ];

  const filteredNav = staticNavigations.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = useMemo(() => {
    const list: Array<{ id: string; label: string; action: () => void }> = [];
    filteredNav.forEach((item) => {
      list.push({ id: item.path, label: item.label, action: () => navigate(item.path) });
    });
    if (searchResults?.posts) {
      searchResults.posts.forEach((post: any) => {
        list.push({ id: `post-${post.id}`, label: post.caption, action: () => navigate(`/compose/${post.id}`) });
      });
    }
    if (searchResults?.conversations) {
      searchResults.conversations.forEach((convo: any) => {
        list.push({ id: `convo-${convo.id}`, label: convo.authorName, action: () => navigate(`/inbox/${convo.id}`) });
      });
    }
    list.push({ id: 'action-theme', label: 'Toggle Dark / Light Theme', action: () => toggleTheme() });
    list.push({ id: 'action-logout', label: 'Log Out', action: () => logout() });
    return list;
  }, [filteredNav, searchResults, navigate, logout]);

  // Arrow key navigation listener
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleNav = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex].action);
        }
      }
    };
    window.addEventListener('keydown', handleNav);
    return () => window.removeEventListener('keydown', handleNav);
  }, [isOpen, selectedIndex, allItems]);

  const handleSelect = (action: () => void) => {
    action();
    setIsOpen(false);
    setQuery('');
  };

  const toggleTheme = () => {
    const isDark =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-4 transition-all duration-200"
      style={{
        backgroundColor: 'rgba(9, 10, 12, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[600px] border shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--float, #fdfdfb)',
          color: 'var(--text, #16191d)',
          borderColor: 'var(--line-2, rgba(255,255,255,0.12))',
          borderRadius: '24px',
          boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 32px 80px -20px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          className="p-4 px-5 flex items-center space-x-3.5"
          style={{
            backgroundColor: 'var(--solid, #f6f7f4)',
            borderBottom: '1px solid var(--line, rgba(22,25,29,0.1))',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--well)] shrink-0">
            <Search className="w-4 h-4" style={{ color: 'var(--text, #16191d)' }} />
          </div>
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search posts, inbox, team, analytics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium tracking-tight focus:outline-none placeholder:text-[var(--muted)]"
            style={{
              color: 'var(--text, #16191d)',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono rounded-md bg-[var(--well)] text-[var(--muted)] border border-[var(--line)]">
              ↑↓ Navigate
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono rounded-md bg-[var(--well)] text-[var(--muted)] border border-[var(--line)]">
              ↵ Select
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono cursor-pointer rounded-md transition-opacity hover:opacity-80 bg-[var(--well)] text-[var(--muted)] border border-[var(--line)]"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Results List */}
        <div
          className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-[var(--line)]"
          style={{
            backgroundColor: 'var(--float, #fdfdfb)',
          }}
        >
          {/* Quick Actions / Navigation */}
          {filteredNav.length > 0 && (
            <div className="space-y-1 pt-1 first:pt-0">
              <div
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1"
                style={{ color: 'var(--muted, #5b6064)' }}
              >
                Navigation
              </div>
              {filteredNav.slice(0, 8).map((item, idx) => {
                const Icon = item.icon;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(() => navigate(item.path))}
                    className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl text-xs transition-all group cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[var(--well)] ring-1 ring-[var(--line-2)] font-bold'
                        : 'hover:bg-[var(--well)]'
                    }`}
                    style={{
                      color: 'var(--text, #16191d)',
                    }}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500/15 text-amber-500' : 'bg-[var(--solid)] text-[var(--muted)] group-hover:text-[var(--text)]'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.shortcut && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--solid)] border border-[var(--line)] text-[var(--muted)]">
                          {item.shortcut}
                        </span>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 text-[var(--muted)] transition-opacity ${isSelected ? 'opacity-100 translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Results: Posts */}
          {searchResults?.posts?.length > 0 && (
            <div className="space-y-1 pt-2">
              <div
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1"
                style={{ color: 'var(--muted, #5b6064)' }}
              >
                Posts ({searchResults.posts.length})
              </div>
              {searchResults.posts.map((post: any) => (
                <button
                  key={post.id}
                  onClick={() => handleSelect(() => navigate(`/compose/${post.id}`))}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors group text-left cursor-pointer hover:bg-[var(--well)]"
                  style={{ color: 'var(--text, #16191d)' }}
                >
                  <div className="flex items-center space-x-2.5 truncate mr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: post.brandColor || '#4F46E5' }}
                    />
                    <span className="truncate font-medium">{post.caption}</span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0"
                    style={{
                      backgroundColor: 'var(--solid, #f6f7f4)',
                      border: '1px solid var(--line, rgba(22,25,29,0.1))',
                      color: 'var(--muted, #5b6064)',
                    }}
                  >
                    {post.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results: Conversations */}
          {searchResults?.conversations?.length > 0 && (
            <div className="space-y-1 pt-2">
              <div
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1"
                style={{ color: 'var(--muted, #5b6064)' }}
              >
                Inbox Conversations ({searchResults.conversations.length})
              </div>
              {searchResults.conversations.map((convo: any) => (
                <button
                  key={convo.id}
                  onClick={() => handleSelect(() => navigate(`/inbox/${convo.id}`))}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors group text-left cursor-pointer hover:bg-[var(--well)]"
                  style={{ color: 'var(--text, #16191d)' }}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-semibold">{convo.authorName}</span>
                    <span style={{ color: 'var(--muted, #5b6064)' }}>on @{convo.channelHandle}</span>
                  </div>
                  <NetworkIcon network={convo.network} className="w-3.5 h-3.5 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}

          {/* Search Results: Channels */}
          {searchResults?.channels?.length > 0 && (
            <div className="space-y-1 pt-2">
              <div
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1"
                style={{ color: 'var(--muted, #5b6064)' }}
              >
                Channels ({searchResults.channels.length})
              </div>
              {searchResults.channels.map((ch: any) => (
                <button
                  key={ch.id}
                  onClick={() => handleSelect(() => navigate('/channels'))}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors group cursor-pointer hover:bg-[var(--well)]"
                  style={{ color: 'var(--text, #16191d)' }}
                >
                  <div className="flex items-center space-x-2">
                    <NetworkIcon network={ch.network} className="w-4 h-4" />
                    <span className="font-semibold">@{ch.handle}</span>
                    <span style={{ color: 'var(--muted, #5b6064)' }}>({ch.brandName})</span>
                  </div>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: 'var(--pine, #11745a)' }}
                  >
                    Open
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Tools */}
          <div className="space-y-1 pt-2">
            <div
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1"
              style={{ color: 'var(--muted, #5b6064)' }}
            >
              Quick Actions
            </div>
            <button
              onClick={() => handleSelect(toggleTheme)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer hover:bg-[var(--well)]"
              style={{ color: 'var(--text, #16191d)' }}
            >
              <div className="flex items-center space-x-2.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">Toggle Dark / Light Theme</span>
              </div>
            </button>
            <button
              onClick={() => handleSelect(logout)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer hover:bg-rose-500/10"
              style={{ color: 'var(--bad, #b8382c)' }}
            >
              <div className="flex items-center space-x-2.5">
                <LogOut className="w-4 h-4" />
                <span className="font-semibold">Log Out</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-3 flex items-center justify-between text-xs"
          style={{
            backgroundColor: 'var(--solid, #f6f7f4)',
            borderTop: '1px solid var(--line, rgba(22,25,29,0.1))',
            color: 'var(--muted, #5b6064)',
          }}
        >
          <span>Navigate with mouse or keyboard</span>
          <span>
            Tip: Press{' '}
            <kbd
              style={{
                background: 'var(--float, #fdfdfb)',
                border: '1px solid var(--line, rgba(22,25,29,0.15))',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '10px',
              }}
            >
              Ctrl+K
            </kbd>{' '}
            anytime
          </span>
        </div>
      </div>
    </div>
  );
}
