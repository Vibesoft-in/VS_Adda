import fs from 'fs';
import path from 'path';

const workspaceDir = 'c:\\xampp\\htdocs\\V.S Adda';

const markdownContent = `# Murmura Social Media Suite - Complete Technical Architecture & Code Documentation

> **Project Source:** https://demo.codeandchill.store/murmura/#/approvals  
> **Documentation Type:** Deep Line-by-Line Architecture, State Engine, RBAC, Pages & Functionality  
> **Language:** Hinglish (Technical Hindi-English)  
> **Target Directory:** \`c:\\xampp\\htdocs\\V.S Adda\`

---

## Table of Contents
1. [Executive Summary & High-Level Overview](#1-executive-summary--high-level-overview)
2. [Core Architecture & Tech Stack](#2-core-architecture--tech-stack)
3. [Global State Management & Reactive Store Engine](#3-global-state-management--reactive-store-engine)
4. [Data Models & Seed Entities Breakdown](#4-data-models--seed-entities-breakdown)
5. [Role-Based Access Control (RBAC) & Security Matrix](#5-role-based-access-control-rbac--security-matrix)
6. [Global Shell, UI Chrome & Navigation](#6-global-shell-ui-chrome--navigation)
7. [Module Deep-Dive 1: Approvals Engine (\`#/approvals\`)](#7-module-deep-dive-1-approvals-engine-approvals)
8. [Module Deep-Dive 2: Overview View (\`#/overview\`)](#8-module-deep-dive-2-overview-view-overview)
9. [Module Deep-Dive 3: Compose View (\`#/compose\`)](#9-module-deep-dive-3-compose-view-compose)
10. [Module Deep-Dive 4: Calendar View (\`#/calendar\`)](#10-module-deep-dive-4-calendar-view-calendar)
11. [Module Deep-Dive 5: Inbox View (\`#/inbox\`)](#11-module-deep-dive-5-inbox-view-inbox)
12. [Module Deep-Dive 6: Analytics & Charts Engine (\`#/analytics\`)](#12-module-deep-dive-6-analytics--charts-engine-analytics)
13. [Module Deep-Dive 7: Listening View (\`#/listening\`)](#13-module-deep-dive-7-listening-view-listening)
14. [Module Deep-Dive 8: Library View (\`#/library\`)](#14-module-deep-dive-8-library-view-library)
15. [Module Deep-Dive 9: Channels View (\`#/channels\`)](#15-module-deep-dive-9-channels-view-channels)
16. [Module Deep-Dive 10: Team & Roles View (\`#/team\`)](#16-module-deep-dive-10-team--roles-view-team)
17. [Module Deep-Dive 11: Settings View (\`#/settings\`)](#17-module-deep-dive-11-settings-view-settings)
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
- Initial entry point \`index.js\` sirf **~200 KB** ka hai (jisme GSAP core + store + router shamil hai).
- Har ek page ek isolated dynamic ES Module chunk ke roop mein split hai (\`__vite__mapDeps\`). Page tabhi download hota hai jab user us route par jata hai.

### 2. Animation Engine: GSAP 3.15.0 + Flip Plugin
- **GSAP Core**: Micro-animations, timelines, button physics, bouncing rubber stamps, floating action bars.
- **GSAP Flip Plugin**: Navigation tabs ki ink pill physics, grid-to-list layout transitions, 3D card flips (\`rotationY: 90deg\`).

### 3. CSS Tokens & Theming System
- Pure Vanilla CSS variables based design system:
  - \`--cream\`: Clean neutral app background
  - \`--ink\`: Dark primary typography & controls
  - \`--pine\`: Emerald green (#22c55e / #15803d) for Approved, Active, Success
  - \`--coral\`: Vibrant red/orange (#ef4444 / #f87171) for Changes Requested, Disconnected, Danger
  - \`--butter\`: Warm amber (#f59e0b) for Pending, Due Soon, Warnings
  - \`--sea\`: Cyan/Blue (#0284c7) for Scheduled posts
  - \`--lilac\`: Soft violet for Inbox & mentions
- **Instant Pre-Paint Theme Script**: \`index.html\` ke head mein synchronous script execute hoti hai jo DOM render hone se pehle hi \`localStorage\` se theme load karke \`document.documentElement.dataset.theme = 'dark'|'light'\` laga deti hai. Isse kabhi bhi wrong-color flash nahi hota.

---

## 3. Global State Management & Reactive Store Engine

App ka poora data ek centralized reactive object \`Y\` ke andar rehta hai jo \`localStorage\` key \`murmura:v1\` ke sath sync hota hai.

### Store Architecture:
\`\`\`javascript
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
\`\`\`

### Reactive Event Bus Implementation:
1. **\`as(...keys)\` (Mutate & Dispatch)**:
   - Jab koi bhi data mutate hota hai (jaise \`as('posts', 'audit')\`), yeh method:
     - \`localStorage.setItem('murmura:v1', JSON.stringify(Y))\` execute karta hai.
     - Registered listener functions \`es.get(key)\` ko instantly trigger karke UI update karta hai.
2. **\`rs(key, fn)\` (Subscribe)**:
   - Kisi view ko specific state slice par listen karne ki suvidha deta hai. Unsubscribe callback return karta hai.
3. **\`ns(fn)\` (Scoped Garbage Collection)**:
   - Har page ke mount hone par \`ns()\` ke andar sare DOM event listeners aur state subscriptions track hote hain. View unmount (\`leave()\`) hote hi yeh sare subscriptions automatically garbage collect kar deta hai.

---

## 4. Data Models & Seed Entities Breakdown

### 1. Brands Entity (\`Y.brands\`)
- **Vantage Garage** (\`vantage\`): High-end auto detailing brand.
- **Ember & Oak** (\`ember\`): Specialty coffee roasters.
- **Hollow Home** (\`hollow\`): Minimalist interior design & furniture.
- **Wildroot Botanicals** (\`wildroot\`): Organic skincare & herbal products.

### 2. Channels Entity (\`Y.channels\`)
- Har channel object mein: \`id\`, \`brandId\`, \`net\` (\`instagram\`, \`x\`, \`facebook\`, \`linkedin\`, \`tiktok\`, \`youtube\`, \`pinterest\`, \`threads\`), \`handle\`, \`avatar\`, \`followers\`, \`status\` (\`connected\`, \`expiring\`, \`disconnected\`), \`connectedBy\`.

### 3. Posts Entity (\`Y.posts\`)
- Har post object mein:
  - \`id\`: Post unique ID (\`p-1\`, \`p-2\`, ...)
  - \`brandId\`: Targeted brand
  - \`channels\`: Array of channel IDs jahan post publish hoga
  - \`media\`: Array of image/video asset URLs
  - \`text\`: Post caption body copy
  - \`firstComment\`: Optional Instagram hashtags/first comment
  - \`at\`: Scheduled publish timestamp (Unix milliseconds)
  - \`created\`: Creation timestamp
  - \`author\`: Member user ID (\`m-camila\`, \`m-omar\`, etc.)
  - \`status\`: \`'draft'\` | \`'pending'\` | \`'changes'\` | \`'scheduled'\` | \`'published'\` | \`'failed'\`
  - \`reviews\`: Array of approval history objects:
    \`\`\`javascript
    reviews: [
      { by: "m-omar", at: 1729000000000, decision: "submitted", note: "" },
      { by: "m-camila", at: 1729003600000, decision: "changes", note: "Lead with the price." },
      { by: "m-camila", at: 1729007200000, decision: "approved", note: "" }
    ]
    \`\`\`
  - \`metrics\`: Published posts ke live statistics (\`impressions\`, \`reach\`, \`likes\`, \`comments\`, \`shares\`, \`saves\`, \`clicks\`).

---

## 5. Role-Based Access Control (RBAC) & Security Matrix

App ke andar strict enterprise permission checks hain:

| Permission Name | Meaning & Capabilities |
| :--- | :--- |
| \`post.create\` | Naye posts draft karna, media upload karna, schedule banana |
| \`post.approve\` | Pending posts ko **Approve** karna ya **Request Changes** bhejna |
| \`post.publish\` | Posts ko force **Publish Now** karna ya schedule override karna |
| \`inbox.reply\` | Customer messages aur comments ka reply dena |
| \`inbox.assign\` | Inbox conversations kisi member ko assign karna |
| \`analytics.view\` | Analytics graphs aur engagement reports dekhna |
| \`listening.manage\` | Brand listening keywords monitor karna aur competitors add karna |
| \`team.manage\` | Team members ko invite karna, unke roles aur brand permissions modify karna |
| \`channels.manage\` | Social accounts connect ya disconnect karna |

### Role Personas:
1. **Admin / Owner** (\`admin\`): Complete unrestricted access across all brands & settings.
2. **Manager / Lead** (\`manager\`): Approval authority, publishing rights, inbox management, and team lead access.
3. **Creator / Copywriter** (\`creator\`): Post likh sakta hai par approve nahi kar sakta (\`Approve\` button disabled rehta hai with lock badge).
4. **Community Manager** (\`community\`): Inbox comments, replies, and sentiment tagging.
5. **Client / External Approver** (\`client\`): External client jo sirf apne brand ke posts ko review aur approve/reject kar sakta hai.

---

## 6. Global Shell, UI Chrome & Navigation

### 1. Header Bar (\`.top\`)
- **Brand Mark & Wordmark**: Murmura animated SVG logo.
- **Tabs Navigation Track (\`.tabs__track\`)**:
  - Main links: Overview, Compose, Calendar, Inbox (with unread badge), Approvals (with pending badge), Analytics, Listening.
  - **Ink Pill (\`.tabs__pill\`)**: GSAP Flip se animated ink pill jo active tab ke piche smoothly stretch hokar move karti hai.
- **Top Tools**:
  - Global Search Button (\`#btn-search\` / \`⌘K\`)
  - Multi-Brand Switcher (\`#btn-brand\`): All Brands ya kisi specific brand par switch karne ka popover.
  - Notification Bell (\`#btn-bell\`): Live alert dialog.
  - Account / Demo User Switcher (\`#btn-me\`): Roles switch karke alag-alag permissions test karne ka menu.

### 2. Desktop Quick-Action Dock (\`.dock\`)
- Fixed left dock:
  - Search (\`⌘K\`), Create (\`N\`), Today's Queue, Library, Channels, Team & Roles, Settings, Dark/Light Theme toggle.

### 3. Global Finder Dialog (\`#finder\` / \`⌘K\` Command Palette)
- Pure keyboard-driven instant search engine:
  - Posts, inbox conversations, team members aur pages ko instant fuzzy match karta hai.

### 4. Toast Notification System with Undo
- Har major action (Approve, Request Changes, Delete, Reschedule) par screen ke bottom mein floating toast message aata hai jisme **Undo** callback integrated rehta hai.

---

## 7. Module Deep-Dive 1: Approvals Engine (\`#/approvals\`)

Yeh URL \`https://demo.codeandchill.store/murmura/#/approvals\` ka target core engine hai.

### A. Lifecycle Architecture (\`mount\`, \`enter\`, \`leave\`)
- **\`mount(container)\`**:
  - Role check karta hai (\`z() = user.perms.includes('post.approve')\`).
  - Template \`ze()\` ko container mein render karta hai.
  - Event delegation bind karta hai: \`data-ap="approve"\`, \`data-ap="changes"\`, \`data-ap="open"\`, \`data-ap="bulk-approve"\`, etc.
  - Store listeners register karta hai (\`posts\`, \`settings\`, \`members\`).
- **\`enter({ params, same })\`**:
  - GSAP Entrance Timeline:
    - Toolbar (\`.ap-bar\`) slide-down hoti hai.
    - Post cards (\`.ap-card\`) stagger effect ke sath fade-in hote hain.
    - Sidebar cards (\`.ap-side\`) smoothly settle hote hain.
  - **Deep-linking Target Ring**: Agar route mein specific post ID pass ki gayi ho (\`#/approvals/p-14\`), to wo card view mein scroll hota hai aur uske charo taraf **\`.ap-ring\`** (pulsing glowing ring) 2.2 seconds tak glow karti hai.

### B. Tab Strip & Filters (\`H(tab, brandFilter)\`)
1. **\`mine\` ("Waiting for me" / "To review")**:
   - Wo posts jo pending hain aur jinke brand par current user approver hai (excluding posts written by self).
2. **\`pending\` ("All pending")**:
   - Workspace ke sabhi pending posts.
3. **\`changes\` ("Changes requested")**:
   - Wo posts jinpar approvers ne revisions maange hain.
4. **\`submitted\` ("My submissions")**:
   - Current user ke apne drafts jo approval ke intezaar mein hain.
5. **\`approved\` ("Recently approved")**:
   - Pichhle 14 dino mein approve hue posts.

### C. Post Card Components (\`Be(e)\` & \`Ge(e)\`)
- **Media Carousel (\`Be\`)**:
  - Multiple images ke liye dynamic dots (\`.ap-dot\`) pagination.
  - Text-only posts ke liye clean fallback layout.
- **Due Time Calculation (\`Ve\`)**:
  - Due time logic: \`"Goes out: Tomorrow 4:00 PM"\` (Pine green), \`"Due soon"\` (Butter yellow), \`"Was due"\` (Coral red alert).
- **Target Channels (\`Ee\`)**:
  - Social network badges (Instagram, X, Facebook, LinkedIn, TikTok, etc.).
- **Author & Approver Badges (\`.ap-people\`)**:
  - "Written by" creator avatar + name.
  - "Can approve" approvers list ("You", "Elise or Haruto").
- **Review History Audit Trail (\`He\`)**:
  - Har card par chronologically listed audit steps: kisne kab submit kiya, kisne kya feedback diya.

### D. Interactive Actions & Physics Animations

#### 1. Instant Approve (\`ot(postId)\`)
- Card par **\`.ap-stamp\`** rubber stamp bounce animation chalti hai (\`scale: 1.4 -> 1\`).
- Stamp text: \`"Approved" · [Reviewer Name] · [Date/Time]\`.
- Post ka status \`status = 'scheduled'\` ban jata hai.
- Author ko notice dispatch hota hai aur screen par **Undo Toast** render hota hai.

#### 2. Request Changes (\`lt(postId)\` & \`ut(postId, note)\`)
- Dialog modal open hota hai jisme **Quick Suggestion Chips** hote hain:
  - \`Swap the photo\`, \`Shorten the caption\`, \`Check the price\`, \`Add the link\`, \`Fix the hashtags\`, \`Move the time\`.
- Submit karne par **3D Card Flip Animation** chalti hai:
  - GSAP \`to(card, { rotationY: 90, transformPerspective: 1400 })\`.
  - Coral-red back face \`.ap-back\` reveal hota hai jisme approver ka note aur avatar dikhta hai.
  - Card slide-down hokar list se smoothly exit kar jata hai.
- Status \`status = 'changes'\` set ho jata hai.

#### 3. Floating Bulk Action Dock (\`data-bulk\` & \`st()\`)
- Multi-card selection par bottom dock slide-up hota hai: \`"3 selected"\`.
- **Approve selected** dabane par sabhi selected cards par staggered rubber-stamp animation chal kar sare posts ek sath approve ho jaate hain.

#### 4. Native Multi-Network Preview Drawer (\`Gl(e)\` & \`xl(...)\`)
- Card par double-click karne ya "Open" dabane par right sliding drawer khulta hai jo exact **Pixel-Perfect Native UI** dikhata hai:
  - **Instagram Feed**: Profile pic, handle, post media carousel, like/comment/share icons, caption, first comment hashtags.
  - **X (Twitter)**: Handle, verified badge, tweet body, retweet/like counts.
  - **LinkedIn**: Company page header, follower count, body text with "...see more", reaction icons.
  - Segmented tab switch karne par live GSAP cross-fade hota hai.

---

## 8. Module Deep-Dive 2: Overview View (\`#/overview\`)

- **Needs You Widget**: Urgent action center (Pending sign-offs, requested changes, failed posts, disconnected channel tokens).
- **Up Next Widget**: Agle 24 ghante mein kaunsa post live hoga uska live countdown ticker.
- **Audience Growth Mini-Chart**: 30-day aur 90-day follower growth curve.
- **The Week Ahead**: Monday se Sunday tak har din kitne posts scheduled hain uska visual load matrix.
- **Network Pulse**: Sare connected accounts ka live connection health status.

---

## 9. Module Deep-Dive 3: Compose View (\`#/compose\`)

- **Multi-Channel Publisher**: Ek sath 8 networks select karke post likhne ki suvidha.
- **Live Character Limits Engine**: X (280 chars), Threads (500 chars), Instagram (2,200 chars) ke liye live warnings aur counters.
- **Smart Scheduling Heatmap Algorithm (\`Vs\`, \`Hs\`)**:
  - Algorithm pichhle engagement data ke hisaab se 3 sabse best posting times auto-calculate karta hai (e.g. "Tuesday 6:00 PM - High Reach").
- **First Comment Tool**: Hashtags ko caption ke bajaye Instagram first comment mein schedule karne ka feature.

---

## 10. Module Deep-Dive 4: Calendar View (\`#/calendar\`)

- **Interactive Calendar Views**: Month grid, Week view, Day timeline.
- **Drag-and-Drop Rescheduling**: Post card ko mouse/touch se drag karke kisi doosre din ya time slot par drop karne par uska \`post.at\` timestamp auto-update ho jata hai.
- **Multi-Dimension Filters**: Filter by brand, social network, post status, and campaign tag.

---

## 11. Module Deep-Dive 5: Inbox View (\`#/inbox\`)

- **Unified Social Conversations**: 8 alag-alag apps ke comments, DMs, aur mentions ek 2-pane interface mein.
- **AI Sentiment Analysis Engine**: Har conversation par auto-tag: \`Positive\` (Green), \`Neutral\` (Gray), \`Negative\` (Red alert).
- **Team Assignment**: Conversation ko kisi bhi member ko assign karna.
- **Canned Responses**: Quick keyboard snippets se pre-saved replies bhejna.

---

## 12. Module Deep-Dive 6: Analytics & Charts Engine (\`#/analytics\`)

- **Custom SVG Chart Engine (\`charts-Cm206kS9.js\`)**:
  - Sirf 167 lines ka lightweight custom SVG charting engine (bina kisi external library ke).
  - Bezier curve interpolation, dynamic gridlines, vertical crosshair, hover tooltips, aur ResizeObserver integration.
- **Best Time to Post 7x24 Heatmap Grid**: 7 din x 24 ghante ki intensity matrix.
- **Content Mix Donut Chart**: Photos, Videos, Carousels aur Text ka visual proportion.
- **PDF / CSV Export**: Instant report generation.

---

## 13. Module Deep-Dive 7: Listening View (\`#/listening\`)

- **Brand & Web Listening**: Brand names, competitor handles aur industry hashtags ka live stream.
- **Share of Voice**: Competitors ke muqable aapke brand ki charcha ka percentage share.
- **Trending Terms Word Cloud**: Is hafte ke high-velocity keywords.

---

## 14. Module Deep-Dive 8: Library View (\`#/library\`)

- **4 Dedicated Shelves**:
  1. **Media**: High-res images aur videos, dimensions aur file size tags ke sath. Batch select karke "Use in post" bheja ja sakta hai.
  2. **Templates**: Reusable post blueprints placeholders ke sath: \`{service} on a {car}. {hours} hours in the bay.\`
  3. **Hashtag Sets**: Curated hashtag sets (e.g. \`#detailing #ceramiccoating\`).
  4. **Saved Replies**: Customer support canned responses.

---

## 15. Module Deep-Dive 9: Channels View (\`#/channels\`)

- **8 Social Platforms Management**: Instagram, Facebook, X, LinkedIn, TikTok, YouTube, Pinterest, Threads.
- **Token Health & Expiry Alerts**: OAuth token disconnect hone par ya expire hone se 3 din pehle warning.
- **1-Click Reconnect**: Direct re-authentication flow.

---

## 16. Module Deep-Dive 10: Team & Roles View (\`#/team\`)

- **Member Roster**: Team members list, active roles, assigned brands, MFA status, last active time.
- **Role Permissions Matrix**: Visual matrix table jo har role ke rights ko inspect karta hai.
- **Invite Member Modal**: Email, role aur brand access set karke invite bhejna.

---

## 17. Module Deep-Dive 11: Settings View (\`#/settings\`)

- **Workspace Profile**: Name, time zone (\`Europe/Lisbon\`), week start day.
- **Approval Rule Policy**:
  - \`perm\`: Default rule (jin users ke paas \`post.publish\` nahi hai sirf unhe sign-off chahiye).
  - \`always\`: Strict agency policy (har post approve hona mandatory hai).
  - \`off\`: Direct publishing.
- **Theme Switcher**: Dark Mode, Light Mode, System Theme.
- **Data Reset**: 1-click seed reset button jo pura demo mock data restore kar deta hai.

---

## 18. Asset Chunks Inventory & File Structure

Humne demo application ke sabhi **23 production chunks** ko download aur format karke local disk par extract kar liya hai:

| File Name | Chunks Type | Lines Count | Description |
| :--- | :--- | :--- | :--- |
| \`index.html\` | Shell | 155 lines | Base markup, head script, navigation bars, modals |
| \`index.css\` | Styles | 1,500+ lines | Global tokens, reset, typography, dock, layout |
| \`index.js\` | Core Engine | 4,172 lines | GSAP 3.15 + Flip, Reactive Store Y, Router |
| \`approvals-9_LkHnvX.js\` | View Chunk | 803 lines | Approvals queue, rubber stamp, 3D flip card |
| \`approvals-CaOosbas.css\` | View CSS | 16,401 bytes | Approvals card layout, bulk bar, stamp styles |
| \`compose-DcEkompt.js\` | View Chunk | 1,559 lines | Multi-network composer, character limits, scheduler |
| \`calendar-dC-sZzXf.js\` | View Chunk | 1,297 lines | Drag-and-drop publishing calendar |
| \`inbox-Czp4FX5r.js\` | View Chunk | 1,460 lines | Unified social inbox, sentiment tagging |
| \`analytics-CqzZ4ABz.js\` | View Chunk | 832 lines | Metrics, KPI cards, heatmap |
| \`charts-Cm206kS9.js\` | Chart Engine | 167 lines | Lightweight native SVG chart renderer |
| \`listening-CzGtIEnV.js\` | View Chunk | 814 lines | Social listening & brand mentions stream |
| \`library-CKQOu0xM.js\` | View Chunk | 1,103 lines | Media assets, templates, hashtags, replies |
| \`channels-CluNZ7pp.js\` | View Chunk | 852 lines | Connected social accounts & OAuth health |
| \`team-BzN6aZIm.js\` | View Chunk | 1,378 lines | Members directory, permissions matrix |
| \`settings-De7NLl3t.js\` | View Chunk | 999 lines | Workspace settings, approval rules, theming |
| \`overview-C5kP9O_e.js\` | View Chunk | 417 lines | Dashboard overview, "Needs you" widget |

---

*End of Murmura Project Technical Documentation.*
`;

// Save Markdown documentation
const mdPath = path.join(workspaceDir, 'MURMURA_COMPLETE_DOCUMENTATION.md');
fs.writeFileSync(mdPath, markdownContent, 'utf8');
console.log('Saved Markdown documentation:', mdPath);

// Create an enterprise Word-compatible HTML .doc file with styling, colors, tables, callouts
const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Murmura Social Media Suite - Complete Technical Architecture Documentation</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
  margin: 40px;
  background-color: #ffffff;
}
h1 {
  font-size: 26pt;
  color: #0f172a;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 12px;
  margin-top: 24pt;
}
h2 {
  font-size: 18pt;
  color: #1e293b;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 8px;
  margin-top: 20pt;
}
h3 {
  font-size: 14pt;
  color: #334155;
  margin-top: 14pt;
}
p, li {
  font-size: 11pt;
  color: #334155;
}
code {
  font-family: Consolas, 'Courier New', monospace;
  background-color: #f1f5f9;
  color: #0f172a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10pt;
}
pre {
  background-color: #0f172a;
  color: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 9.5pt;
  line-height: 1.45;
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  font-size: 10pt;
}
th {
  background-color: #1e293b;
  color: #ffffff;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  text-align: left;
}
td {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  color: #334155;
}
tr:nth-child(even) {
  background-color: #f8fafc;
}
.callout {
  background-color: #f0fdf4;
  border-left: 5px solid #22c55e;
  padding: 14px 18px;
  margin: 16px 0;
  border-radius: 4px;
}
.callout-warning {
  background-color: #fffbeb;
  border-left: 5px solid #f59e0b;
  padding: 14px 18px;
  margin: 16px 0;
  border-radius: 4px;
}
.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 9pt;
  font-weight: bold;
}
.badge-pine { background-color: #dcfce7; color: #15803d; }
.badge-coral { background-color: #fee2e2; color: #b91c1c; }
.badge-butter { background-color: #fef3c7; color: #b45309; }
.badge-sea { background-color: #e0f2fe; color: #0369a1; }
</style>
</head>
<body>

<h1>Murmura Social Media Suite - Complete Technical Architecture & Code Documentation</h1>

<div class="callout">
<b>Project Source URL:</b> <a href="https://demo.codeandchill.store/murmura/#/approvals">https://demo.codeandchill.store/murmura/#/approvals</a><br>
<b>Target Workspace:</b> c:\\xampp\\htdocs\\V.S Adda<br>
<b>Documentation Type:</b> Deep Line-by-Line Architecture, State Engine, RBAC, All Pages & Functionality<br>
<b>Language:</b> Hinglish (Technical Hindi-English)
</div>

<h2>1. Executive Summary & High-Level Overview</h2>
<p><b>Murmura</b> ek enterprise-grade, high-performance social media management workspace hai jo agencies aur marketing teams ke liye design kiya gaya hai.</p>
<ul>
  <li><b>Multi-Brand Workspace:</b> Ek hi dashboard se 4 client brands (Vantage Garage, Ember & Oak, Hollow Home, Wildroot Botanicals) ko handle karna.</li>
  <li><b>8 Integrated Social Networks:</b> Instagram, Facebook, X (Twitter), LinkedIn, TikTok, YouTube, Pinterest, aur Threads ka centralized publishing, analytics aur inbox.</li>
  <li><b>Strict Approval Workflows:</b> Drafts ko bina client ya manager ke sign-off ke live hone se rokna, real-time feedback notes dena, aur audit logging maintain karna.</li>
  <li><b>Ultra-Fast Performance:</b> Pure Vanilla JS aur GSAP micro-animations ke sath zero lag aur zero framework overhead.</li>
</ul>

<h2>2. Core Architecture & Tech Stack</h2>
<p>Murmura kisi heavy framework (jaise React ya Vue) par nahi bana hai. Yeh modern native web standards par built hai:</p>
<ul>
  <li><b>Vite (Dynamic Code-Splitting):</b> Initial entry point <code>index.js</code> sirf ~200 KB ka hai. Har page alag dynamic chunk (<code>__vite__mapDeps</code>) ke roop mein split hai.</li>
  <li><b>GSAP 3.15.0 + Flip Plugin:</b> Micro-animations, dynamic tab pill physics, 3D card flips (<code>rotationY: 90deg</code>), aur rubber-stamp bounce animations GSAP se chalti hain.</li>
  <li><b>CSS Tokens System:</b> Vanilla CSS variables (<code>--cream</code>, <code>--ink</code>, <code>--pine</code>, <code>--coral</code>, <code>--butter</code>, <code>--sea</code>, <code>--lilac</code>).</li>
  <li><b>Instant Pre-Paint Theme Script:</b> <code>index.html</code> ke head mein inline script hoti hai jo DOM paint se pehle <code>localStorage</code> se theme load karke set karti hai taaki zero color flash ho.</li>
</ul>

<h2>3. Global State Management & Reactive Store (Y)</h2>
<p>Poora data ek single global JavaScript object <code>Y</code> mein rehta hai, jo <code>localStorage</code> key <code>'murmura:v1'</code> ke sath 2-way sync rehta hai:</p>
<pre>
Y = {
  version: 1,
  session: { userId: "m-camila" },
  brands: [ ... ],       // 4 Brands metadata
  channels: [ ... ],     // 8 Social networks connected handles
  posts: [ ... ],        // Posts array with reviews, media, status
  campaigns: [ ... ],    // Marketing campaigns
  convos: [ ... ],       // Social inbox conversations
  replies: [ ... ],      // Saved canned responses
  assets: [ ... ],       // Media library images and videos
  hashtags: [ ... ],     // Reusable hashtag sets
  templates: [ ... ],    // Dynamic post templates ({date}, {car}, {service})
  keywords: [ ... ],     // Listening keywords
  mentions: [ ... ],     // Social mentions with sentiment
  competitors: [ ... ],  // Benchmarking competitor statistics
  members: [ ... ],      // Workspace users and roles
  roles: [ ... ],        // Role definitions and permission arrays
  audit: [ ... ],        // 200 items audit history trail
  notices: [ ... ],      // In-app notifications
  settings: {
    workspace: "Northlight Studio",
    timezone: "Europe/Lisbon",
    weekStart: 1,
    approval: "perm",    // 'perm' | 'always' | 'off'
    shortenLinks: true,
    utm: true,
    plan: "agency",
    seats: 15
  },
  ui: { brand: "all" }
}
</pre>

<h3>Reactivity Implementation:</h3>
<ul>
  <li><code>as(...keys)</code>: State mutate karke <code>localStorage</code> mein save karta hai aur sabhi registered view subscribers ko notify karta hai.</li>
  <li><code>rs(key, fn)</code>: View ko specific state key par listen karne ki suvidha deta hai.</li>
  <li><code>ns(fn)</code>: Page unmount hone par automatically sabhi event listeners aur subscriptions ko clean karta hai (Garbage collection).</li>
</ul>

<h2>4. Role-Based Access Control (RBAC) & Permissions Matrix</h2>
<table>
  <tr><th>Permission Name</th><th>Meaning & Capabilities</th></tr>
  <tr><td><code>post.create</code></td><td>Naye posts draft karna, media attach karna, schedule banana</td></tr>
  <tr><td><code>post.approve</code></td><td>Pending posts ko <b>Approve</b> karna ya <b>Request Changes</b> bhejna</td></tr>
  <tr><td><code>post.publish</code></td><td>Posts ko force <b>Publish Now</b> karna ya schedule override karna</td></tr>
  <tr><td><code>inbox.reply</code></td><td>Customer messages aur comments ka reply dena</td></tr>
  <tr><td><code>inbox.assign</code></td><td>Inbox conversations kisi team member ko assign karna</td></tr>
  <tr><td><code>analytics.view</code></td><td>Analytics graphs aur engagement reports dekhna</td></tr>
  <tr><td><code>listening.manage</code></td><td>Brand listening keywords monitor karna aur competitors add karna</td></tr>
  <tr><td><code>team.manage</code></td><td>Team members ko invite karna, unke roles modify karna</td></tr>
  <tr><td><code>channels.manage</code></td><td>Social accounts connect ya disconnect karna</td></tr>
</table>

<h2>5. Module Deep-Dive: Approvals Engine (#/approvals)</h2>
<p>Yeh Murmura ka core module hai jiska code <code>approvals-9_LkHnvX.js</code> aur <code>approvals-CaOosbas.css</code> mein hai:</p>

<h3>A. Tabs & Filter System:</h3>
<ul>
  <li><code>mine</code> (Waiting for me / To review): Wo posts jo pending hain aur user jinka approver hai.</li>
  <li><code>pending</code> (All pending): Workspace ke sabhi pending posts.</li>
  <li><code>changes</code> (Changes requested): Wo posts jinpar revisions maange gaye hain.</li>
  <li><code>submitted</code> (My submissions): Current user ke apne likhe hue pending posts.</li>
  <li><code>approved</code> (Recently approved): Pichhle 14 dino mein approve hue posts.</li>
  <li><b>Brand Chips Filter:</b> Toolbar mein brand pills jinse instant client-level filtering hoti hai.</li>
</ul>

<h3>B. Post Card Components:</h3>
<ul>
  <li><b>Media Carousel:</b> Multiple photos ke liye dots pagination (<code>.ap-dot</code>). Text-only post ke liye clean note layout.</li>
  <li><b>Due Date Indicator:</b> Due time ke hisaab se dynamic badge: <code>"Goes out: Tomorrow 4:00 PM"</code>, <code>"Due soon"</code>, <code>"Was due"</code>.</li>
  <li><b>Target Network Icons:</b> Targeted platforms (Instagram, X, Facebook, LinkedIn, TikTok, Threads).</li>
  <li><b>Author & Approver Badges:</b> Creator name aur un approvers ke avatars jo sign-off kar sakte hain.</li>
  <li><b>Review History Audit Trail:</b> Card ke andar past review steps, timestamp, aur approver ka quote note: <code>&lt;q&gt;"Lead with the price."&lt;/q&gt;</code>.</li>
</ul>

<h3>C. Interactive Workflows & Physics Animations:</h3>
<ul>
  <li><b>Instant Approve:</b> Card par physical rubber stamp animation chalti hai (<code>.ap-stamp</code> scale: 1.4 -> 1). Status <code>scheduled</code> set hota hai, author ko notification milta hai, aur floating Undo Toast render hota hai.</li>
  <li><b>Request Changes:</b> Modal khulta hai jisme quick suggestion chips hote hain (<i>Swap the photo, Shorten the caption, Check the price, Add the link, Fix the hashtags, Move the time</i>). Submit par card <b>3D Flip</b> (<code>rotationY: 90deg</code>) karta hai coral-red back face ke sath aur list se exit ho jata hai.</li>
  <li><b>Bulk Approval:</b> Multiple cards select karne par floating bar slide-up hoti hai (<code>"3 selected"</code>). Approve selected dabane par sabhi posts ek sath approve ho jate hain.</li>
  <li><b>Native Social Preview Drawer:</b> Card par double-click karne par right drawer khulta hai jisme Instagram, X, LinkedIn aur Facebook ka pixel-perfect native preview render hota hai.</li>
</ul>

<h2>6. Summary of All Other Modules</h2>
<ul>
  <li><b>Overview (<code>#/overview</code>):</b> Urgent action center ("Needs you"), upcoming live queue ticker ("Up next"), audience growth mini-charts, the week ahead publishing load matrix.</li>
  <li><b>Compose (<code>#/compose</code>):</b> 8 social networks multi-publisher, network-specific character counters, media uploader, smart scheduling heatmap algorithm (<code>Vs</code>, <code>Hs</code>), Instagram first comment scheduler.</li>
  <li><b>Calendar (<code>#/calendar</code>):</b> Month, week aur day views, pointer-event drag-and-drop rescheduling, brand/network/campaign filters.</li>
  <li><b>Inbox (<code>#/inbox</code>):</b> Unified social messages across 8 networks, AI sentiment analysis (Positive, Neutral, Negative), team assignment, canned quick responses.</li>
  <li><b>Analytics (<code>#/analytics</code> + <code>charts.js</code>):</b> 167-line custom native SVG chart engine, Bezier curve plotting, 7x24 engagement heatmap grid, content mix donut chart, CSV/PDF export.</li>
  <li><b>Listening (<code>#/listening</code>):</b> Real-time brand mentions stream, sentiment timeline, share of voice competitor breakdown, trending terms.</li>
  <li><b>Library (<code>#/library</code>):</b> 4 shelves (Media assets, Templates, Hashtag sets, Saved replies), batch selection & "Use in post" workflow.</li>
  <li><b>Channels (<code>#/channels</code>):</b> 8 social networks hub, token health & expiry alerts, 1-click reconnect, channel statistics.</li>
  <li><b>Team & Roles (<code>#/team</code>):</b> Members directory, permissions matrix table, brand access scope, invite modal.</li>
  <li><b>Settings (<code>#/settings</code>):</b> Workspace configuration, approval workflow policies (<code>perm</code>, <code>always</code>, <code>off</code>), theme toggle, demo seed reset.</li>
</ul>

<h2>7. Asset Chunks Inventory & File Structure</h2>
<table>
  <tr><th>File Name</th><th>Type</th><th>Size / Lines</th><th>Description</th></tr>
  <tr><td><code>index.html</code></td><td>Shell</td><td>155 lines</td><td>Base layout, head script, navigation bars, modals</td></tr>
  <tr><td><code>index.css</code></td><td>Global Styles</td><td>1,500+ lines</td><td>Design tokens, typography, dock, layout styles</td></tr>
  <tr><td><code>index.js</code></td><td>Core Engine</td><td>4,172 lines</td><td>GSAP 3.15 + Flip, Reactive Store Y, Hash Router</td></tr>
  <tr><td><code>approvals-9_LkHnvX.js</code></td><td>View Chunk</td><td>803 lines</td><td>Approvals queue, rubber stamp, 3D card flip</td></tr>
  <tr><td><code>approvals-CaOosbas.css</code></td><td>View CSS</td><td>16 KB</td><td>Approvals card layout, bulk bar, stamp styles</td></tr>
  <tr><td><code>compose-DcEkompt.js</code></td><td>View Chunk</td><td>1,559 lines</td><td>Multi-channel composer, scheduler, character limits</td></tr>
  <tr><td><code>calendar-dC-sZzXf.js</code></td><td>View Chunk</td><td>1,297 lines</td><td>Drag-and-drop publishing calendar</td></tr>
  <tr><td><code>inbox-Czp4FX5r.js</code></td><td>View Chunk</td><td>1,460 lines</td><td>Unified social inbox, sentiment tagging</td></tr>
  <tr><td><code>analytics-CqzZ4ABz.js</code></td><td>View Chunk</td><td>832 lines</td><td>Metrics, KPI cards, heatmap</td></tr>
  <tr><td><code>charts-Cm206kS9.js</code></td><td>Chart Engine</td><td>167 lines</td><td>Lightweight native SVG chart renderer</td></tr>
  <tr><td><code>listening-CzGtIEnV.js</code></td><td>View Chunk</td><td>814 lines</td><td>Social listening & brand mentions stream</td></tr>
  <tr><td><code>library-CKQOu0xM.js</code></td><td>View Chunk</td><td>1,103 lines</td><td>Media assets, templates, hashtags, replies</td></tr>
  <tr><td><code>channels-CluNZ7pp.js</code></td><td>View Chunk</td><td>852 lines</td><td>Connected social accounts & OAuth health</td></tr>
  <tr><td><code>team-BzN6aZIm.js</code></td><td>View Chunk</td><td>1,378 lines</td><td>Members directory, permissions matrix</td></tr>
  <tr><td><code>settings-De7NLl3t.js</code></td><td>View Chunk</td><td>999 lines</td><td>Workspace settings, approval rules, theming</td></tr>
  <tr><td><code>overview-C5kP9O_e.js</code></td><td>View Chunk</td><td>417 lines</td><td>Dashboard overview, "Needs you" widget</td></tr>
</table>

<p style="margin-top: 30pt; font-size: 9pt; color: #94a3b8; text-align: center;">
<i>Generated by Antigravity AI for Workspace c:\\xampp\\htdocs\\V.S Adda</i>
</p>

</body>
</html>`;

const docPath = path.join(workspaceDir, 'Murmura_Full_Project_Documentation.doc');
fs.writeFileSync(docPath, docHtml, 'utf8');
console.log('Saved Word-compatible DOC file:', docPath);
