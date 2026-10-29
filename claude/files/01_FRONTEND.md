# 01 - FRONTEND SPECIFICATION

Working product name: **PostDesk** (placeholder - rename via `{{PROJECT_NAME}}`; client brand colours go in `tokens.css`).
A multi-brand social media management web app for agencies and their clients: compose, approve, schedule, publish, reply, measure.

> Build this as an ORIGINAL implementation. Do not copy code, CSS, copy-text, icons or photos from any third-party template or demo. Features and workflows below are the spec; the visual design is yours (tokens in section 2).

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite |
| Routing | React Router v6 (browser history, not hash) |
| Server state | TanStack Query v5 (cache, retries, optimistic updates) |
| UI state | Zustand (brand filter, theme, command palette, toasts) |
| Styling | Tailwind CSS + CSS variables for tokens (light + dark) |
| Forms | react-hook-form + zod (schemas shared from `packages/shared`) |
| Charts | Recharts (line, bar, donut). Heatmap = custom CSS grid |
| Drag and drop | dnd-kit (calendar rescheduling, drafts to calendar) |
| Dates | date-fns + date-fns-tz (workspace timezone is the source of truth) |
| Icons | lucide-react |
| Motion | Framer Motion, subtle only; respect `prefers-reduced-motion` |
| Tests | Vitest + React Testing Library; Playwright for 5 critical flows |

---

## 2. Design system (original tokens)

All colours are CSS variables on `:root` and `[data-theme="dark"]`. Components never hard-code colours.

```css
:root{
  --bg:#F7F8FA; --surface:#FFFFFF; --surface-2:#F0F2F5; --border:#E3E6EB;
  --text:#0F172A; --text-muted:#5B6472;
  --accent:#4F46E5; --accent-contrast:#FFFFFF;     /* override per client brand */
  --success:#15803D; --warning:#B45309; --danger:#B91C1C; --info:#0369A1;
  --success-bg:#DCFCE7; --warning-bg:#FEF3C7; --danger-bg:#FEE2E2; --info-bg:#E0F2FE;
  --radius-sm:8px; --radius-md:12px; --radius-lg:18px;
  --shadow-card:0 1px 2px rgba(15,23,42,.06),0 4px 16px rgba(15,23,42,.05);
}
[data-theme="dark"]{
  --bg:#0E1116; --surface:#161A21; --surface-2:#1E232C; --border:#2A303B;
  --text:#E8EBF0; --text-muted:#9AA3B2;
  --success-bg:#12301F; --warning-bg:#3A2A0C; --danger-bg:#3B1515; --info-bg:#0C2A3D;
}
```

- Typography: one sans family (Inter or the client's font), scale 12/14/16/20/28/40. Numbers use `tabular-nums`.
- Theme: `light | dark | system`, stored in `localStorage`. An inline script in `index.html` sets `data-theme` before first paint (no colour flash).
- Spacing: 4px grid. Cards: `--radius-lg`, `--shadow-card`, 1px border.
- Status colours (single source of truth, used by badges, calendar blocks, cards):

| Status | Token | Label |
|---|---|---|
| DRAFT | muted | Draft |
| PENDING | warning | Awaiting approval |
| CHANGES | danger (outline) | Changes requested |
| SCHEDULED | info | Scheduled |
| PUBLISHING | info + pulse | Publishing |
| PUBLISHED | success | Published |
| FAILED | danger (solid) | Needs attention |

- Per-brand colour: each brand has `color` (hex). Used for brand chips, calendar left-border, avatar fallback. Always pair colour with a text label (accessibility).
- Network icons: use simple-icons or inline SVG; one `<NetworkIcon network="INSTAGRAM"/>` component.

---

## 3. App shell

- **Top bar**: logo, primary tabs (Overview, Compose, Calendar, Inbox + unread badge, Approvals + pending badge, Analytics, Listening), brand switcher ("All brands" or one brand), notification bell, user menu.
- **Left rail** (desktop only): Search (Ctrl/Cmd+K), New post (N), Library, Channels, Team, Settings, theme toggle. On mobile this becomes a bottom sheet menu.
- **Brand switcher** sets a global `brandFilter` (Zustand, persisted). Every list/query takes it as `brandId` when not "all".
- **Command palette (Ctrl/Cmd+K)**: fuzzy search over pages, posts (caption), conversations (author + text), team members. Debounced, calls `GET /search?q=`.
- **Toasts with Undo**: every destructive or state-changing action (approve, request changes, delete, reschedule) shows a toast with Undo for 8 seconds. Undo calls the inverse API (see Logic file, section 6).
- **Global banners**: failed post alert and channel-expiring alert appear on Overview and Channels.

---

## 4. Routes

| Path | Page | Needs permission |
|---|---|---|
| `/login`, `/forgot-password`, `/reset-password/:token` | Auth | public |
| `/accept-invite/:token` | Accept invite (set name, password, 2FA optional) | public |
| `/overview` | Overview | any member |
| `/compose`, `/compose/:postId` | Composer (new or edit) | `post.create` |
| `/calendar` | Calendar (week, month, list) | any member |
| `/inbox`, `/inbox/:conversationId` | Inbox | `inbox.reply` or read |
| `/approvals`, `/approvals/:postId` | Approvals queue (deep link highlights a card) | `post.approve` or `post.create` |
| `/analytics` | Analytics | `analytics.view` |
| `/listening` | Listening | `listening.manage` (read for others) |
| `/library/media`, `/library/templates`, `/library/hashtags`, `/library/replies` | Library | any member (edit needs `library.manage`) |
| `/channels` | Channels | read: any member; manage: `channels.manage` |
| `/team/members`, `/team/roles`, `/team/audit` | Team | `team.manage` (CLIENT/EDITOR cannot open) |
| `/settings/profile`, `notifications`, `workspace`, `approvals`, `security`, `billing`, `appearance`, `data` | Settings | per tab |

Unauthorised route: redirect to `/overview` with a toast. Unknown route: 404 page.

---

## 5. Auth screens

- **Login**: email + password; if account has 2FA, second step asks a 6-digit TOTP (or a recovery code). Generic error on failure ("Email or password is incorrect"). Show lockout message after 5 failures (server returns 429 + `retryAfter`).
- **Accept invite**: token in URL; shows workspace name, role, brands. Collects full name and password (min 12 chars, strength meter, breached-password check is server-side). Offers "Set up 2FA now" (QR + manual key + 8 recovery codes shown once).
- **Forgot/reset password**: always shows the same confirmation message.
- **Session**: access token in memory only; refresh token is an httpOnly cookie. The API client refreshes on 401 once, then redirects to `/login`.
- If the workspace has `requireMfa = true` and the user has no 2FA, force a "Set up 2FA" screen before any other route.

---

## 6. Pages

For every page implement **loading (skeleton), empty, error (retry), and no-permission** states.

### 6.1 Overview
- KPI strip: total audience (+ % change 30d), engagement rate (30d), posts going out this week.
- **Up next**: next scheduled post with live countdown, brand, networks, status chip, "Open" button.
- **Coming up**: next 6 scheduled posts (thumbnail, first line, time, status).
- **Needs you** (count badge): pending approvals for me, changes requested on my posts, failed posts (with **Retry**), channels expiring/disconnected (with **Reconnect**). Inline Approve / Review buttons.
- **Audience growth** line chart (30D/90D toggle, per-network filter).
- **Top post this month**: media, reach, engagement rate, saves, "x times usual reach".
- **Week ahead**: 7 columns, post pills by status colour, "+N more", click opens Calendar at that day.
- **Network pulse**, **Inbox pulse** (open / unread / priority + sentiment bar + 3 latest), **Team activity** (latest 7 audit events in plain English).

### 6.2 Compose
- Brand selector, then network toggles (only connected, non-paused channels of that brand; disabled ones show why).
- Caption editor with per-network character counters (limits in `networkLimits.ts`), first comment (Instagram), hashtag-set picker, template picker (with `{blank}` fill dialog), media picker/upload (drag and drop, reorder, alt text).
- **Live preview** tabs per selected network (simple, original mock; shows truncation point, image crop).
- **Validation panel** ("N things to fix before it can go"): e.g. "Instagram needs a photo", "X is 12 over the limit". Schedule/Publish buttons disabled until clean.
- **When** panel: date, time, workspace timezone label, "Best times" chips (from API), "Next free slot", mini day timeline showing other posts that day.
- **Primary action changes with permission**:
  - user has `post.publish` and rule does not require approval: **Schedule**, **Publish now**, **Save draft**
  - otherwise: **Send for approval**, **Save draft** (tooltip explains why)
- Autosave draft every 10 s while typing (`PUT /posts/:id`), "Saved" indicator.
- **Your drafts** list below (includes CHANGES-requested posts with the reviewer's note highlighted).
- Editing an already approved/scheduled post by a user who needs approval shows a warning: "Saving will send this back for approval."

### 6.3 Calendar
- Views: **Week** (time grid, now-line), **Month**, **List**. Prev/next/Today, mini month picker.
- Filters: network chips, status chips, campaign dropdown, brand (global).
- Campaign bars (spanning days) above the grid.
- Post blocks: time, truncated caption, thumbnail, brand tag, network icons; colour by status.
- **Drag to reschedule** (needs `post.reschedule`); dropping on a past slot is blocked; if rule requires approval and user cannot publish, the drop is blocked with a message.
- Right column: **Unscheduled drafts** (drag onto calendar to give a time), **This week by network** bars, "Best times" overlay toggle.
- Click block: side drawer with full detail, review history, actions.

### 6.4 Inbox
- Two panes. Left list: filters (All, Unread, Mine, Unassigned, Priority), search, sort. Right: thread with the original post as context card, message bubbles, internal notes (visible to team only), composer with saved-reply picker (`/` opens it) and attachments.
- Actions: assign (member picker), flag, mark closed, sentiment override, "Open original post".
- Row shows avatar, network icon, preview, time, unread dot, assignee avatar.
- Header stats: open count, unread count, median first reply time.
- Real-time: new messages arrive via SSE and animate in; scroll position preserved.

### 6.5 Approvals
- Header stats: waiting for you (+ oldest age), changes requested, approved this week, average time to approve.
- Tabs: **Waiting for me**, **All pending**, **Changes requested**, **My submissions**, **Recently approved** (14 days). Brand chips filter.
- Card: media (carousel dots), networks, brand, "Goes out ..." (red if overdue), caption, "Written by" and "Can approve" avatars, review history (who, when, note), buttons **Approve**, **Request changes**, **Open**, **Edit**.
- **Approve**: optimistic status flip, brief "Approved by NAME" stamp, Undo toast.
- **Request changes**: dialog with required note + quick chips (Swap the photo, Shorten the caption, Check the price, Add the link, Fix the hashtags, Move the time). Card leaves the list on success.
- **Bulk**: checkbox per card + "Select all"; floating bar "N selected" with **Approve selected**.
- **Open**: right drawer with per-network preview and full history. Deep link `/approvals/:postId` scrolls to and highlights the card for 2 s.
- **Rule panel** (right): current approval rule, who needs approval, who can approve, "Change the rule" (links to Settings if `workspace.manage`).
- Authors cannot approve their own posts: buttons disabled with a lock + tooltip.

### 6.6 Analytics
- KPI strip: audience, new followers (30d + %), impressions, average engagement rate.
- Range 7D/30D/90D; network chips; **Export CSV**; **Schedule a report** (weekly/monthly email, recipients).
- Charts: audience growth (with previous-period dashed line), impressions/engagements/clicks switch, **best time to post** heatmap (7 x 24, top 3 slots with "add to calendar"), content mix (donut + counts per network), by-network table (followers, growth, impressions, eng. rate, posts, sparkline), top posts grid (sort by reach / eng. rate / clicks), brand comparison bars.
- Tooltips and a "view as table" toggle on every chart (accessibility).

### 6.7 Listening
- KPI strip: mentions this week, net sentiment, potential reach, share of voice.
- **Tracked keywords** (type: Brand, Hashtag, Topic, Competitor) with 14-day sparklines and sentiment bar; add/remove; picking one filters the stream.
- **Mentions** stream (All/Positive/Neutral/Negative, network filter, Saved): author, text with keyword highlighted, reach, sentiment chip, **Reply in inbox**, save, hide.
- Share-of-voice bars, trending terms cloud (click to search), sentiment-over-time chart, competitors table.

### 6.8 Library
- **Media**: grid with brand filter, tag chips, search, starred, sort (Newest, Most used), multi-select, drag-and-drop upload (JPG/PNG/WebP/MP4), usage count, rename/tags/delete, "Use in post".
- **Templates**: cards with `{blank}` highlighted; Use (opens Compose with fill dialog), duplicate, edit, delete; scope = all brands or one brand.
- **Hashtag sets**: per brand; tap a tag to copy; Copy all; Start a post.
- **Saved replies**: list with title + text, copy/edit/delete; note that they appear in Inbox.

### 6.9 Channels
- Stats: connected accounts, needing attention, total audience, networks in use.
- Alert banner listing broken channels with **Reconnect**.
- Filters: All, Needs attention, Paused; search.
- Per-brand section: header (logo, name, description, audience), "N people can post here" (avatars, link to access), channel cards (handle, network, status chip, followers + growth sparkline, **token days left** bar, last sync, connected by, **Posting** toggle, Analytics button, "..." menu: Reconnect, Disconnect).
- **Connect a channel** wizard: pick brand, pick network, start OAuth (redirect), return page shows result. Right column: supported networks and what each supports (Publish / Inbox / Analytics).

### 6.10 Team
- **Members** table: person, title, role (inline dropdown if allowed), brands (avatars), status, 2FA, last active, row menu (edit brands, suspend, remove, resend invite). Role filter chips with counts. Search.
- Cards: seats used (x of limit), 2FA coverage with list of people without it, pending invites (resend/cancel).
- **Invite** dialog: email(s), role, brand access (multi-select; Owner/Admin = all brands), personal message. Blocks when seats are full.
- **Roles and permissions**: read-only matrix (roles as columns, permissions as rows) generated from shared constants.
- **Audit log**: filter by actor, action, brand, date; paginated; CSV export.

### 6.11 Settings
Left nav + panel. Tabs: **Profile** (name, title, avatar or initials, role + what it can do, brands visible), **Notifications** (approvals, mentions and replies, publishing failures, weekly digest), **Workspace** (name, timezone, week start, shorten links, UTM on/off + source, link preview), **Approvals** (three radio cards: By role / Every post / No approvals; live list of "who needs approval" and "who publishes directly"; Undo toast), **Security** (change password, 2FA setup/reset, active sessions with revoke, workspace "require 2FA"), **Billing** (plan, seats, invoices; read-only placeholder in v1), **Appearance** (light/dark/system), **Data** (export workspace JSON, delete workspace with typed confirmation; Owner only).

---

## 7. Shared components (build once)

`AppShell, TopNav, LeftRail, BrandSwitcher, CommandPalette, Toast(+Undo), Modal, Drawer, ConfirmDialog, Tabs, Chip, StatusBadge, NetworkIcon, BrandAvatar, UserAvatar(+Stack), EmptyState, Skeleton, ErrorState, StatCard, DataTable, Pagination, DateTimePicker (tz aware), MediaGrid, FileDropzone, CaptionEditor, CharCounter, NetworkPreview, ReviewHistory, PermissionGate, Sparkline, Heatmap, DonutChart, LineChart, BarList`.

`<PermissionGate perm="post.approve" fallback="disable|hide|lock">` wraps buttons. This is **UX only**; the server enforces everything.

---

## 8. Data layer

- `src/api/client.ts`: fetch wrapper (base URL from `VITE_API_URL`, credentials include, JSON, error normaliser to `{code,message,details}`), single-flight token refresh.
- One hooks file per module: `usePosts`, `useApprovals`, `useInbox`, etc. Query keys: `['posts', {brandId, range, status}]`.
- Mutations use optimistic updates for: approve, request changes, reschedule, assign, flag, toggle posting. Roll back on error and show toast.
- SSE: `EventSource('/api/events')` (cookie auth) invalidates the relevant query keys on `notification`, `inbox.message`, `post.updated`, `channel.status`.
- All timestamps from API are ISO UTC. Convert to workspace timezone only at the view layer through `formatInWorkspaceTz()`.
- Types and zod schemas imported from `@postdesk/shared`.

---

## 9. Quality bar

- **Responsive**: usable at 360 px (single column, bottom nav), 768 px, 1280 px+.
- **Accessibility**: WCAG 2.1 AA contrast, full keyboard use (drawers trap focus, Esc closes), ARIA live region for toasts, drag-and-drop has a keyboard alternative ("Move to..." menu), colour never the only status signal.
- **Performance**: route-level code splitting (`React.lazy`), images lazy with fixed aspect ratio, virtualised lists over 200 rows (inbox, media), initial JS under 250 KB gzip.
- **i18n-ready**: all strings through a `t()` helper (English only in v1).
- **Security (client side)**: no secrets in the bundle (`VITE_` variables are public), escape all user text (React default), never use `dangerouslySetInnerHTML` except through a sanitiser (DOMPurify), validate file type/size before upload (still re-validated on server).

---

## 10. Folder structure

```
apps/web/
|-- index.html
|-- vite.config.ts  tailwind.config.ts  tsconfig.json
|-- src/
|   |-- main.tsx  App.tsx  routes.tsx
|   |-- styles/        tokens.css  base.css
|   |-- api/           client.ts  sse.ts  endpoints/*.ts
|   |-- hooks/         usePermission.ts  useWorkspaceTz.ts  use*.ts (per module)
|   |-- store/         ui.store.ts  auth.store.ts
|   |-- lib/           permissions.ts(re-export shared)  networkLimits.ts  format.ts  csv.ts
|   |-- components/    ui/  layout/  charts/  post/  inbox/  common/
|   |-- pages/
|   |   |-- auth/  overview/  compose/  calendar/  inbox/  approvals/
|   |   |-- analytics/  listening/  library/  channels/  team/  settings/
|   |-- test/          setup.ts  mocks/
`-- e2e/               approvals.spec.ts  publish.spec.ts  invite.spec.ts  rbac.spec.ts  inbox.spec.ts
```

## 11. Frontend acceptance checklist

- [ ] All routes in section 4 render with loading, empty, error, no-permission states.
- [ ] Editor sees "Send for approval"; Manager/Admin/Owner see "Schedule / Publish now" (rule = BY_ROLE).
- [ ] Approve and Request changes work with Undo; self-approval is blocked in UI and API.
- [ ] Drag-to-reschedule works and respects timezone.
- [ ] Client role only sees its own brand(s) everywhere (switcher, lists, search).
- [ ] Light and dark themes pass contrast checks; no flash on load.
- [ ] No `localStorage` use for tokens or business data.
- [ ] Lighthouse accessibility score of 90 or higher on Overview, Approvals, Compose.
