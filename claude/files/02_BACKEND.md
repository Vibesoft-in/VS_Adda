# 02 - BACKEND SPECIFICATION

Companion to `01_FRONTEND.md` (UI), `03_LOGIC.md` (business rules - the source of truth for behaviour) and `04_SECURE_KEYS.md` (secrets and security).

---

## 1. Stack and assumptions

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 LTS + TypeScript (strict) | one language across web + api + shared |
| HTTP | Express 4 | simple, well known |
| ORM / migrations | Prisma | typed queries, migrations |
| Database | **MySQL 8 / MariaDB 10.6+** | already available in XAMPP, no extra install |
| Validation | zod (schemas live in `packages/shared`) | one schema for client and server |
| Auth | JWT access (15 min, in memory on client) + rotating refresh token (httpOnly cookie), argon2id passwords, TOTP 2FA (otplib) | see file 04 |
| Jobs | DB-backed queue (`jobs` table, `FOR UPDATE SKIP LOCKED`) + `node-cron` ticker. **No Redis needed** | works on a laptop and a small VPS |
| Real time | Server-Sent Events (`/api/events`) | simpler than WebSockets |
| Uploads | `multer` -> local disk in dev, S3-compatible bucket in prod (driver interface) | |
| Email | nodemailer (SMTP). Dev: Mailpit or Mailtrap | |
| Logging | pino + request id | |
| Security middleware | helmet, cors allow-list, express-rate-limit, hpp | |
| Tests | Vitest + supertest against a test database | |

**Local setup (Windows + XAMPP)**: start only the **MySQL** module in XAMPP (Apache is not needed; Node serves the API and Vite serves the web app). Create DB `postdesk` with `utf8mb4`. Use a project path **without spaces or dots** (e.g. `C:\xampp\htdocs\postdesk`) because several tools break on paths like `V.S Adda`.

**Hosting note**: this backend needs Node hosting (VPS, Render, Railway, Fly, etc.). Plain shared PHP hosting cannot run it. Confirm the client's hosting before building.

---

## 2. Folder structure

```
apps/api/
|-- prisma/            schema.prisma  migrations/  seed.ts
|-- src/
|   |-- server.ts      app.ts         config/env.ts (zod-validated env)
|   |-- middleware/    auth.ts  rbac.ts  tenant.ts  validate.ts  error.ts  rateLimit.ts  requestId.ts
|   |-- modules/
|   |   |-- auth/          routes  controller  service  (login, 2fa, refresh, reset, invite-accept)
|   |   |-- workspaces/    settings, approval rule, data export
|   |   |-- team/          members, invites, roles view, seats
|   |   |-- brands/
|   |   |-- channels/      list, oauth start/callback, reconnect, toggle posting, metrics sync
|   |   |-- posts/         CRUD, submit, withdraw, schedule, publish-now, retry
|   |   |-- approvals/     queue queries, approve, request-changes, bulk
|   |   |-- calendar/      range query, reschedule, campaigns
|   |   |-- inbox/         conversations, messages, assign, flag, close, ingest
|   |   |-- library/       media, templates, hashtags, replies
|   |   |-- analytics/     overview, growth, heatmap, content-mix, top posts, export, reports
|   |   |-- listening/     keywords, mentions, competitors, share-of-voice
|   |   |-- notifications/ in-app + email + SSE hub
|   |   |-- audit/
|   |   |-- search/
|   |-- networks/      types.ts  registry.ts  mock.adapter.ts  instagram.adapter.ts ... (one per network)
|   |-- jobs/          queue.ts  scheduler.ts  worker.ts  handlers/{publishTarget,syncMetrics,syncInbox,refreshToken,sendEmail,weeklyReport}.ts
|   |-- lib/           crypto.ts (token encryption)  password.ts  totp.ts  tz.ts  links.ts  sentiment.ts  csv.ts  storage/
|   |-- policies/      permissions.ts (re-export shared)  postPolicy.ts  tenantScope.ts
|   `-- test/
`-- package.json
packages/shared/       permissions.ts  roles.ts  networkLimits.ts  schemas/*.ts  types.ts
```

---

## 3. Database (Prisma schema)

Run `npx prisma validate` and `npx prisma format` after pasting; fix any relation warnings. All ids are `cuid()`. All timestamps are UTC. Every tenant-owned table carries `workspaceId` and **every query must filter by it** (see `tenantScope.ts`).

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "mysql"  url = env("DATABASE_URL") }

enum Role           { OWNER ADMIN MANAGER EDITOR COMMUNITY ANALYST CLIENT }
enum MemberStatus   { INVITED ACTIVE SUSPENDED }
enum ApprovalMode   { BY_ROLE EVERY_POST OFF }
enum Network        { INSTAGRAM FACEBOOK TIKTOK X LINKEDIN YOUTUBE PINTEREST THREADS }
enum ChannelStatus  { CONNECTED EXPIRING DISCONNECTED PAUSED }
enum PostStatus     { DRAFT PENDING CHANGES SCHEDULED PUBLISHING PUBLISHED FAILED }
enum TargetStatus   { QUEUED PUBLISHING PUBLISHED FAILED SKIPPED }
enum ReviewDecision { SUBMITTED APPROVED CHANGES_REQUESTED WITHDRAWN }
enum ConvoType      { COMMENT DM MENTION }
enum ConvoStatus    { OPEN CLOSED }
enum Sentiment      { POSITIVE NEUTRAL NEGATIVE }
enum KeywordKind    { BRAND HASHTAG TOPIC COMPETITOR }
enum JobStatus      { QUEUED RUNNING DONE FAILED }

model Workspace {
  id           String       @id @default(cuid())
  name         String
  timezone     String       @default("UTC")
  weekStart    Int          @default(1)            // 1=Mon, 0=Sun
  approvalMode ApprovalMode @default(BY_ROLE)
  shortenLinks Boolean      @default(true)
  utmEnabled   Boolean      @default(true)
  utmSource    String       @default("postdesk")
  requireMfa   Boolean      @default(false)
  plan         String       @default("agency")
  seatLimit    Int          @default(15)
  createdAt    DateTime     @default(now())
  brands       Brand[]
  memberships  Membership[]
  invites      Invite[]
  auditLogs    AuditLog[]
  notifications Notification[]
  savedReplies SavedReply[]
  templates    Template[]
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  title         String?
  avatarUrl     String?
  passwordHash  String
  totpSecretEnc String?  @db.Text          // AES-GCM encrypted, see file 04
  totpEnabled   Boolean  @default(false)
  recoveryCodes Json?                       // array of argon2 hashes
  failedLogins  Int      @default(0)
  lockedUntil   DateTime?
  lastActiveAt  DateTime?
  createdAt     DateTime @default(now())
  memberships   Membership[]
  refreshTokens RefreshToken[]
  posts         Post[]   @relation("PostAuthor")
}

model Membership {
  id          String       @id @default(cuid())
  workspaceId String
  userId      String
  role        Role
  status      MemberStatus @default(ACTIVE)
  allBrands   Boolean      @default(false)     // OWNER/ADMIN/ANALYST may be true
  createdAt   DateTime     @default(now())
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  brands      MembershipBrand[]
  @@unique([workspaceId, userId])
  @@index([workspaceId, role])
}

model MembershipBrand {
  membershipId String
  brandId      String
  membership   Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  brand        Brand      @relation(fields: [brandId], references: [id], onDelete: Cascade)
  @@id([membershipId, brandId])
}

model Invite {
  id          String   @id @default(cuid())
  workspaceId String
  email       String
  role        Role
  brandIds    Json                            // string[]
  tokenHash   String   @unique                // sha256 of the emailed token
  invitedById String
  expiresAt   DateTime
  acceptedAt  DateTime?
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@index([workspaceId, email])
}

model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  tokenHash  String   @unique
  familyId   String                           // for reuse detection
  userAgent  String?
  ip         String?
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, familyId])
}

model Brand {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  description String?
  color       String   @default("#4F46E5")
  logoUrl     String?
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  members     MembershipBrand[]
  channels    Channel[]
  posts       Post[]
  campaigns   Campaign[]
  assets      MediaAsset[]
  hashtagSets HashtagSet[]
  keywords    Keyword[]
  @@index([workspaceId])
}

model Channel {
  id             String        @id @default(cuid())
  workspaceId    String
  brandId        String
  network        Network
  externalId     String                        // id on the network
  handle         String
  avatarUrl      String?
  followers      Int           @default(0)
  status         ChannelStatus @default(CONNECTED)
  postingEnabled Boolean       @default(true)
  accessTokenEnc  String?      @db.Text        // encrypted, "v1:iv:tag:cipher"
  refreshTokenEnc String?      @db.Text
  tokenExpiresAt DateTime?
  lastSyncAt     DateTime?
  lastError      String?
  connectedById  String?
  createdAt      DateTime      @default(now())
  brand          Brand         @relation(fields: [brandId], references: [id], onDelete: Cascade)
  targets        PostTarget[]
  conversations  Conversation[]
  metrics        MetricDaily[]
  @@unique([brandId, network, externalId])
  @@index([workspaceId, status])
}

model Campaign {
  id        String   @id @default(cuid())
  brandId   String
  name      String
  startsAt  DateTime
  endsAt    DateTime
  brand     Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
  posts     Post[]
}

model MediaAsset {
  id          String   @id @default(cuid())
  workspaceId String
  brandId     String
  kind        String                           // image | video
  url         String
  thumbUrl    String?
  title       String
  tags        Json                             // string[]
  width       Int?
  height      Int?
  bytes       Int
  starred     Boolean  @default(false)
  createdAt   DateTime @default(now())
  brand       Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
  usedIn      PostMedia[]
  @@index([workspaceId, brandId])
}

model Post {
  id            String     @id @default(cuid())
  workspaceId   String
  brandId       String
  authorId      String
  campaignId    String?
  caption       String     @db.Text
  firstComment  String?    @db.Text
  status        PostStatus @default(DRAFT)
  scheduledAt   DateTime?
  publishedAt   DateTime?
  partialFailure Boolean   @default(false)
  version       Int        @default(1)          // bump on content edit (re-approval logic)
  deletedAt     DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  brand         Brand      @relation(fields: [brandId], references: [id], onDelete: Cascade)
  author        User       @relation("PostAuthor", fields: [authorId], references: [id])
  campaign      Campaign?  @relation(fields: [campaignId], references: [id])
  targets       PostTarget[]
  media         PostMedia[]
  reviews       Review[]
  @@index([workspaceId, status, scheduledAt])
  @@index([brandId, scheduledAt])
}

model PostMedia {
  postId   String
  assetId  String
  position Int
  altText  String?
  post     Post       @relation(fields: [postId], references: [id], onDelete: Cascade)
  asset    MediaAsset @relation(fields: [assetId], references: [id])
  @@id([postId, assetId])
}

model PostTarget {
  id           String       @id @default(cuid())
  postId       String
  channelId    String
  status       TargetStatus @default(QUEUED)
  externalPostId String?
  attempts     Int          @default(0)
  lastError    String?
  publishedAt  DateTime?
  metrics      Json?                           // {impressions,reach,likes,comments,shares,saves,clicks}
  post         Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  channel      Channel      @relation(fields: [channelId], references: [id])
  @@unique([postId, channelId])
}

model Review {
  id        String         @id @default(cuid())
  postId    String
  byId      String
  decision  ReviewDecision
  note      String?        @db.Text
  postVersion Int
  at        DateTime       @default(now())
  post      Post           @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@index([postId, at])
}

model Conversation {
  id           String       @id @default(cuid())
  workspaceId  String
  channelId    String
  type         ConvoType
  externalId   String
  authorName   String
  authorHandle String?
  authorAvatar String?
  postTargetId String?                          // original post, when comment
  status       ConvoStatus  @default(OPEN)
  sentiment    Sentiment    @default(NEUTRAL)
  priority     Boolean      @default(false)
  flagged      Boolean      @default(false)
  assigneeId   String?
  unread       Boolean      @default(true)
  firstReplyAt DateTime?
  lastMessageAt DateTime
  createdAt    DateTime     @default(now())
  channel      Channel      @relation(fields: [channelId], references: [id], onDelete: Cascade)
  messages     Message[]
  @@unique([channelId, externalId])
  @@index([workspaceId, status, lastMessageAt])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  externalId     String?
  direction      String                          // IN | OUT | NOTE
  body           String   @db.Text
  authorUserId   String?                         // for OUT/NOTE
  sentAt         DateTime
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  @@index([conversationId, sentAt])
}

model SavedReply { id String @id @default(cuid())  workspaceId String  title String  body String @db.Text  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade) }

model Template {
  id String @id @default(cuid())  workspaceId String  brandId String?  title String  body String @db.Text
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model HashtagSet {
  id String @id @default(cuid())  brandId String  name String  tags Json
  brand Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)
}

model Keyword {
  id String @id @default(cuid())  brandId String  kind KeywordKind  term String  handle String?
  createdAt DateTime @default(now())
  brand Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)
  mentions Mention[]
  @@unique([brandId, kind, term])
}

model Mention {
  id String @id @default(cuid())  workspaceId String  keywordId String  network Network
  externalId String  authorName String  authorHandle String?  text String @db.Text
  reach Int @default(0)  sentiment Sentiment @default(NEUTRAL)  saved Boolean @default(false)  hidden Boolean @default(false)
  postedAt DateTime
  keyword Keyword @relation(fields: [keywordId], references: [id], onDelete: Cascade)
  @@unique([network, externalId, keywordId])
  @@index([workspaceId, postedAt])
}

model MetricDaily {
  id String @id @default(cuid())  channelId String  date DateTime @db.Date
  followers Int  impressions Int  reach Int  engagements Int  clicks Int  postsPublished Int @default(0)
  channel Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  @@unique([channelId, date])
}

model Notification {
  id String @id @default(cuid())  workspaceId String  userId String  type String
  title String  body String?  link String?  readAt DateTime?  createdAt DateTime @default(now())
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@index([userId, readAt])
}

model AuditLog {
  id String @id @default(cuid())  workspaceId String  actorId String?  action String
  entity String  entityId String?  brandId String?  meta Json?  ip String?  at DateTime @default(now())
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@index([workspaceId, at])
}

model Job {
  id          String    @id @default(cuid())
  type        String                               // publishTarget | syncMetrics | syncInbox | refreshToken | sendEmail | weeklyReport
  payload     Json
  status      JobStatus @default(QUEUED)
  attempts    Int       @default(0)
  maxAttempts Int       @default(3)
  runAt       DateTime  @default(now())
  lockedAt    DateTime?
  lastError   String?   @db.Text
  dedupeKey   String?   @unique                    // idempotency
  createdAt   DateTime  @default(now())
  @@index([status, runAt])
}
```

Other recommended tables to add as needed: `ScheduledReport`, `LoginAttempt`, `SearchIndex` (or use MySQL FULLTEXT on `Post.caption`, `Message.body`).

---

## 4. API (REST, JSON, prefix `/api/v1`)

Conventions: auth = `Authorization: Bearer <access>` (except auth routes). `X-Workspace-Id` is **not trusted**; the workspace comes from the user's membership. List endpoints: `?limit=&cursor=`. Errors: `{ "error": { "code": "FORBIDDEN", "message": "...", "details": {} } }`. Every mutating endpoint writes an `AuditLog` row. Permission keys are defined in file 03.

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | email + password; returns `{needs2fa:true, challengeId}` or tokens |
| POST | `/auth/2fa/verify` | challengeId + code or recovery code |
| POST | `/auth/refresh` | rotates refresh cookie, reuse detection revokes family |
| POST | `/auth/logout` | revokes current refresh token |
| POST | `/auth/forgot-password`, `/auth/reset-password` | always 202 on forgot |
| GET | `/auth/invite/:token` | invite preview (workspace, role) |
| POST | `/auth/invite/:token/accept` | name + password |
| GET/PATCH | `/me` | profile; includes `permissions[]`, `brandIds[]`, `workspace` |
| POST/DELETE | `/me/2fa/setup`, `/me/2fa` | enable/disable; returns QR + recovery codes once |
| GET/DELETE | `/me/sessions`, `/me/sessions/:id` | list and revoke |

### Workspace and team
| Method | Path | Permission |
|---|---|---|
| GET/PATCH | `/workspace` | read: member; patch: `workspace.manage` |
| PATCH | `/workspace/approval-mode` | `workspace.manage` |
| GET | `/workspace/export` | OWNER |
| GET | `/team/members` | `team.manage` |
| PATCH/DELETE | `/team/members/:id` | `team.manage` (role, brands, suspend, remove) |
| GET/POST | `/team/invites`, `/team/invites/:id/resend`, DELETE `/team/invites/:id` | `team.manage` |
| GET | `/team/roles` | any (matrix) |
| GET | `/team/seats`, `/team/2fa-coverage` | `team.manage` |
| GET | `/audit` , `/audit/export` | `team.manage` |

### Brands and channels
| Method | Path | Permission |
|---|---|---|
| GET/POST/PATCH/DELETE | `/brands` | list: member (scoped); write: `workspace.manage` |
| GET | `/channels?brandId=&status=` | member (scoped) |
| POST | `/channels/oauth/:network/start` | `channels.manage` -> `{authUrl}` |
| GET | `/channels/oauth/:network/callback` | state + PKCE validated |
| POST | `/channels/:id/reconnect` | `channels.manage` |
| PATCH | `/channels/:id` | `{postingEnabled}`; `channels.manage` |
| DELETE | `/channels/:id` | `channels.manage` |
| GET | `/channels/health` | counts + alert list |

### Posts, approvals, calendar
| Method | Path | Permission / rule |
|---|---|---|
| GET | `/posts?brandId=&status=&from=&to=&network=&campaignId=` | scoped |
| POST | `/posts` | `post.create` (creates DRAFT) |
| GET/PUT/DELETE | `/posts/:id` | PUT triggers re-approval rule; DELETE needs `post.delete` or own draft |
| POST | `/posts/:id/submit` | author; moves DRAFT/CHANGES -> PENDING |
| POST | `/posts/:id/withdraw` | author; PENDING -> DRAFT |
| POST | `/posts/:id/schedule` | `post.publish` and not blocked by rule |
| POST | `/posts/:id/publish-now` | `post.publish` and not blocked by rule |
| POST | `/posts/:id/retry` | `post.publish`; FAILED targets only |
| POST | `/posts/:id/reschedule` | `post.reschedule` |
| POST | `/posts/:id/undo` | inverse of last transition within 8 s (see file 03 s6) |
| GET | `/approvals?tab=mine|pending|changes|submitted|approved&brandId=` | `post.approve` or author |
| POST | `/approvals/:postId/approve` | `post.approve`, brand access, not author |
| POST | `/approvals/:postId/request-changes` | body `{note}` required |
| POST | `/approvals/bulk-approve` | `{postIds[]}` - per-item result, never all-or-nothing |
| GET | `/approvals/summary` | counts, oldest age, avg time to approve |
| GET | `/calendar?from=&to=&brandId=` | posts + campaigns + empty-day counts |
| GET | `/best-times?brandId=&network=` | top 3 slots, see file 03 s10 |
| GET/POST/PATCH | `/campaigns` | `post.create` |
| POST | `/validate-post` | dry-run validation, returns list of issues per network |

### Inbox
| Method | Path | Permission |
|---|---|---|
| GET | `/inbox/conversations?filter=all|unread|mine|unassigned|priority&q=` | scoped |
| GET | `/inbox/conversations/:id` | marks read |
| POST | `/inbox/conversations/:id/reply` | `inbox.reply`; sends through adapter |
| POST | `/inbox/conversations/:id/note` | internal note |
| PATCH | `/inbox/conversations/:id` | `inbox.assign` for assignee; flag/close/sentiment need `inbox.reply` |
| GET | `/inbox/summary` | counts, sentiment split, median first reply |
| POST | `/webhooks/:network` | signature-verified ingest (see section 7) |

### Library
| Method | Path |
|---|---|
| GET/POST/PATCH/DELETE | `/library/media` (POST is multipart; server validates type, size, magic bytes) |
| GET/POST/PATCH/DELETE | `/library/templates`, `/library/hashtags`, `/library/replies` |

### Analytics and listening
| Method | Path |
|---|---|
| GET | `/overview` (single aggregate for the dashboard) |
| GET | `/analytics/summary?range=&brandId=&network=` |
| GET | `/analytics/growth`, `/analytics/engagement`, `/analytics/heatmap`, `/analytics/content-mix`, `/analytics/by-network`, `/analytics/top-posts?sort=`, `/analytics/brand-comparison` |
| GET | `/analytics/export.csv` |
| GET/POST/DELETE | `/analytics/reports` (scheduled reports) |
| GET/POST/DELETE | `/listening/keywords` |
| GET | `/listening/mentions?sentiment=&network=&keywordId=&saved=` |
| PATCH | `/listening/mentions/:id` (`saved`, `hidden`) |
| POST | `/listening/mentions/:id/reply-in-inbox` |
| GET | `/listening/summary`, `/listening/share-of-voice`, `/listening/trending`, `/listening/sentiment-timeline` |

### Misc
`GET /notifications`, `POST /notifications/read`, `GET /events` (SSE), `GET /search?q=`, `GET /health`.

---

## 5. Request pipeline (order matters)

`requestId -> helmet -> cors(allow-list) -> json(limit 1mb) -> rateLimit -> auth(verify JWT) -> tenant(load membership, brand scope) -> rbac(permission) -> validate(zod) -> controller -> service -> audit -> response`.

- `auth` rejects suspended memberships and tokens issued before a password change.
- `tenant` attaches `req.ctx = { userId, workspaceId, role, perms, allBrands, brandIds }`.
- `tenantScope(ctx)` returns the Prisma `where` fragment that limits to the workspace and permitted brands. **No service queries without it.**
- Rate limits: login 5/15 min per email+IP; refresh 30/min; global 300/min per user; invites 20/hour; uploads 30/10 min.

## 6. Error codes

`UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404 (also used when a resource is outside the tenant), VALIDATION 422, CONFLICT 409 (stale version, duplicate), RATE_LIMITED 429, SEATS_FULL 402, CHANNEL_UNAVAILABLE 409, NETWORK_ERROR 502`.

## 7. Jobs, scheduler, webhooks

- `scheduler.ts` runs every 30 s: finds `SCHEDULED` posts with `scheduledAt <= now`, flips to `PUBLISHING`, enqueues one `publishTarget` job per target with `dedupeKey = target:{id}:attempt{n}`. Details and retry policy in file 03 s7.
- `worker.ts` loop: claim a batch with
  `SELECT id FROM jobs WHERE status='QUEUED' AND runAt<=NOW() ORDER BY runAt LIMIT 10 FOR UPDATE SKIP LOCKED`, mark `RUNNING`, run handler, mark `DONE` or reschedule with backoff. Jobs stuck `RUNNING` for over 10 minutes are re-queued.
- Recurring jobs (cron): `syncMetrics` hourly per channel, `syncInbox` every 2 min where webhooks are unavailable, `refreshToken` daily (refresh tokens expiring within 7 days), `checkChannelHealth` hourly, `weeklyReport` Monday 08:00 workspace tz, `cleanup` nightly (expired refresh tokens, old jobs).
- Webhooks: `POST /webhooks/:network` verify the network signature (HMAC with the app secret) using the raw body before parsing; reject on mismatch; always respond fast and enqueue `syncInbox`.

## 8. Network adapters

```ts
export interface NetworkAdapter {
  network: Network;
  capabilities: { publish: boolean; inbox: boolean; analytics: boolean; listening: boolean };
  buildAuthUrl(state: string, codeChallenge: string): string;
  exchangeCode(code: string, codeVerifier: string): Promise<TokenSet & { account: AccountInfo }>;
  refresh(tokens: TokenSet): Promise<TokenSet>;
  publish(ch: ChannelAuth, post: PublishInput): Promise<{ externalPostId: string }>;
  fetchMetrics(ch: ChannelAuth, since: Date): Promise<DailyMetric[]>;
  fetchPostMetrics(ch: ChannelAuth, externalPostId: string): Promise<PostMetrics>;
  fetchMessages(ch: ChannelAuth, since: Date): Promise<IncomingMessage[]>;
  reply(ch: ChannelAuth, convo: ConvoRef, body: string): Promise<{ externalId: string }>;
  searchMentions?(ch: ChannelAuth, term: string, since: Date): Promise<IncomingMention[]>;
  classifyError(err: unknown): 'RETRYABLE' | 'AUTH_EXPIRED' | 'PERMANENT';
}
```

- Build **`MockAdapter` first** (fake accounts, instant publish, random metrics, scripted failures). The whole product must work end to end on it (`NETWORK_MODE=mock`).
- Add real adapters one network at a time, in this order of effort: LinkedIn, Facebook/Instagram (same Meta app), YouTube, Pinterest, TikTok, X, Threads. Each network has its own developer-app review, scopes, rate limits and paid tiers that **change over time: read the network's current docs before implementing; do not rely on assumptions in this file.**
- Adapters never log tokens. Tokens are decrypted only inside the job/handler that needs them.

## 9. Uploads

Accept JPG, PNG, WebP, MP4 only. Check extension + MIME + magic bytes, max 25 MB image / 200 MB video (configurable), re-encode images with `sharp` (strips EXIF/GPS), generate thumbnail, store under random names (never user filenames), serve through signed URLs or a static route with `Content-Disposition` and `X-Content-Type-Options: nosniff`.

## 10. Email templates (nodemailer + simple HTML)

invite, reset password, approval requested, changes requested, post failed, channel expiring, weekly digest, weekly report. Plain-text part always included.

## 11. Seed (`prisma/seed.ts`)

Create: 1 workspace, 4 brands with colours, 1 OWNER (email from `SEED_OWNER_EMAIL`, a **random password printed once to the console**, never hard-coded), one user per other role, 12 mock channels (MockAdapter), 60 posts across all statuses and 3 weeks, reviews, 30 conversations (mixed sentiment), keywords + mentions, 90 days of `MetricDaily`, templates, hashtag sets, saved replies, a few audit rows. Seed must be re-runnable (`--reset` flag wipes demo data only in non-production).

## 12. Testing requirements

- Unit: permission matrix, approval-rule evaluator, state machine guards, best-time algorithm, link/UTM builder, token crypto round-trip, backoff calculator.
- Integration (supertest): each role against each endpoint group (expect 200/403/404 correctly); **tenant isolation** (user from workspace A can never read B, including via guessed ids); invite accept; refresh rotation + reuse detection; approve/request-changes/bulk; scheduler picks only due posts; publish retry/backoff; webhook signature rejection.
- CI gate: lint, typecheck, tests, `npm audit --omit=dev` with no high or critical.
