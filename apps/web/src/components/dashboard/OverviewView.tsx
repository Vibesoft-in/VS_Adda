import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useToastStore } from '../../stores/toastStore.js';
import { initMagnetic } from '../../lib/magnetic.js';
import { getActiveBrand } from '../../lib/brandHelper.js';

// SVG Icon Helper
function SvgIco({ name, className = 'ico' }: { name: string; className?: string }) {
  switch (name) {
    case 'users':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8.5" r="3.5" />
          <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
          <path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.8c1.8.6 3 2.2 3.5 4.7" />
        </svg>
      );
    case 'heart':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      );
    case 'pen':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 5.5 18.5 9.5M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 0l.4.4a2.1 2.1 0 0 1 0 3L8.6 18.8z" />
        </svg>
      );
    case 'clock':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    case 'arrow':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 17 17 7M8.5 7H17v8.5" />
        </svg>
      );
    case 'check':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      );
    case 'refresh':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
          <path d="M19.5 4.5v4h-4" />
        </svg>
      );
    case 'link':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        </svg>
      );
    case 'inbox':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 13.5 6.3 6a2 2 0 0 1 1.9-1.5h7.6A2 2 0 0 1 17.7 6l2.3 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20" />
        </svg>
      );
    case 'history':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" />
          <path d="M4.5 4.5V9H9M12 8v4l3 2" />
        </svg>
      );
    case 'alert':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4 2.8 19.5h18.4z" />
          <path d="M12 10v4.5M12 17h.01" />
        </svg>
      );
    case 'down':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9.5 6 6 6-6" />
        </svg>
      );
    case 'chevL':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14.5 6-6 6 6 6" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.6" />
          <path d="M16.6 7.4h.01" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13.5 20.5v-7h2.6l.4-3h-3V8.6c0-.9.3-1.6 1.6-1.6h1.6V4.4a20 20 0 0 0-2.3-.1c-2.4 0-3.9 1.4-3.9 4v2.2H8v3h2.5v7" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 4c.4 2.4 2 4 4.5 4.2" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
          <path d="M8 10.5v6M8 7.5v.01M11.5 16.5v-6M11.5 13c0-1.8 1-2.6 2.3-2.6s2.2.8 2.2 2.6v3.5" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.8" y="5.8" width="18.4" height="12.4" rx="4" />
          <path d="m10.3 9.3 4.7 2.7-4.7 2.7z" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M11.2 9.5c.8-1.6 4.3-1.5 4.3 1.3 0 2.3-1.4 3.6-2.8 3.6-1.1 0-1.6-.9-1.4-1.6M11.8 10.8 9.8 19.5" />
        </svg>
      );
    case 'threads':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16.5 9.2C16 6.3 14.3 4.8 12 4.8 8.6 4.8 6.8 7.7 6.8 12s1.8 7.2 5.4 7.2c2.6 0 4.7-1.5 4.7-3.9 0-3.8-6.2-4.3-6.2-1.4 0 1.4 1.3 2 2.4 1.9 2.3-.2 2.8-2.4 2.8-4.8" />
        </svg>
      );
    case 'x':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4.5h4l10 15h-4z" />
          <path d="M18.5 4.5 13.4 10.4M5.5 19.5l5.1-5.9" />
        </svg>
      );
    default:
      return null;
  }
}

// Upcoming Post Items
const COMING_UP_POSTS = [
  {
    id: 'c1',
    thumb: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&auto=format&fit=crop&q=80',
    title: 'Latte art Friday. Tag us in your...',
    when: 'Tomorrow · 9:30 AM',
    nets: ['instagram', 'tiktok'],
    status: 'scheduled',
    tone: 'sea',
    label: 'Scheduled',
  },
  {
    id: 'c2',
    thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    title: 'Rose petals, sun-dried on the r...',
    when: 'Tomorrow · 12:00 PM',
    nets: ['instagram', 'tiktok', 'pinterest'],
    status: 'scheduled',
    tone: 'sea',
    label: 'Scheduled',
  },
  {
    id: 'c3',
    thumb: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
    title: 'Autumn collection drops Thurs...',
    when: 'Tomorrow · 6:00 PM',
    nets: ['instagram', 'facebook', 'pinterest'],
    status: 'scheduled',
    tone: 'sea',
    label: 'Scheduled',
  },
  {
    id: 'c4',
    thumb: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80',
    title: 'Engine bay detail: steam, soft...',
    when: 'Tomorrow · 7:00 PM',
    nets: ['threads', 'x'],
    status: 'scheduled',
    tone: 'sea',
    label: 'Scheduled',
  },
  {
    id: 'c5',
    thumb: 'https://images.unsplash.com/photo-1608248597359-5776d6c66c72?w=200&auto=format&fit=crop&q=80',
    title: 'A three-step night routi...',
    when: 'Tomorrow · 8:00 PM',
    nets: ['instagram', 'tiktok'],
    status: 'pending',
    tone: 'butter',
    label: 'Awaiting approval',
  },
  {
    id: 'c6',
    thumb: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=200&auto=format&fit=crop&q=80',
    title: 'New in: the Ro side tabl...',
    when: 'Wed, Oct 28 · 10:00 AM',
    nets: ['threads', 'pinterest'],
    status: 'pending',
    tone: 'butter',
    label: 'Awaiting approval',
  },
];

// Needs You Tasks
const EMBER_OAK_TODOS = [
  {
    id: 'todo-1',
    brandId: 'ember',
    brandName: 'Ember & Oak',
    thumb: '/murmura/photos/murmura/posts/ember-shot-sm.jpg',
    fallbackThumb: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
    title: 'Pumpkin spice? Never heard of her. Our autumn menu ...',
    sub: 'Nia wants approval · Ember & Oak · Tomorrow 9:00 AM',
    hasApprovalButtons: true,
  },
  {
    id: 'todo-2',
    brandId: 'ember',
    brandName: 'Ember & Oak',
    thumb: '/murmura/photos/murmura/posts/ember-pour-sm.jpg',
    fallbackThumb: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=200&auto=format&fit=crop&q=80',
    title: 'Home brewing 101, part three: why your pour-over ta...',
    sub: 'Freya wants approval · Ember & Oak · Sat, Oct 31 6:00 PM',
    hasApprovalButtons: true,
  },
];

const HOLLOW_HOME_TODOS = [
  {
    id: 'todo-3',
    brandId: 'hollow',
    brandName: 'Hollow Home',
    thumb: '/murmura/photos/murmura/posts/hollow-detail-sm.jpg',
    fallbackThumb: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=200&auto=format&fit=crop&q=80',
    title: 'New in: the Ro side table in smoked oak. Same joine...',
    sub: 'Freya wants approval · Hollow Home · Fri, Oct 30 10:00 AM',
    hasApprovalButtons: true,
  },
  {
    id: 'todo-5',
    brandId: 'hollow',
    brandName: 'Hollow Home',
    title: 'Hollow Home · YouTube expires in 3 d',
    sub: 'Reconnect now so nothing stops going out.',
    actionLabel: 'Reconnect',
    isYouTubeReconnect: true,
  },
];

const VANTAGE_GARAGE_TODOS = [
  {
    id: 'todo-vg-1',
    brandId: 'vantage',
    brandName: 'Vantage Garage',
    thumb: '/murmura/photos/murmura/posts/vantage-night-sm.jpg',
    fallbackThumb: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=200&auto=format&fit=crop&q=80',
    title: 'Before → after. Full correction on a midnight-blue M4...',
    sub: 'Omar wants approval · Vantage Garage · Tomorrow 7:00 PM',
    hasApprovalButtons: true,
  },
  {
    id: 'todo-vg-2',
    brandId: 'vantage',
    brandName: 'Vantage Garage',
    isAlert: true,
    title: 'A Vantage Garage post failed',
    sub: 'Facebook disconnected the page — reconnect Vantage Garage to retry.',
    actionLabel: 'Retry',
  },
];

const WILDROOT_TODOS = [
  {
    id: 'todo-wb-1',
    brandId: 'wild',
    brandName: 'Wildroot Botanics',
    thumb: '/murmura/photos/murmura/posts/wild-dropper-sm.jpg',
    fallbackThumb: 'https://images.unsplash.com/photo-1608248597359-5776d6c66c72?w=200&auto=format&fit=crop&q=80',
    title: 'A three-step night routine for tired skin: cleanse...',
    sub: 'Nia wants approval · Wildroot Botanics · Tomorrow 8:00 PM',
    hasApprovalButtons: true,
  },
  {
    id: 'todo-wb-2',
    brandId: 'wild',
    brandName: 'Wildroot Botanics',
    thumb: '/murmura/photos/murmura/posts/wild-daisy-sm.jpg',
    fallbackThumb: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200&auto=format&fit=crop&q=80',
    title: 'Meet calendula: the quiet flower doing the heavy lif...',
    sub: 'Freya asked for changes · “Swap photo for dropper close-up...”',
    hasApprovalButtons: true,
  },
];

const NEEDS_YOU_TODOS = [
  ...EMBER_OAK_TODOS,
  ...HOLLOW_HOME_TODOS,
  ...VANTAGE_GARAGE_TODOS,
  ...WILDROOT_TODOS,
];

// Network Pulse Rows
const NETWORK_PULSE = [
  { net: 'tiktok', name: 'TikTok', followers: '306.6K', growth: '+7.0%', eng: '8.8%', scale: 1.0 },
  { net: 'instagram', name: 'Instagram', followers: '291.7K', growth: '+8.8%', eng: '7.8%', scale: 0.95 },
  { net: 'youtube', name: 'YouTube', followers: '148.5K', growth: '+19.3%', eng: '8.1%', scale: 0.5 },
  { net: 'pinterest', name: 'Pinterest', followers: '110.2K', growth: '+11.7%', eng: '6.8%', scale: 0.38 },
  { net: 'facebook', name: 'Facebook', followers: '74.5K', growth: '+8.7%', eng: '7.8%', scale: 0.25 },
  { net: 'x', name: 'X', followers: '19.6K', growth: '+9.5%', eng: '8.1%', scale: 0.1 },
  { net: 'threads', name: 'Threads', followers: '16.5K', growth: '+8.0%', eng: '6.8%', scale: 0.08 },
  { net: 'linkedin', name: 'LinkedIn', followers: '8.7K', growth: '+21.5%', eng: '8.0%', scale: 0.04 },
];

// Audit Activity Feed
const AUDIT_FEED = [
  {
    id: 'a1',
    initial: 'C',
    name: 'Camila',
    text: 'moved “The Oak blend is back for autumn — chocolate...” to Fri, Oct 30 · 6:15 PM',
    time: '2 h ago',
  },
  {
    id: 'a2',
    initial: 'C',
    name: 'Camila',
    text: 'resent Sara Whitfield’s invite',
    time: '6 h ago',
  },
  {
    id: 'a3',
    initial: 'C',
    name: 'Camila',
    text: 'changed the approval rule to “by role”',
    time: '6 h ago',
  },
  {
    id: 'a4',
    initial: 'C',
    name: 'Camila',
    text: 'changed the approval rule to “every post”',
    time: '6 h ago',
  },
  {
    id: 'a5',
    initial: 'C',
    name: 'Camila',
    text: 'changed the approval rule to “no approvals”',
    time: '6 h ago',
  },
  {
    id: 'a6',
    initial: 'C',
    name: 'Camila',
    text: 'changed the approval rule to “every post”',
    time: '6 h ago',
  },
  {
    id: 'a7',
    initial: 'E',
    name: 'Elise',
    text: 'approved “New harvest from Huila...” for Ember & Oak',
    time: '8 h ago',
  },
];

export function OverviewView() {
  const navigate = useNavigate();
  const { user, brands, selectedBrandId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const activeBrand = useMemo(() => {
    return getActiveBrand(selectedBrandId, brands);
  }, [brands, selectedBrandId]);

  const isHollowHome = !!activeBrand && activeBrand.name.toLowerCase().includes('hollow');
  const isStarlightBakery = !!activeBrand && (activeBrand.name.toLowerCase().includes('starlight') || activeBrand.name.toLowerCase().includes('bakery'));
  const isVantageGarage = !!activeBrand && (activeBrand.name.toLowerCase().includes('vantage') || activeBrand.name.toLowerCase().includes('garage'));
  const isWildroot = !!activeBrand && (activeBrand.name.toLowerCase().includes('wild') || activeBrand.name.toLowerCase().includes('botanics'));
  const isEmberAndOak = !activeBrand || activeBrand.name.toLowerCase().includes('ember') || activeBrand.name.toLowerCase().includes('oak');

  const [growthRange, setGrowthRange] = useState<'30' | '90'>('30');
  const [showAllTodos, setShowAllTodos] = useState(false);
  const [dismissedTodoIds, setDismissedTodoIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Time-of-day greeting (Morning, Afternoon, Evening)
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Morning';
    if (hr < 18) return 'Afternoon';
    return 'Evening';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Camila';

  useEffect(() => {
    initMagnetic(containerRef.current || document);
  }, []);

  const brandOverviewData = useMemo(() => {
    if (isHollowHome) {
      return {
        audience: '248.4K',
        audienceGrowth: '+11.6% in 30 days',
        engRate: '8.9%',
        postsThisWeek: 4,
        hero: {
          brandCode: 'HH',
          brandName: 'Hollow Home',
          tone: 'butter',
          status: 'Scheduled',
          badgeClass: 'badge--pine',
          inTime: '1 day 6 h',
          when: 'Tomorrow · 6:00 PM',
          text: 'Autumn collection drops Thursday at 10:00 CET. Join the list for first pick.',
          media: '/murmura/photos/murmura/posts/hollow-living.jpg',
          nets: ['instagram', 'pinterest', 'youtube'],
        },
        todos: HOLLOW_HOME_TODOS,
        comingUp: [
          {
            id: 'c1_hh',
            thumb: '/murmura/photos/murmura/posts/hollow-detail-sm.jpg',
            fallbackThumb: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=200&auto=format&fit=crop&q=80',
            title: 'New in: the Ro side tabl...',
            when: 'Fri, Oct 30 · 10:00 AM',
            nets: ['instagram', 'pinterest'],
            status: 'pending',
            tone: 'butter',
            label: 'Awaiting approval',
          },
          {
            id: 'c2_hh',
            thumb: '/murmura/photos/murmura/posts/hollow-chair-sm.jpg',
            fallbackThumb: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=200&auto=format&fit=crop&q=80',
            title: 'Solid oak, oiled by hand, built ...',
            when: 'Sat, Oct 31 · 7:00 PM',
            nets: ['instagram', 'pinterest'],
            status: 'scheduled',
            tone: 'sea',
            label: 'Scheduled',
          },
          {
            id: 'c3_hh',
            thumb: '/murmura/photos/murmura/posts/hollow-room-sm.jpg',
            fallbackThumb: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200&auto=format&fit=crop&q=80',
            title: 'A home tour from @signe.lives...',
            when: 'Sun, Nov 1 · 8:00 PM',
            nets: ['instagram'],
            status: 'scheduled',
            tone: 'sea',
            label: 'Scheduled',
          },
          {
            id: 'c4_hh',
            thumb: '/murmura/photos/murmura/posts/hollow-sofa-sm.jpg',
            fallbackThumb: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
            title: 'The Låg sofa, now in oat bouc...',
            when: 'Mon, Nov 2 · 6:00 PM',
            nets: ['instagram', 'facebook', 'youtube'],
            status: 'scheduled',
            tone: 'sea',
            label: 'Scheduled',
          },
        ],
      };
    } else if (isVantageGarage) {
      return {
        audience: '422.0K',
        audienceGrowth: '+8.2% in 30 days',
        engRate: '9.1%',
        postsThisWeek: 6,
        hero: {
          brandCode: 'VG',
          brandName: 'Vantage Garage',
          tone: 'ink',
          status: 'Scheduled',
          badgeClass: 'badge--pine',
          inTime: '1 day 3 h',
          when: 'Tomorrow · 7:00 PM',
          text: 'Before → after. Full correction on a midnight-blue M4, 26 hours in the bay.',
          media: '/murmura/photos/murmura/posts/vantage-night.jpg',
          nets: ['instagram', 'tiktok', 'youtube'],
        },
        todos: VANTAGE_GARAGE_TODOS,
        comingUp: COMING_UP_POSTS.slice(0, 3),
      };
    } else if (isWildroot) {
      return {
        audience: '129.3K',
        audienceGrowth: '+14.2% in 30 days',
        engRate: '9.4%',
        postsThisWeek: 4,
        hero: {
          brandCode: 'WB',
          brandName: 'Wildroot Botanics',
          tone: 'pine',
          status: 'Awaiting approval',
          badgeClass: 'badge--butter',
          inTime: '1 day 8 h',
          when: 'Tomorrow · 8:00 PM',
          text: 'A three-step night routine for tired skin: cleanse, three drops of Bloom, and phone in another room.',
          media: '/murmura/photos/murmura/posts/wild-dropper.jpg',
          nets: ['instagram', 'tiktok', 'pinterest'],
        },
        todos: WILDROOT_TODOS,
        comingUp: COMING_UP_POSTS.slice(0, 3),
      };
    } else if (isStarlightBakery) {
      return {
        audience: '203.9K',
        audienceGrowth: '+12.4% in 30 days',
        engRate: '8.8%',
        postsThisWeek: 4,
        hero: {
          brandCode: 'SB',
          brandName: 'Starlight Bakery',
          tone: 'coral',
          status: 'Scheduled',
          badgeClass: 'badge--pine',
          inTime: '18 h 30 min',
          when: 'Tomorrow · 7:00 AM',
          text: 'Weekend sourdough and pastry pre-orders open tomorrow. Reserve your brioche loaf.',
          media: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=900&auto=format&fit=crop&q=80',
          nets: ['instagram', 'tiktok', 'facebook'],
        },
        todos: [
          {
            id: 'todo-sb-1',
            thumb: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=200&auto=format&fit=crop&q=80',
            title: 'Country sourdough scoring video for TikTok...',
            sub: 'Sophia wants approval · Starlight Bakery · Tomorrow 8:00 AM',
            hasApprovalButtons: true,
            statusLabel: 'Needs approval',
            brandCode: 'SB',
            nets: ['tiktok', 'instagram'],
          },
        ],
        comingUp: [
          {
            id: 'c-sb-1',
            thumb: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80',
            title: 'Warm baguettes out of the oven...',
            when: 'Fri · 7:30 AM',
            nets: ['instagram', 'facebook'],
            status: 'scheduled',
            tone: 'coral',
            label: 'Scheduled',
          },
          {
            id: 'c-sb-2',
            thumb: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=200&auto=format&fit=crop&q=80',
            title: 'Cardamom morning buns recipe tips...',
            when: 'Sat · 9:00 AM',
            nets: ['tiktok', 'pinterest'],
            status: 'scheduled',
            tone: 'coral',
            label: 'Scheduled',
          },
        ],
      };
    } else {
      // Ember & Oak (or All Brands default view, where Ember & Oak is the primary active brand)
      return {
        audience: '976.3K',
        audienceGrowth: '+10.1% in 30 days',
        engRate: '10.3%',
        postsThisWeek: 19,
        hero: {
          brandCode: 'EO',
          brandName: 'Ember & Oak',
          tone: 'coral',
          status: 'Awaiting approval',
          badgeClass: 'badge--butter',
          inTime: '16 h 27 min',
          when: 'Tomorrow · 9:00 AM',
          text: 'Pumpkin spice? Never heard of her. Our autumn menu is maple, cardamom and a very good cortado. Starts Monday.',
          media: '/murmura/photos/murmura/posts/ember-shot.jpg',
          nets: ['instagram', 'facebook'],
        },
        todos: EMBER_OAK_TODOS,
        comingUp: COMING_UP_POSTS,
      };
    }
  }, [isHollowHome, isStarlightBakery, isVantageGarage, isWildroot, activeBrand]);

  const currentTodos = useMemo(() => {
    return brandOverviewData.todos.filter((t: any) => !dismissedTodoIds.includes(t.id));
  }, [brandOverviewData.todos, dismissedTodoIds]);

  const visibleTodos = showAllTodos ? currentTodos : currentTodos.slice(0, 4);

  return (
    <div className="view ov" data-view="overview" ref={containerRef}>
      {/* 1. Header with Stats & Actions */}
      <header className="head">
        <div className="head__lead">
          <h1 className="head__title">
            {getGreeting()},<br />
            {displayName}
          </h1>
        </div>

        <div className="head__stats">
          <div className="stat" data-stat="aud">
            <span className="stat__ico">
              <SvgIco name="users" />
            </span>
            <div>
              <div className="stat__value">
                <b>{brandOverviewData.audience}</b>
                <span className="badge badge--pine">{brandOverviewData.audienceGrowth}</span>
              </div>
              <div className="stat__label">Audience across your channels</div>
            </div>
          </div>

          <div className="stat" data-stat="rate">
            <span className="stat__ico">
              <SvgIco name="heart" />
            </span>
            <div>
              <div className="stat__value">
                <b>{brandOverviewData.engRate}</b>
              </div>
              <div className="stat__label">Engagement rate, last 30 days</div>
            </div>
          </div>

          <div className="stat" data-stat="next">
            <span className="stat__ico">
              <SvgIco name="calendar" />
            </span>
            <div>
              <div className="stat__value">
                <b>{brandOverviewData.postsThisWeek}</b>
              </div>
              <div className="stat__label">Posts going out this week</div>
            </div>
          </div>
        </div>

        <div className="head__tools">
          <button
            type="button"
            className="btn btn--ink magnetic"
            onClick={() => navigate('/compose')}
          >
            <SvgIco name="pen" />
            New post
          </button>
        </div>
      </header>

      {/* 2. Main 12-Column Grid */}
      <div className="ov-grid">
        {/* === CARD 1: UP NEXT === */}
        <section className="card ov-next" id="ov-next">
          <header className="card__head">
            <h2 className="card__title">Up next</h2>
            <div className="card__tools">
              <span className="ov-live">
                <i></i>Live queue
              </span>
              <button
                type="button"
                className="ibtn ibtn--sm"
                onClick={() => navigate('/calendar')}
                aria-label="Open calendar"
                title="Open calendar"
              >
                <SvgIco name="arrow" />
              </button>
            </div>
          </header>

          <div data-k="next">
            {/* Hero Card */}
            <article className="ov-hero">
              <div className="ov-hero__media">
                <img
                  src={brandOverviewData.hero.media}
                  alt={brandOverviewData.hero.text}
                  loading="lazy"
                />
              </div>

              <div className="ov-hero__body">
                <p className="ov-hero__meta">
                  <span
                    className={`bmark bmark--sm tone--${brandOverviewData.hero.tone}`}
                    style={isHollowHome ? { background: '#f2b740', color: '#1c1b18', fontWeight: 700 } : undefined}
                  >
                    {brandOverviewData.hero.brandCode}
                  </span>
                  <span className="ov-hero__brand">{brandOverviewData.hero.brandName}</span>
                  <span className={`badge ${brandOverviewData.hero.badgeClass}`}>
                    {brandOverviewData.hero.status}
                  </span>
                </p>

                <div className="ov-hero__count">
                  <span className="ov-hero__in">goes out in</span>
                  <b>{brandOverviewData.hero.inTime}</b>
                </div>

                <p className="ov-hero__when">
                  <SvgIco name="clock" />
                  {brandOverviewData.hero.when}
                </p>

                <p className="ov-hero__text">
                  {brandOverviewData.hero.text}
                </p>

                <div className="ov-hero__foot">
                  <span className="net-stack">
                    {brandOverviewData.hero.nets.map((n: string) => (
                      <span key={n} className={`net net--${n} net--sm`}>
                        <SvgIco name={n} />
                      </span>
                    ))}
                  </span>
                  <span className="toolbar__spacer"></span>
                  <button
                    type="button"
                    className="ibtn ov-hero__open"
                    onClick={() => navigate('/calendar')}
                    aria-label="Publish or view"
                  >
                    <SvgIco name="arrow" />
                  </button>
                </div>
              </div>
            </article>

            {/* Coming Up Section */}
            <p className="ov-after__label">Coming up</p>
            <ol className="ov-after">
              {brandOverviewData.comingUp.map((item: any) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="ov-after__item"
                    onClick={() => navigate('/calendar')}
                  >
                    <span className="ov-after__thumb">
                      <img src={item.thumb} alt={item.title} loading="lazy" />
                    </span>
                    <span className="ov-after__txt">
                      <b>{item.title}</b>
                      <small>{item.when}</small>
                    </span>
                    <span className="ov-after__tail">
                      <span className="net-stack">
                        {item.nets.map((n: string) => (
                          <span key={n} className={`net net--${n} net--xs`}>
                            <SvgIco name={n} />
                          </span>
                        ))}
                      </span>
                      <span className={`spill spill--${item.tone}`}>
                        <i></i>
                        {item.label}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* === CARD 2: NEEDS YOU === */}
        <section className="card ov-needs" id="ov-needs">
          <header className="card__head">
            <h2 className="card__title">Needs you</h2>
            <div className="card__tools">
              <span className={`badge ${currentTodos.length > 0 ? 'badge--coral' : 'badge--plain'}`}>
                {currentTodos.length}
              </span>
            </div>
          </header>

          <ul className="ov-todos">
            {currentTodos.length === 0 ? (
              <li className="ov-clear">
                <div className="empty">
                  <span style={{ display: 'inline-grid', placeItems: 'center', width: 38, height: 38, borderRadius: '50%', background: 'var(--well)', color: 'var(--good)' }}>
                    <SvgIco name="check" />
                  </span>
                  <b className="empty__title">All clear</b>
                  <p className="empty__text">Nothing needs you right now, {displayName}. Enjoy the quiet.</p>
                </div>
              </li>
            ) : (
              visibleTodos.map((todo: any) => (
                <li key={todo.id} className="ov-todo">
                  {todo.isAlert ? (
                    <span className="ov-todo__ico tone--coral">
                      <SvgIco name="alert" />
                    </span>
                  ) : (
                    <span className="ov-todo__thumb">
                      <img
                        className="thumb"
                        src={todo.thumb}
                        alt={todo.title}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (todo.fallbackThumb && target.src !== todo.fallbackThumb) {
                            target.src = todo.fallbackThumb;
                          }
                        }}
                      />
                    </span>
                  )}

                  <div className="ov-todo__txt">
                    <b>{todo.title}</b>
                    <small>{todo.sub}</small>
                  </div>

                  <div className="ov-todo__act">
                    {todo.hasApprovalButtons ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--sm btn--pine"
                          onClick={() => {
                            setDismissedTodoIds((prev) => [...prev, todo.id]);
                            addToast({ type: 'success', message: 'Post approved.' });
                          }}
                        >
                          <SvgIco name="check" />
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost"
                          onClick={() => navigate('/approvals')}
                        >
                          Review
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--sm btn--ink"
                        onClick={() => {
                          if (todo.actionLabel === 'Reconnect') {
                            navigate('/channels');
                          } else {
                            setDismissedTodoIds((prev) => [...prev, todo.id]);
                            addToast({ type: 'info', message: 'Action queued.' });
                          }
                        }}
                      >
                        <SvgIco name={todo.actionLabel === 'Reconnect' ? 'link' : 'refresh'} />
                        {todo.actionLabel}
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}

            {currentTodos.length > 4 && (
              <li className="ov-todo-more">
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => setShowAllTodos(!showAllTodos)}
                >
                  <SvgIco name={showAllTodos ? 'chevL' : 'down'} />
                  {showAllTodos ? 'Show less' : `Show ${currentTodos.length - 4} more`}
                </button>
              </li>
            )}
          </ul>
        </section>

        {/* === CARD 3: AUDIENCE GROWTH === */}
        <section className="card ov-growth" id="ov-growth">
          <header className="card__head">
            <h2 className="card__title">Audience growth</h2>
            <div className="card__tools">
              <div className="seg" role="tablist">
                <button
                  type="button"
                  className={`seg__btn ${growthRange === '30' ? 'is-active' : ''}`}
                  onClick={() => setGrowthRange('30')}
                >
                  30D
                </button>
                <button
                  type="button"
                  className={`seg__btn ${growthRange === '90' ? 'is-active' : ''}`}
                  onClick={() => setGrowthRange('90')}
                >
                  90D
                </button>
              </div>
              <button
                type="button"
                className="ibtn ibtn--sm"
                onClick={() => navigate('/analytics')}
                aria-label="View analytics"
              >
                <SvgIco name="arrow" />
              </button>
            </div>
          </header>

          <div className="ov-growth__sum">
            <b className="num">+89.6K</b>
            <span className="card__sub">
              new followers in {growthRange} days · 10.1% growth
            </span>
          </div>

          <div className="legend">
            <span>
              <i className="tone--sea"></i>New followers per day
            </span>
            {['instagram', 'facebook', 'tiktok', 'pinterest', 'youtube', 'threads', 'x', 'linkedin'].map((net) => (
              <span key={net} className="ov-legnet">
                <span className={`net net--${net} net--xs`}>
                  <SvgIco name={net} />
                </span>
              </span>
            ))}
          </div>

          {/* SVG Smooth Curve Area Chart */}
          <div className="ov-growth__chart">
            <svg
              className="chart__svg"
              viewBox="0 0 600 230"
              style={{ width: '100%', height: '230px', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--sea)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--sea)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <g className="chart__grid">
                <line x1="0" y1="30" x2="600" y2="30" />
                <text x="0" y="24">10K</text>
                <line x1="0" y1="110" x2="600" y2="110" />
                <text x="0" y="104">5K</text>
                <line x1="0" y1="190" x2="600" y2="190" />
                <text x="0" y="184">0</text>
              </g>

              {/* Area & Smooth Bezier Line with Filling Animation */}
              <path
                d="M 20 190 
                   Q 40 100, 60 90 
                   T 100 150 
                   T 140 135 
                   T 180 155 
                   T 220 145 
                   T 260 160 
                   T 300 150 
                   T 340 155 
                   T 380 145 
                   T 420 85 
                   T 460 140 
                   T 500 145 
                   T 540 165 
                   L 580 165 
                   L 580 190 
                   L 20 190 Z"
                fill="url(#growthGrad)"
                className="chart__area"
                style={{ animationDelay: '0.40s' }}
              />

              <path
                d="M 20 190 
                   Q 40 100, 60 90 
                   T 100 150 
                   T 140 135 
                   T 180 155 
                   T 220 145 
                   T 260 160 
                   T 300 150 
                   T 340 155 
                   T 380 145 
                   T 420 85 
                   T 460 140 
                   T 500 145 
                   T 540 165 
                   L 580 165"
                fill="none"
                stroke="var(--sea)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                className="chart__line chart__line--draw"
                style={{ animationDelay: '0.42s' }}
              />

              {/* X Axis Date Labels */}
              <g className="chart__x">
                <text x="20" y="215">Sep 27</text>
                <text x="80" y="215">Sep 30</text>
                <text x="140" y="215">Oct 3</text>
                <text x="200" y="215">Oct 6</text>
                <text x="260" y="215">Oct 9</text>
                <text x="320" y="215">Oct 12</text>
                <text x="380" y="215">Oct 15</text>
                <text x="440" y="215">Oct 18</text>
                <text x="500" y="215">Oct 21</text>
                <text x="550" y="215">Oct 26</text>
              </g>
            </svg>
          </div>
        </section>

        {/* === CARD 4: TOP POST THIS MONTH === */}
        <section className="card ov-top" id="ov-top">
          <header className="card__head">
            <h2 className="card__title">Top post this month</h2>
          </header>

          <button
            type="button"
            className="ov-topcard"
            onClick={() => navigate('/analytics')}
          >
            <img
              src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1000&auto=format&fit=crop&q=80"
              alt="Porsche 911 GT detailing"
              loading="lazy"
            />
            <span className="ov-topcard__shade"></span>
            <span className="ov-topcard__badge badge badge--butter">
              8.9× usual reach
            </span>

            <span className="ov-topcard__body">
              <span className="ov-topcard__brand">
                <span className="bchip">
                  <span className="bmark bmark--xs tone--ink">VG</span>
                  Vantage Garage
                </span>
                <span className="net-stack">
                  <span className="net net--instagram net--xs">
                    <SvgIco name="instagram" />
                  </span>
                  <span className="net net--facebook net--xs">
                    <SvgIco name="facebook" />
                  </span>
                  <span className="net net--tiktok net--xs">
                    <SvgIco name="tiktok" />
                  </span>
                  <span className="net net--x net--xs">
                    <SvgIco name="x" />
                  </span>
                </span>
              </span>

              <span className="ov-topcard__text">
                Wheels off, barrels done, balanced to the gram. Nobody sees it. We do.
              </span>

              <span className="ov-topcard__nums">
                <span><b>346.9K</b>reach</span>
                <span><b>23.2%</b>eng. rate</span>
                <span><b>2.8K</b>saves</span>
              </span>
            </span>
          </button>
        </section>

        {/* === CARD 5: THE WEEK AHEAD === */}
        <section className="card ov-week" id="ov-week">
          <header className="card__head">
            <h2 className="card__title">The week ahead</h2>
            <div className="card__tools">
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => navigate('/calendar')}
              >
                <SvgIco name="calendar" />
                Calendar
              </button>
            </div>
          </header>

          <div className="ov-week__days">
            {/* Mon 26 (Today, Dark Card) */}
            <div className="ov-day is-today">
              <span className="ov-day__head">
                <b>Mon</b>
                <span className="num">26</span>
              </span>
              <span className="ov-day__list">
                <span className="ov-chip tone--coral">
                  <span className="ov-chip__t num">8:30 AM</span>
                  <span className="bmark bmark--xs tone--ink">VG</span>
                </span>
              </span>
              <span className="ov-day__n">1 post</span>
            </div>

            {/* Tue 27 */}
            <div className="ov-day">
              <span className="ov-day__head">
                <b>Tue</b>
                <span className="num">27</span>
              </span>
              <span className="ov-day__list">
                <span className="ov-chip tone--butter">
                  <span className="ov-chip__t num">9 AM</span>
                  <span className="bmark bmark--xs tone--coral">EO</span>
                </span>
                <span className="ov-chip tone--sea">
                  <span className="ov-chip__t num">9:30 AM</span>
                  <span className="bmark bmark--xs tone--coral">EO</span>
                </span>
                <span className="ov-chip tone--sea">
                  <span className="ov-chip__t num">12 PM</span>
                  <span className="bmark bmark--xs tone--pine">WB</span>
                </span>
                <span className="ov-chip ov-chip--more">+3</span>
              </span>
              <span className="ov-day__n">6 posts</span>
            </div>

            {/* Wed 28 */}
            <div className="ov-day">
              <span className="ov-day__head">
                <b>Wed</b>
                <span className="num">28</span>
              </span>
              <span className="ov-day__list">
                <span className="ov-chip tone--butter">
                  <span className="ov-chip__t num">10 AM</span>
                  <span className="bmark bmark--xs tone--butter">HH</span>
                </span>
                <span className="ov-chip tone--sea">
                  <span className="ov-chip__t num">12 PM</span>
                  <span className="bmark bmark--xs tone--sea">NS</span>
                </span>
                <span className="ov-chip tone--butter">
                  <span className="ov-chip__t num">7 PM</span>
                  <span className="bmark bmark--xs tone--ink">VG</span>
                </span>
              </span>
              <span className="ov-day__n">3 posts</span>
            </div>

            {/* Thu 29 */}
            <div className="ov-day">
              <span className="ov-day__head">
                <b>Thu</b>
                <span className="num">29</span>
              </span>
              <span className="ov-day__list">
                <span className="ov-chip tone--sea">
                  <span className="ov-chip__t num">5 PM</span>
                  <span className="bmark bmark--xs tone--ink">VG</span>
                </span>
                <span className="ov-chip tone--sea">
                  <span className="ov-chip__t num">6 PM</span>
                  <span className="bmark bmark--xs tone--pine">WB</span>
                </span>
                <span className="ov-chip tone--butter">
                  <span className="ov-chip__t num">6 PM</span>
                  <span className="bmark bmark--xs tone--coral">EO</span>
                </span>
                <span className="ov-chip ov-chip--more">+1</span>
              </span>
              <span className="ov-day__n">4 posts</span>
            </div>

            {/* Fri 30 */}
            <div className="ov-day">
              <span className="ov-day__head">
                <b>Fri</b>
                <span className="num">30</span>
              </span>
              <span className="ov-day__list">
                <span className="ov-chip tone--coral">
                  <span className="ov-chip__t num">12 PM</span>
                  <span className="bmark bmark--xs tone--ink">VG</span>
                </span>
                <span className="ov-chip tone--sea">
                  <span className="ov-chip__t num">6:15 PM</span>
                  <span className="bmark bmark--xs tone--coral">EO</span>
                </span>
              </span>
              <span className="ov-day__n">2 posts</span>
            </div>

            {/* Sat 31 */}
            <div className="ov-day">
              <span className="ov-day__head">
                <b>Sat</b>
                <span className="num">31</span>
              </span>
              <span className="ov-day__list">
                <span className="ov-chip tone--coral">
                  <span className="ov-chip__t num">9 AM</span>
                  <span className="bmark bmark--xs tone--pine">WB</span>
                </span>
              </span>
              <span className="ov-day__n">1 post</span>
            </div>

            {/* Sun 1 */}
            <div className="ov-day">
              <span className="ov-day__head">
                <b>Sun</b>
                <span className="num">1</span>
              </span>
              <span className="ov-day__list">
                <span className="ov-chip tone--sea">
                  <span className="ov-chip__t num">9:30 AM</span>
                  <span className="bmark bmark--xs tone--coral">EO</span>
                </span>
                <span className="ov-chip tone--butter">
                  <span className="ov-chip__t num">9:30 AM</span>
                  <span className="bmark bmark--xs tone--butter">HH</span>
                </span>
                <span className="ov-chip tone--sea">
                  <span className="ov-chip__t num">5 PM</span>
                  <span className="bmark bmark--xs tone--ink">VG</span>
                </span>
                <span className="ov-chip ov-chip--more">+1</span>
              </span>
              <span className="ov-day__n">4 posts</span>
            </div>
          </div>
        </section>

        {/* === CARD 6: NETWORK PULSE === */}
        <section className="card ov-nets" id="ov-nets">
          <header className="card__head">
            <h2 className="card__title">Network pulse</h2>
            <div className="card__tools">
              <button
                type="button"
                className="ibtn ibtn--sm"
                onClick={() => navigate('/channels')}
                aria-label="Channels"
                title="Channels"
              >
                <SvgIco name="link" />
              </button>
            </div>
          </header>

          <ul className="ov-netlist">
            {NETWORK_PULSE.map((item) => (
              <li key={item.net} className="ov-net">
                <span className={`net net--${item.net} net--md`}>
                  <SvgIco name={item.net} />
                </span>
                <div className="ov-net__main">
                  <p>
                    <b>{item.name}</b>
                    <span className="num">{item.followers}</span>
                  </p>
                  <span className="meter">
                    <span
                      className="meter__fill meter__fill--sea"
                      style={{ transform: `scaleX(${item.scale})` }}
                    ></span>
                  </span>
                </div>
                <div className="ov-net__side">
                  <span className="ov-net__g is-up">{item.growth}</span>
                  <small>{item.eng} eng.</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* === CARD 7: INBOX PULSE === */}
        <section className="card ov-inbox" id="ov-inbox">
          <header className="card__head">
            <h2 className="card__title">Inbox pulse</h2>
            <div className="card__tools">
              <button
                type="button"
                className="ibtn ibtn--sm"
                onClick={() => navigate('/inbox')}
                aria-label="Open inbox"
                title="Open inbox"
              >
                <SvgIco name="inbox" />
              </button>
            </div>
          </header>

          <div className="ov-ib__nums">
            <p>
              <b className="num">21</b>
              <span>open</span>
            </p>
            <p>
              <b className="num">13</b>
              <span>unread</span>
            </p>
            <p>
              <b className="num">4</b>
              <span>priority</span>
            </p>
          </div>

          <div className="ov-ib__bar" role="img" aria-label="11 positive, 6 neutral, 4 negative">
            <span className="tone--pine" style={{ flex: 11 / 21 }}></span>
            <span className="ov-ib__neu" style={{ flex: 6 / 21 }}></span>
            <span className="tone--coral" style={{ flex: 4 / 21 }}></span>
          </div>

          <p className="legend">
            <span><i className="tone--pine"></i>Positive 11</span>
            <span><i className="ov-ib__neu"></i>Neutral 6</span>
            <span><i className="tone--coral"></i>Negative 4</span>
          </p>

          <ul className="ov-ib__list" style={{ minWidth: 0, width: '100%' }}>
            <li style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
              <a
                href="#/inbox"
                className="ov-ib__row"
                style={{ width: 'calc(100% + 16px)', maxWidth: 'calc(100% + 16px)', minWidth: 0, textAlign: 'left' }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/inbox');
                }}
              >
                <div className="av av--md av--t1" style={{ flex: 'none' }}>OF</div>
                <span className="ov-ib__txt" style={{ minWidth: 0, overflow: 'hidden' }}>
                  <b>Owen Fletcher</b>
                  <small style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block', maxWidth: '100%' }}>
                    Just tried the Oak blend as a cold brew and wow. Is the 1kg bag coming back...
                  </small>
                </span>
                <span className="ov-ib__tail" style={{ flex: 'none', flexShrink: 0 }}>
                  <span className="net net--instagram net--xs">
                    <SvgIco name="instagram" />
                  </span>
                  <span className="spill spill--pine">
                    <i />Positive
                  </span>
                </span>
              </a>
            </li>
            <li style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
              <a
                href="#/inbox"
                className="ov-ib__row"
                style={{ width: 'calc(100% + 16px)', maxWidth: 'calc(100% + 16px)', minWidth: 0, textAlign: 'left' }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/inbox');
                }}
              >
                <div className="av av--md av--t2" style={{ flex: 'none' }}>AS</div>
                <span className="ov-ib__txt" style={{ minWidth: 0, overflow: 'hidden' }}>
                  <b>Abigail Shaw</b>
                  <small style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block', maxWidth: '100%' }}>
                    This is the best flat white in Portland and I will not be taking questions 😍
                  </small>
                </span>
                <span className="ov-ib__tail" style={{ flex: 'none', flexShrink: 0 }}>
                  <span className="net net--instagram net--xs">
                    <SvgIco name="instagram" />
                  </span>
                  <span className="spill spill--pine">
                    <i />Positive
                  </span>
                </span>
              </a>
            </li>
            <li style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
              <a
                href="#/inbox"
                className="ov-ib__row"
                style={{ width: 'calc(100% + 16px)', maxWidth: 'calc(100% + 16px)', minWidth: 0, textAlign: 'left' }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/inbox');
                }}
              >
                <div className="av av--md av--t3" style={{ flex: 'none' }}>AR</div>
                <span className="ov-ib__txt" style={{ minWidth: 0, overflow: 'hidden' }}>
                  <b>Ananya Rao</b>
                  <small style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block', maxWidth: '100%' }}>
                    Hi! Do you ship the Huila beans to Canada? And is the bag whole bean only?
                  </small>
                </span>
                <span className="ov-ib__tail" style={{ flex: 'none', flexShrink: 0 }}>
                  <span className="net net--instagram net--xs">
                    <SvgIco name="instagram" />
                  </span>
                  <span className="spill spill--plain">
                    <i />Neutral
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </section>

        {/* === CARD 8: TEAM ACTIVITY === */}
        <section className="card ov-team" id="ov-team">
          <header className="card__head">
            <h2 className="card__title">Team activity</h2>
            <div className="card__tools">
              <button
                type="button"
                className="ibtn ibtn--sm"
                onClick={() => navigate('/team')}
                aria-label="Team audit log"
                title="Team audit log"
              >
                <SvgIco name="history" />
              </button>
            </div>
          </header>

          <ol className="ov-feed">
            {AUDIT_FEED.map((event) => (
              <li key={event.id} className="ov-feed__item">
                <div className="av av--sm av--t0">{event.initial}</div>
                <p>
                  <b>{event.name}</b> {event.text}
                  <small>
                    <SvgIco name="clock" />
                    {event.time}
                  </small>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
