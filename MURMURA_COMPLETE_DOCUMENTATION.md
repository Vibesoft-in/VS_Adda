# Murmura Social Media Suite - Complete Technical Architecture & Code Documentation

> **Project Source:** https://demo.codeandchill.store/murmura/#/approvals  
> **Documentation Type:** Deep Line-by-Line Architecture, State Engine, RBAC, Pages & Functionality  
> **Language:** Hinglish (Technical Hindi-English)  
> **Target Directory:** `c:\xampp\htdocs\V.S Adda`

---

## Table of Contents
1. [Executive Summary & High-Level Overview](#1-executive-summary--high-level-overview)
2. [Core Architecture & Tech Stack](#2-core-architecture--tech-stack)
3. [Global State Management & Reactive Store Engine](#3-global-state-management--reactive-store-engine)
4. [Data Models & Seed Entities Breakdown](#4-data-models--seed-entities-breakdown)
5. [Role-Based Access Control (RBAC) & Security Matrix](#5-role-based-access-control-rbac--security-matrix)
6. [Global Shell, UI Chrome & Navigation](#6-global-shell-ui-chrome--navigation)
7. [Module Deep-Dive 1: Approvals Engine (`#/approvals`)](#7-module-deep-dive-1-approvals-engine-approvals)
8. [Module Deep-Dive 2: Overview View (`#/overview`)](#8-module-deep-dive-2-overview-view-overview)
9. [Module Deep-Dive 3: Compose View (`#/compose`)](#9-module-deep-dive-3-compose-view-compose)
10. [Module Deep-Dive 4: Calendar View (`#/calendar`)](#10-module-deep-dive-4-calendar-view-calendar)
11. [Module Deep-Dive 5: Inbox View (`#/inbox`)](#11-module-deep-dive-5-inbox-view-inbox)
12. [Module Deep-Dive 6: Analytics & Charts Engine (`#/analytics`)](#12-module-deep-dive-6-analytics--charts-engine-analytics)
13. [Module Deep-Dive 7: Listening View (`#/listening`)](#13-module-deep-dive-7-listening-view-listening)
14. [Module Deep-Dive 8: Library View (`#/library`)](#14-module-deep-dive-8-library-view-library)
15. [Module Deep-Dive 9: Channels View (`#/channels`)](#15-module-deep-dive-9-channels-view-channels)
16. [Module Deep-Dive 10: Team & Roles View (`#/team`)](#16-module-deep-dive-10-team--roles-view-team)
17. [Module Deep-Dive 11: Settings View (`#/settings`)](#17-module-deep-dive-11-settings-view-settings)
18. [Asset Chunks Inventory & File Structure](#18-asset-chunks-inventory--file-structure)

---

## 1. Executive Summary & High-Level Overview

**Murmura** ek enterprise-grade, high-performance social media management workspace hai jo agencies aur marketing teams ke liye design kiya gaya hai.

### Core Value Proposition:
- **Multi-Brand Workspace**: Ek hi dashboard se multiple client brands (jaise Vantage Garage, Ember & Oak, Hollow Home, Wildroot Botanicals) ko handle karna.
- **8 Integrated Social Networks**: Instagram, Facebook, X (Twitter), LinkedIn, TikTok, YouTube, Pinterest, aur Threads ka centralized publishing, analytics aur inbox.
- **Strict Approval Workflows**: Drafts ko bina client ya manager ke sign-off ke live hone se rokna, real-time feedback notes dena, aur audit logging maintain karna.
- **Ultra-Fast Performance**: Pure Vanilla JS aur GSAP micro-animations ke sath zero lag aur zero framework overhead.

---

## 2. Core Architecture & Tech Stack

Murmura ka core codebase React, Vue ya Angular ke bajaye modern native web standards par built hai:

### 1. Build & Bundler: Vite (Code-Splitting)
- Initial entry point `index.js` sirf **~200 KB** ka hai (jisme GSAP core + store + router shamil hai).
- Har ek page ek isolated dynamic ES Module chunk ke roop mein split hai (`__vite__mapDeps`). Page tabhi download hota hai jab user us route par jata hai.

### 2. Animation Engine: GSAP 3.15.0 + Flip Plugin
- **GSAP Core**: Micro-animations, timelines, button physics, bouncing rubber stamps, floating action bars.
- **GSAP Flip Plugin**: Navigation tabs ki ink pill physics, grid-to-list layout transitions, 3D card flips (`rotationY: 90deg`).

### 3. CSS Tokens & Theming System
- Pure Vanilla CSS variables based design system:
  - `--cream`: Clean neutral app background
  - `--ink`: Dark primary typography & controls
  - `--pine`: Emerald green (#22c55e / #15803d) for Approved, Active, Success
  - `--coral`: Vibrant red/orange (#ef4444 / #f87171) for Changes Requested, Disconnected, Danger
  - `--butter`: Warm amber (#f59e0b) for Pending, Due Soon, Warnings
  - `--sea`: Cyan/Blue (#0284c7) for Scheduled posts
  - `--lilac`: Soft violet for Inbox & mentions
- **Instant Pre-Paint Theme Script**: `index.html` ke head mein synchronous script execute hoti hai jo DOM render hone se pehle hi `localStorage` se theme load karke `document.documentElement.dataset.theme = 'dark'|'light'` laga deti hai. Isse kabhi bhi wrong-color flash nahi hota.

---

## 3. Global State Management & Reactive Store Engine

App ka poora data ek centralized reactive object `Y` ke andar rehta hai jo `localStorage` key `murmura:v1` ke sath sync hota hai.

### Store Architecture:
```javascript
Y = {
  version: 1,
  seededOn: "...",               // Seed timestamp
  session: { userId: "m-camila" }, // Current active login session
  brands: [ ... ],               // 4 Brands metadata & theme tones
  channels: [ ... ],             // 8 Networks social accounts
  posts: [ ... ],                // Posts array with reviews, media, status
  campaigns: [ ... ],            // Marketing campaigns
  convos: [ ... ],               // Social inbox messages & comments
  replies: [ ... ],              // Canned quick responses
  assets: [ ... ],               // Media library images and videos
  hashtags: [ ... ],             // Reusable hashtag sets
  templates: [ ... ],            // Post blueprint templates
  keywords: [ ... ],             // Listening keywords
  mentions: [ ... ],             // Social mentions with sentiment
  competitors: [ ... ],          // Benchmarking competitor statistics
  members: [ ... ],              // Workspace users and roles
  roles: [ ... ],                // Role definitions and permission arrays
  audit: [ ... ],                // 200 items audit history trail
  notices: [ ... ],              // In-app notifications
  settings: {
    workspace: "Northlight Studio",
    timezone: "Europe/Lisbon",
    weekStart: 1,
    approval: "perm",            // 'perm' | 'always' | 'off'
    shortenLinks: true,
    utm: true,
    utmSource: "murmura",
    notify: { approvals: true, mentions: true, failures: true, digest: false },
    plan: "agency",
    seats: 15,
    requireMfa: false
  },
  ui: { brand: "all" }           // Active brand filter state
}
```

### Reactive Event Bus Implementation:
1. **`as(...keys)` (Mutate & Dispatch)**:
   - Jab koi bhi data mutate hota hai (jaise `as('posts', 'audit')`), yeh method:
     - `localStorage.setItem('murmura:v1', JSON.stringify(Y))` execute karta hai.
     - Registered listener functions `es.get(key)` ko instantly trigger karke UI update karta hai.
2. **`rs(key, fn)` (Subscribe)**:
   - Kisi view ko specific state slice par listen karne ki suvidha deta hai. Unsubscribe callback return karta hai.
3. **`ns(fn)` (Scoped Garbage Collection)**:
   - Har page ke mount hone par `ns()` ke andar sare DOM event listeners aur state subscriptions track hote hain. View unmount (`leave()`) hote hi yeh sare subscriptions automatically garbage collect kar deta hai.

---

## 4. Data Models & Seed Entities Breakdown

### 1. Brands Entity (`Y.brands`)
- **Vantage Garage** (`vantage`): High-end auto detailing brand.
- **Ember & Oak** (`ember`): Specialty coffee roasters.
- **Hollow Home** (`hollow`): Minimalist interior design & furniture.
- **Wildroot Botanicals** (`wildroot`): Organic skincare & herbal products.

### 2. Channels Entity (`Y.channels`)
- Har channel object mein: `id`, `brandId`, `net` (`instagram`, `x`, `facebook`, `linkedin`, `tiktok`, `youtube`, `pinterest`, `threads`), `handle`, `avatar`, `followers`, `status` (`connected`, `expiring`, `disconnected`), `connectedBy`.

### 3. Posts Entity (`Y.posts`)
- Har post object mein:
  - `id`: Post unique ID (`p-1`, `p-2`, ...)
  - `brandId`: Targeted brand
  - `channels`: Array of channel IDs jahan post publish hoga
  - `media`: Array of image/video asset URLs
  - `text`: Post caption body copy
  - `firstComment`: Optional Instagram hashtags/first comment
  - `at`: Scheduled publish timestamp (Unix milliseconds)
  - `created`: Creation timestamp
  - `author`: Member user ID (`m-camila`, `m-omar`, etc.)
  - `status`: `'draft'` | `'pending'` | `'changes'` | `'scheduled'` | `'published'` | `'failed'`
  - `reviews`: Array of approval history objects:
    ```javascript
    reviews: [
      { by: "m-omar", at: 1729000000000, decision: "submitted", note: "" },
      { by: "m-camila", at: 1729003600000, decision: "changes", note: "Lead with the price." },
      { by: "m-camila", at: 1729007200000, decision: "approved", note: "" }
    ]
    ```
  - `metrics`: Published posts ke live statistics (`impressions`, `reach`, `likes`, `comments`, `shares`, `saves`, `clicks`).

---

## 5. Role-Based Access Control (RBAC) & Security Matrix

App ke andar strict enterprise permission checks hain:

| Permission Name | Meaning & Capabilities |
| :--- | :--- |
| `post.create` | Naye posts draft karna, media upload karna, schedule banana |
| `post.approve` | Pending posts ko **Approve** karna ya **Request Changes** bhejna |
| `post.publish` | Posts ko force **Publish Now** karna ya schedule override karna |
| `inbox.reply` | Customer messages aur comments ka reply dena |
| `inbox.assign` | Inbox conversations kisi member ko assign karna |
| `analytics.view` | Analytics graphs aur engagement reports dekhna |
| `listening.manage` | Brand listening keywords monitor karna aur competitors add karna |
| `team.manage` | Team members ko invite karna, unke roles aur brand permissions modify karna |
| `channels.manage` | Social accounts connect ya disconnect karna |

### Role Personas:
1. **Admin / Owner** (`admin`): Complete unrestricted access across all brands & settings.
2. **Manager / Lead** (`manager`): Approval authority, publishing rights, inbox management, and team lead access.
3. **Creator / Copywriter** (`creator`): Post likh sakta hai par approve nahi kar sakta (`Approve` button disabled rehta hai with lock badge).
4. **Community Manager** (`community`): Inbox comments, replies, and sentiment tagging.
5. **Client / External Approver** (`client`): External client jo sirf apne brand ke posts ko review aur approve/reject kar sakta hai.

---

## 6. Global Shell, UI Chrome & Navigation

### 1. Header Bar (`.top`)
- **Brand Mark & Wordmark**: Murmura animated SVG logo.
- **Tabs Navigation Track (`.tabs__track`)**:
  - Main links: Overview, Compose, Calendar, Inbox (with unread badge), Approvals (with pending badge), Analytics, Listening.
  - **Ink Pill (`.tabs__pill`)**: GSAP Flip se animated ink pill jo active tab ke piche smoothly stretch hokar move karti hai.
- **Top Tools**:
  - Global Search Button (`#btn-search` / `⌘K`)
  - Multi-Brand Switcher (`#btn-brand`): All Brands ya kisi specific brand par switch karne ka popover.
  - Notification Bell (`#btn-bell`): Live alert dialog.
  - Account / Demo User Switcher (`#btn-me`): Roles switch karke alag-alag permissions test karne ka menu.

### 2. Desktop Quick-Action Dock (`.dock`)
- Fixed left dock:
  - Search (`⌘K`), Create (`N`), Today's Queue, Library, Channels, Team & Roles, Settings, Dark/Light Theme toggle.

### 3. Global Finder Dialog (`#finder` / `⌘K` Command Palette)
- Pure keyboard-driven instant search engine:
  - Posts, inbox conversations, team members aur pages ko instant fuzzy match karta hai.

### 4. Toast Notification System with Undo
- Har major action (Approve, Request Changes, Delete, Reschedule) par screen ke bottom mein floating toast message aata hai jisme **Undo** callback integrated rehta hai.

---

## 7. Module Deep-Dive 1: Approvals Engine (`#/approvals`)

Yeh URL `https://demo.codeandchill.store/murmura/#/approvals` ka target core engine hai.

### A. Lifecycle Architecture (`mount`, `enter`, `leave`)
- **`mount(container)`**:
  - Role check karta hai (`z() = user.perms.includes('post.approve')`).
  - Template `ze()` ko container mein render karta hai.
  - Event delegation bind karta hai: `data-ap="approve"`, `data-ap="changes"`, `data-ap="open"`, `data-ap="bulk-approve"`, etc.
  - Store listeners register karta hai (`posts`, `settings`, `members`).
- **`enter({ params, same })`**:
  - GSAP Entrance Timeline:
    - Toolbar (`.ap-bar`) slide-down hoti hai.
    - Post cards (`.ap-card`) stagger effect ke sath fade-in hote hain.
    - Sidebar cards (`.ap-side`) smoothly settle hote hain.
  - **Deep-linking Target Ring**: Agar route mein specific post ID pass ki gayi ho (`#/approvals/p-14`), to wo card view mein scroll hota hai aur uske charo taraf **`.ap-ring`** (pulsing glowing ring) 2.2 seconds tak glow karti hai.

### B. Tab Strip & Filters (`H(tab, brandFilter)`)
1. **`mine` ("Waiting for me" / "To review")**:
   - Wo posts jo pending hain aur jinke brand par current user approver hai (excluding posts written by self).
2. **`pending` ("All pending")**:
   - Workspace ke sabhi pending posts.
3. **`changes` ("Changes requested")**:
   - Wo posts jinpar approvers ne revisions maange hain.
4. **`submitted` ("My submissions")**:
   - Current user ke apne drafts jo approval ke intezaar mein hain.
5. **`approved` ("Recently approved")**:
   - Pichhle 14 dino mein approve hue posts.

### C. Post Card Components (`Be(e)` & `Ge(e)`)
- **Media Carousel (`Be`)**:
  - Multiple images ke liye dynamic dots (`.ap-dot`) pagination.
  - Text-only posts ke liye clean fallback layout.
- **Due Time Calculation (`Ve`)**:
  - Due time logic: `"Goes out: Tomorrow 4:00 PM"` (Pine green), `"Due soon"` (Butter yellow), `"Was due"` (Coral red alert).
- **Target Channels (`Ee`)**:
  - Social network badges (Instagram, X, Facebook, LinkedIn, TikTok, etc.).
- **Author & Approver Badges (`.ap-people`)**:
  - "Written by" creator avatar + name.
  - "Can approve" approvers list ("You", "Elise or Haruto").
- **Review History Audit Trail (`He`)**:
  - Har card par chronologically listed audit steps: kisne kab submit kiya, kisne kya feedback diya.

### D. Interactive Actions & Physics Animations

#### 1. Instant Approve (`ot(postId)`)
- Card par **`.ap-stamp`** rubber stamp bounce animation chalti hai (`scale: 1.4 -> 1`).
- Stamp text: `"Approved" · [Reviewer Name] · [Date/Time]`.
- Post ka status `status = 'scheduled'` ban jata hai.
- Author ko notice dispatch hota hai aur screen par **Undo Toast** render hota hai.

#### 2. Request Changes (`lt(postId)` & `ut(postId, note)`)
- Dialog modal open hota hai jisme **Quick Suggestion Chips** hote hain:
  - `Swap the photo`, `Shorten the caption`, `Check the price`, `Add the link`, `Fix the hashtags`, `Move the time`.
- Submit karne par **3D Card Flip Animation** chalti hai:
  - GSAP `to(card, { rotationY: 90, transformPerspective: 1400 })`.
  - Coral-red back face `.ap-back` reveal hota hai jisme approver ka note aur avatar dikhta hai.
  - Card slide-down hokar list se smoothly exit kar jata hai.
- Status `status = 'changes'` set ho jata hai.

#### 3. Floating Bulk Action Dock (`data-bulk` & `st()`)
- Multi-card selection par bottom dock slide-up hota hai: `"3 selected"`.
- **Approve selected** dabane par sabhi selected cards par staggered rubber-stamp animation chal kar sare posts ek sath approve ho jaate hain.

#### 4. Native Multi-Network Preview Drawer (`Gl(e)` & `xl(...)`)
- Card par double-click karne ya "Open" dabane par right sliding drawer khulta hai jo exact **Pixel-Perfect Native UI** dikhata hai:
  - **Instagram Feed**: Profile pic, handle, post media carousel, like/comment/share icons, caption, first comment hashtags.
  - **X (Twitter)**: Handle, verified badge, tweet body, retweet/like counts.
  - **LinkedIn**: Company page header, follower count, body text with "...see more", reaction icons.
  - Segmented tab switch karne par live GSAP cross-fade hota hai.

---

## 8. Module Deep-Dive 2: Overview View (`#/overview`)

- **Needs You Widget**: Urgent action center (Pending sign-offs, requested changes, failed posts, disconnected channel tokens).
- **Up Next Widget**: Agle 24 ghante mein kaunsa post live hoga uska live countdown ticker.
- **Audience Growth Mini-Chart**: 30-day aur 90-day follower growth curve.
- **The Week Ahead**: Monday se Sunday tak har din kitne posts scheduled hain uska visual load matrix.
- **Network Pulse**: Sare connected accounts ka live connection health status.

---

## 9. Module Deep-Dive 3: Compose View (`#/compose`)

- **Multi-Channel Publisher**: Ek sath 8 networks select karke post likhne ki suvidha.
- **Live Character Limits Engine**: X (280 chars), Threads (500 chars), Instagram (2,200 chars) ke liye live warnings aur counters.
- **Smart Scheduling Heatmap Algorithm (`Vs`, `Hs`)**:
  - Algorithm pichhle engagement data ke hisaab se 3 sabse best posting times auto-calculate karta hai (e.g. "Tuesday 6:00 PM - High Reach").
- **First Comment Tool**: Hashtags ko caption ke bajaye Instagram first comment mein schedule karne ka feature.

---

## 10. Module Deep-Dive 4: Calendar View (`#/calendar`)

- **Interactive Calendar Views**: Month grid, Week view, Day timeline.
- **Drag-and-Drop Rescheduling**: Post card ko mouse/touch se drag karke kisi doosre din ya time slot par drop karne par uska `post.at` timestamp auto-update ho jata hai.
- **Multi-Dimension Filters**: Filter by brand, social network, post status, and campaign tag.

---

## 11. Module Deep-Dive 5: Inbox View (`#/inbox`)

- **Unified Social Conversations**: 8 alag-alag apps ke comments, DMs, aur mentions ek 2-pane interface mein.
- **AI Sentiment Analysis Engine**: Har conversation par auto-tag: `Positive` (Green), `Neutral` (Gray), `Negative` (Red alert).
- **Team Assignment**: Conversation ko kisi bhi member ko assign karna.
- **Canned Responses**: Quick keyboard snippets se pre-saved replies bhejna.

---

## 12. Module Deep-Dive 6: Analytics & Charts Engine (`#/analytics`)

- **Custom SVG Chart Engine (`charts-Cm206kS9.js`)**:
  - Sirf 167 lines ka lightweight custom SVG charting engine (bina kisi external library ke).
  - Bezier curve interpolation, dynamic gridlines, vertical crosshair, hover tooltips, aur ResizeObserver integration.
- **Best Time to Post 7x24 Heatmap Grid**: 7 din x 24 ghante ki intensity matrix.
- **Content Mix Donut Chart**: Photos, Videos, Carousels aur Text ka visual proportion.
- **PDF / CSV Export**: Instant report generation.

---

## 13. Module Deep-Dive 7: Listening View (`#/listening`)

- **Brand & Web Listening**: Brand names, competitor handles aur industry hashtags ka live stream.
- **Share of Voice**: Competitors ke muqable aapke brand ki charcha ka percentage share.
- **Trending Terms Word Cloud**: Is hafte ke high-velocity keywords.

---

## 14. Module Deep-Dive 8: Library View (`#/library`)

- **4 Dedicated Shelves**:
  1. **Media**: High-res images aur videos, dimensions aur file size tags ke sath. Batch select karke "Use in post" bheja ja sakta hai.
  2. **Templates**: Reusable post blueprints placeholders ke sath: `{service} on a {car}. {hours} hours in the bay.`
  3. **Hashtag Sets**: Curated hashtag sets (e.g. `#detailing #ceramiccoating`).
  4. **Saved Replies**: Customer support canned responses.

---

## 15. Module Deep-Dive 9: Channels View (`#/channels`)

- **8 Social Platforms Management**: Instagram, Facebook, X, LinkedIn, TikTok, YouTube, Pinterest, Threads.
- **Token Health & Expiry Alerts**: OAuth token disconnect hone par ya expire hone se 3 din pehle warning.
- **1-Click Reconnect**: Direct re-authentication flow.

---

## 16. Module Deep-Dive 10: Team & Roles View (`#/team`)

- **Member Roster**: Team members list, active roles, assigned brands, MFA status, last active time.
- **Role Permissions Matrix**: Visual matrix table jo har role ke rights ko inspect karta hai.
- **Invite Member Modal**: Email, role aur brand access set karke invite bhejna.

---

## 17. Module Deep-Dive 11: Settings View (`#/settings`)

- **Workspace Profile**: Name, time zone (`Europe/Lisbon`), week start day.
- **Approval Rule Policy**:
  - `perm`: Default rule (jin users ke paas `post.publish` nahi hai sirf unhe sign-off chahiye).
  - `always`: Strict agency policy (har post approve hona mandatory hai).
  - `off`: Direct publishing.
- **Theme Switcher**: Dark Mode, Light Mode, System Theme.
- **Data Reset**: 1-click seed reset button jo pura demo mock data restore kar deta hai.

---

## 18. Asset Chunks Inventory & File Structure

Humne demo application ke sabhi **23 production chunks** ko download aur format karke local disk par extract kar liya hai:

| File Name | Chunks Type | Lines Count | Description |
| :--- | :--- | :--- | :--- |
| `index.html` | Shell | 155 lines | Base markup, head script, navigation bars, modals |
| `index.css` | Styles | 1,500+ lines | Global tokens, reset, typography, dock, layout |
| `index.js` | Core Engine | 4,172 lines | GSAP 3.15 + Flip, Reactive Store Y, Router |
| `approvals-9_LkHnvX.js` | View Chunk | 803 lines | Approvals queue, rubber stamp, 3D flip card |
| `approvals-CaOosbas.css` | View CSS | 16,401 bytes | Approvals card layout, bulk bar, stamp styles |
| `compose-DcEkompt.js` | View Chunk | 1,559 lines | Multi-network composer, character limits, scheduler |
| `calendar-dC-sZzXf.js` | View Chunk | 1,297 lines | Drag-and-drop publishing calendar |
| `inbox-Czp4FX5r.js` | View Chunk | 1,460 lines | Unified social inbox, sentiment tagging |
| `analytics-CqzZ4ABz.js` | View Chunk | 832 lines | Metrics, KPI cards, heatmap |
| `charts-Cm206kS9.js` | Chart Engine | 167 lines | Lightweight native SVG chart renderer |
| `listening-CzGtIEnV.js` | View Chunk | 814 lines | Social listening & brand mentions stream |
| `library-CKQOu0xM.js` | View Chunk | 1,103 lines | Media assets, templates, hashtags, replies |
| `channels-CluNZ7pp.js` | View Chunk | 852 lines | Connected social accounts & OAuth health |
| `team-BzN6aZIm.js` | View Chunk | 1,378 lines | Members directory, permissions matrix |
| `settings-De7NLl3t.js` | View Chunk | 999 lines | Workspace settings, approval rules, theming |
| `overview-C5kP9O_e.js` | View Chunk | 417 lines | Dashboard overview, "Needs you" widget |

---

*End of Murmura Project Technical Documentation.*
