# 05 - MASTER PROMPT FOR ANTIGRAVITY IDE
# (Copy-paste this entire file as your first message to Antigravity)

---

## CONTEXT — READ BEFORE ANYTHING ELSE

I am building a **production-grade, multi-brand social media management web application** for a client agency.
I have already done deep research based on a reference demo (Murmura — https://demo.codeandchill.store/murmura/) and produced four specification files that live at:

```
c:\xampp\htdocs\V.S Adda\claude\files\01_FRONTEND.md   — React + Vite UI spec, all 11 pages, design tokens, routes, component list
c:\xampp\htdocs\V.S Adda\claude\files\02_BACKEND.md    — Node.js + Express + Prisma + MySQL, full schema, all REST endpoints, jobs, adapters
c:\xampp\htdocs\V.S Adda\claude\files\03_LOGIC.md      — Business rules (source of truth), RBAC matrix, post state machine, approval rules, undo, edge cases
c:\xampp\htdocs\V.S Adda\claude\files\04_SECURE_KEYS.md — Secrets, .env layout, AES-256-GCM encryption, JWT strategy, 2FA, security checklist
```

**READ ALL FOUR FILES IN FULL before writing a single line of code.**
They are the canonical specification. If you see a conflict between your training knowledge and these files, the files win.

---

## WHAT I WANT YOU TO BUILD

### Product Name
**PostDesk** (placeholder — I will supply the real client brand name and colours later via `tokens.css` and `.env`).

### What it is
A SaaS-style agency workspace where:
- Multiple **brands** (client accounts) are managed under one agency login.
- Multiple **social networks** (Instagram, Facebook, X, LinkedIn, TikTok, YouTube, Pinterest, Threads) are published to, monitored, and analysed.
- A strict **content approval workflow** ensures posts are signed off by a manager or client before going live.
- A **unified inbox** handles all comments, DMs, and mentions in one place.
- **Analytics** and **Brand listening** give data-driven insights.

---

## TECH STACK (do not change without asking me)

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript (strict), Vite, React Router v6, TanStack Query v5, Zustand, Tailwind CSS + CSS variables, Framer Motion |
| Backend | Node.js 20 LTS + TypeScript (strict), Express 4, Prisma ORM |
| Database | **MySQL 8** (already running in XAMPP on this machine) |
| Auth | JWT (memory) + rotating httpOnly refresh cookie, argon2id passwords, TOTP 2FA |
| Jobs | DB-backed queue (`jobs` table, `FOR UPDATE SKIP LOCKED`), node-cron — **no Redis** |
| Real-time | Server-Sent Events (`/api/events`) |
| Uploads | multer -> local disk (dev), S3-compatible (prod) |
| Email | nodemailer (dev: Mailpit on localhost:1025) |
| Monorepo | `apps/web/`, `apps/api/`, `packages/shared/` |

---

## HOW TO START — BUILD ORDER

Follow this exact order. **Complete each step fully, run it, confirm it works, then move to the next.**
Do NOT skip ahead or combine steps.

### PHASE 1 — SCAFFOLD (do this first)
```
Step 1.1  Init monorepo with pnpm workspaces (root package.json + pnpm-workspace.yaml)
Step 1.2  Create apps/api with tsconfig, nodemon, pino logger, health endpoint GET /health
Step 1.3  Create apps/web with Vite + React + TS, Tailwind, CSS token variables from 01_FRONTEND.md §2
Step 1.4  Create packages/shared (permissions.ts, roles.ts, networkLimits.ts, schemas/)
Step 1.5  Add .env.example (exact content from 04_SECURE_KEYS.md §2). Create .gitignore.
Step 1.6  Connect MySQL: test DATABASE_URL, run `npx prisma db push` with the FULL schema from 02_BACKEND.md §3
Step 1.7  Run prisma seed (02_BACKEND.md §11): 1 workspace, 4 brands, 7 users (one per role), mock channels, 60 posts, reviews
```

### PHASE 2 — AUTH (must be rock-solid before any feature)
```
Step 2.1  POST /auth/login — email+password, brute-force lockout (5 attempts / 15 min)
Step 2.2  POST /auth/refresh — rotating refresh token, reuse detection (revoke family)
Step 2.3  POST /auth/logout
Step 2.4  GET /me — returns user profile, permissions[], brandIds[], workspace info
Step 2.5  JWT access token middleware + tenant middleware (loads membership -> req.ctx)
Step 2.6  rbac middleware (permission check + brand scope)
Step 2.7  Login UI screen, session persistence, API client with single-flight token refresh
Step 2.8  Accept invite flow: GET + POST /auth/invite/:token/accept (name + password)
Step 2.9  Forgot/reset password
Step 2.10 TOTP 2FA setup + login challenge (04_SECURE_KEYS.md §7)
```

### PHASE 3 — APPROVALS (priority module — client's main use case)
```
Step 3.1  GET /approvals?tab=mine|pending|changes|submitted|approved (all filter logic from 03_LOGIC.md §4-5)
Step 3.2  GET /approvals/summary (counts, oldest age, avg time to approve)
Step 3.3  POST /approvals/:postId/approve (with Undo token, self-approval blocked, optimistic update)
Step 3.4  POST /approvals/:postId/request-changes (required note, quick chips, 3D card flip animation)
Step 3.5  POST /approvals/bulk-approve ({postIds[]}, per-item result, never all-or-nothing)
Step 3.6  POST /posts/:id/undo (8-second window, all rules from 03_LOGIC.md §6)
Step 3.7  Approvals page UI: tabs, brand chips, post cards, bulk select bar, rule panel sidebar
Step 3.8  Post detail drawer: per-network live preview, full review history, action buttons
```

### PHASE 4 — COMPOSE & POST LIFECYCLE
```
Step 4.1  POST /posts (create DRAFT), GET/PUT/DELETE /posts/:id
Step 4.2  POST /posts/:id/submit, /withdraw, /schedule, /publish-now, /retry, /reschedule
Step 4.3  PUT /posts/:id editing rules (version bump, re-approval logic from 03_LOGIC.md §5)
Step 4.4  POST /validate-post (per-network validation, networkLimits.ts, grapheme counting)
Step 4.5  Compose UI: multi-network picker, caption editor, char counters, media uploader, preview tabs, When panel
```

### PHASE 5 — CALENDAR
```
Step 5.1  GET /calendar?from=&to=&brandId= (posts + campaigns)
Step 5.2  GET /best-times (heatmap algorithm from 03_LOGIC.md §10)
Step 5.3  Calendar UI: week/month/list views, drag-and-drop reschedule (dnd-kit), filters
```

### PHASE 6 — INBOX
```
Step 6.1  GET /inbox/conversations (all filters), GET :id, POST :id/reply, PATCH :id
Step 6.2  POST /webhooks/:network (HMAC verify, enqueue syncInbox)
Step 6.3  Inbox UI: 2-pane layout, sentiment, assign, saved-reply picker, SSE live updates
```

### PHASE 7 — ANALYTICS
```
Step 7.1  GET /analytics/* endpoints (summary, growth, heatmap, content-mix, top-posts, export)
Step 7.2  MetricDaily sync job (hourly), best-time algorithm
Step 7.3  Analytics UI: KPI strip, charts (Recharts), heatmap (custom CSS grid), export CSV
```

### PHASE 8 — REMAINING MODULES (in this order)
```
Step 8.1  Overview page (aggregated dashboard, "Needs you" widget, Up next, Week ahead)
Step 8.2  Listening (keywords, mentions stream, SOV, trending, sentiment-over-time)
Step 8.3  Library (media upload+EXIF strip, templates, hashtag sets, saved replies)
Step 8.4  Channels (OAuth flow mock->real, health check, reconnect, posting toggle)
Step 8.5  Team (members, invites, roles matrix, audit log, 2FA coverage card)
Step 8.6  Settings (all tabs from 01_FRONTEND.md §6.11, approval rule engine)
```

### PHASE 9 — SCHEDULER & JOBS
```
Step 9.1  Scheduler tick every 30s (03_LOGIC.md §7, SKIP LOCKED query)
Step 9.2  publishTarget job handler (token decrypt, adapter.publish, retry backoff 1/5/15 min)
Step 9.3  Mock adapter (NETWORK_MODE=mock): instant fake publish, random metrics
Step 9.4  syncMetrics hourly, checkChannelHealth, refreshToken daily, weeklyReport, cleanup
Step 9.5  SSE hub (/api/events) — push notifications to connected clients
```

### PHASE 10 — POLISH & SHIP
```
Step 10.1 Real social network adapters (start with LinkedIn, then Meta/Instagram/Facebook)
Step 10.2 Notifications (in-app + email, all events from 03_LOGIC.md §14)
Step 10.3 Command palette (Ctrl+K), global search GET /search?q=
Step 10.4 Short-link redirect (/s/:code) with click tracking (03_LOGIC.md §15)
Step 10.5 UTM auto-append at publish time (never mutate stored caption)
Step 10.6 Responsive layout audit (360px, 768px, 1280px+)
Step 10.7 Accessibility audit (WCAG 2.1 AA, keyboard, ARIA)
Step 10.8 Security checklist (04_SECURE_KEYS.md §12) — run every item before launch
Step 10.9 Write unit + integration tests (02_BACKEND.md §12)
Step 10.10 Production build, Dockerfile, deploy to client's hosting (VPS/Render/Railway)
```

---

## CRITICAL RULES — FOLLOW ALWAYS

### Security (non-negotiable)
1. Access token in **memory only** (Zustand) — NEVER localStorage or sessionStorage.
2. Refresh token in **httpOnly + Secure + SameSite=Strict cookie only**.
3. OAuth tokens and TOTP secrets **AES-256-GCM encrypted at rest** (04_SECURE_KEYS.md §4) — NEVER plaintext in DB.
4. Every backend query **MUST include workspaceId AND brandId scope** (tenantScope from 03_LOGIC.md §2). No exceptions.
5. Resource outside tenant scope returns **404** (not 403) — prevents ID probing.
6. Self-approval blocked **on the server** (not just UI) — unit test required.
7. Upload: magic bytes check + EXIF strip with sharp before storing.
8. Never log tokens, passwords, or raw network payloads.
9. Webhook HMAC verified on **raw body** before JSON.parse.

### Architecture
10. All business rules live in `packages/shared` — shared by web and API, single source of truth.
11. Permission checks use `<PermissionGate perm="post.approve">` in UI AND rbac middleware in API — both must pass.
12. All timestamps stored as UTC in DB; converted to workspace timezone only in the view layer.
13. Optimistic updates with TanStack Query for: approve, request-changes, reschedule, assign, flag, toggle.
14. Every list endpoint uses cursor pagination (not page numbers).
15. SSE client invalidates TanStack Query cache keys on `post.updated`, `inbox.message`, `channel.status`, `notification`.

### Code Quality
16. TypeScript strict mode everywhere — no `any`, no `as unknown`.
17. Zod schemas in `packages/shared/schemas/` — used for both API validation AND frontend form validation.
18. All user-visible strings through a `t()` helper (English v1, i18n-ready).
19. Every page must have: loading (skeleton), empty, error (with retry), and no-permission states.
20. DO NOT copy code, CSS, icons, or text from the Murmura demo. Build original. Spec is mine.

---

## DESIGN SYSTEM BRIEF (from 01_FRONTEND.md §2)

```css
/* Light mode defaults */
--bg: #F7F8FA;         /* App background */
--surface: #FFFFFF;    /* Cards */
--surface-2: #F0F2F5;  /* Secondary surfaces */
--border: #E3E6EB;
--text: #0F172A;
--text-muted: #5B6472;
--accent: #4F46E5;     /* REPLACE with client brand colour */
--success: #15803D;    /* Approved / Published */
--warning: #B45309;    /* Pending / Due soon */
--danger: #B91C1C;     /* Changes requested / Failed */
--info: #0369A1;       /* Scheduled */
```

Status badge colours (single source of truth — never deviate):
- DRAFT -> muted/gray
- PENDING -> warning/amber "Awaiting approval"
- CHANGES -> danger outline/red "Changes requested"
- SCHEDULED -> info/blue "Scheduled"
- PUBLISHED -> success/green "Published"
- FAILED -> danger solid/red "Needs attention"

---

## LOCAL DEVELOPMENT SETUP

```
OS: Windows 11
Shell: PowerShell
XAMPP: MySQL running on localhost:3306, Apache NOT needed
Node: v23.11.0
Package manager: pnpm (preferred) or npm

Start commands (run in two terminals):
  Terminal 1 (API):  cd apps/api && npm run dev      # Express on :4000
  Terminal 2 (Web):  cd apps/web && npm run dev      # Vite on :5173

Database:
  Name: postdesk
  Charset: utf8mb4
  Collation: utf8mb4_unicode_ci
  User: root (XAMPP default, no password locally)

Dev email: Install Mailpit -> http://localhost:8025 (catches all outgoing emails)
```

---

## CLIENT-SPECIFIC CUSTOMISATIONS (fill in before starting)

Replace these placeholders once the client confirms:

| Placeholder | Where | What to replace with |
|---|---|---|
| `PostDesk` | App name everywhere | Client's actual product name |
| `#4F46E5` (--accent) | tokens.css | Client's primary brand hex colour |
| `Northlight Studio` | Default workspace name in seed | Client's agency name |
| `yourdomain.com` | .env EMAIL_FROM, COOKIE_DOMAIN | Client's actual domain |
| `Europe/Lisbon` | Default timezone | Client's timezone (IANA string) |
| `[CONFIRM]` markers | 03_LOGIC.md | Confirm these decisions with client before building |

---

## FIRST THING TO DO RIGHT NOW

1. Read all four spec files completely.
2. Ask me these questions BEFORE writing code:
   a. What is the client's real project/brand name?
   b. What is the primary brand hex colour?
   c. Which hosting platform will the API be deployed to? (Render, Railway, VPS, etc.)
   d. Should I start with NETWORK_MODE=mock (recommended) or do you have OAuth app credentials ready?
   e. Any [CONFIRM] items in 03_LOGIC.md that need to be locked down now?
3. Once I answer, begin Phase 1 Step 1.1.

---

## REFERENCE (do not copy, only use as design/feature inspiration)

Demo URL analysed during research:
https://demo.codeandchill.store/murmura/#/approvals

All code in this project must be ORIGINAL. No template code was purchased or licensed.
The spec files above represent my own analysis and design decisions.
