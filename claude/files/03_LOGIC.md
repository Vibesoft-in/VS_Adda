# 03 - BUSINESS LOGIC (source of truth for behaviour)

If the frontend spec, backend spec and this file ever disagree, **this file wins**. Rules marked **[CONFIRM]** are sensible defaults that must be confirmed with the client before launch.

All rules below are enforced **on the server**. The UI only mirrors them for convenience.

---

## 1. Vocabulary

- **Workspace**: the agency account (one company). **Brand**: a client's identity inside the workspace. **Channel**: one social account of one brand on one network. **Post**: one piece of content, with one **PostTarget** per selected channel.
- **Author**: user who wrote the post. **Approver**: user allowed to approve it. **Publisher**: user allowed to skip approval.
- All times stored in UTC; shown in the workspace timezone.

## 2. Tenancy and scoping (never skip)

1. Every request resolves `ctx = {userId, workspaceId, role, perms, allBrands, brandIds}` from the **membership**, never from client-supplied ids.
2. Every query includes `workspaceId`, and, for brand-owned data, `brandId IN ctx.brandIds` unless `allBrands`.
3. Accessing something outside scope returns **404** (not 403), so ids cannot be probed.
4. Client users (`CLIENT`) additionally see only posts whose status is `PENDING, SCHEDULED, PUBLISHING, PUBLISHED` **[CONFIRM]**; internal drafts and change-request loops stay hidden.

## 3. Roles and permissions (defaults, stored in code, shared by web and api)

Permission keys: `post.create, post.approve, post.publish, post.reschedule, post.delete, inbox.reply, inbox.assign, analytics.view, report.export, listening.manage, library.manage, team.manage, channels.manage, workspace.manage, billing.manage`.

| Permission | OWNER | ADMIN | MANAGER | EDITOR | COMMUNITY | ANALYST | CLIENT |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| post.create | Y | Y | Y | Y | - | - | - |
| post.approve | Y | Y | Y | - | - | - | Y |
| post.publish (skip approval) | Y | Y | Y | - | - | - | - |
| post.reschedule | Y | Y | Y | - | - | - | - |
| post.delete | Y | Y | Y | - | - | - | - |
| inbox.reply | Y | Y | Y | - | Y | - | - |
| inbox.assign | Y | Y | Y | - | Y | - | - |
| analytics.view | Y | Y | Y | Y | - | Y | Y |
| report.export | Y | Y | Y | - | - | Y | - |
| listening.manage | Y | Y | Y | - | Y | - | - |
| library.manage | Y | Y | Y | - | - | - | - |
| channels.manage | Y | Y | - | - | - | - | - |
| team.manage | Y | Y | - | - | - | - | - |
| workspace.manage | Y | Y | - | - | - | - | - |
| billing.manage | Y | - | - | - | - | - | - |
| Brand scope | all | all | assigned | assigned | assigned | all or assigned | assigned (1+) |

Extra rules:
- **Own-resource rule**: any user with `post.create` can edit, withdraw and delete **their own** DRAFT / CHANGES / PENDING posts without further permission.
- All members can **read** the calendar, library and channel health for brands in scope.
- **Role grant ceiling**: rank `OWNER > ADMIN > MANAGER > (EDITOR, COMMUNITY, ANALYST, CLIENT)`. A user may only grant or change roles strictly below their own rank (Owner may grant Admin; Admin may grant Manager and below). Nobody can change their own role.
- There must always be **at least one active OWNER**. Block removal, suspension or demotion of the last one.
- Per-person extra grants (e.g. give one COMMUNITY user `inbox.assign`) are a later feature; design `perms` as `rolePerms[role] + membership.extraPerms[]` so it can be added without refactoring.

## 4. Approval rule

Workspace setting `approvalMode`:

```ts
function requiresApproval(ctx, mode: ApprovalMode): boolean {
  if (mode === 'OFF') return false;                                   // anyone who can write may publish
  if (mode === 'EVERY_POST') return !['OWNER', 'ADMIN'].includes(ctx.role);
  return !ctx.perms.includes('post.publish');                         // BY_ROLE (default)
}
```
Note: with `OFF`, a user must still hold `post.create` to write, and `post.publish` is **implicitly granted to every role that has `post.create`**.

**Who can approve a given post** = active members with `post.approve`, access to the post's brand, and not the author.
- Exception: if the **author is the only possible approver** and is `OWNER`, they may approve their own post; write audit action `post.self_approved`.
- If **no** eligible approver exists for the brand, `submit` fails with `NO_APPROVER` and the UI tells the user to ask an admin to assign an approver. Never leave a post stuck.

Changing the rule: `workspace.manage`. It affects **future** submissions only; posts already `PENDING` stay pending. Show a toast with Undo.

## 5. Post state machine

```
DRAFT --submit--> PENDING --approve--> SCHEDULED --scheduler--> PUBLISHING --> PUBLISHED
  ^                  |  \                  |  \                      \--> FAILED --retry--> PUBLISHING
  |<---withdraw------+   \--request-->CHANGES  \--unschedule--> DRAFT
  |                            changes   |
  +----------<resubmit>-----------------+
DRAFT --schedule (publishers only)--> SCHEDULED     DRAFT --publish-now--> PUBLISHING
```

| # | From -> To | Who | Guards | Side effects |
|---|---|---|---|---|
| 1 | DRAFT -> PENDING (submit) | author, or anyone with `post.create` on own post | validation passes; >=1 target on active channels; `scheduledAt >= now + 5 min`; an approver exists | Review `SUBMITTED`; notify all eligible approvers; audit |
| 2 | CHANGES -> PENDING (resubmit) | author | same as 1 | Review `SUBMITTED` (new `postVersion`) |
| 3 | PENDING -> DRAFT (withdraw) | author | - | Review `WITHDRAWN` |
| 4 | PENDING -> SCHEDULED (approve) | approver (section 4) | request `version` equals current `Post.version` else 409 `CONFLICT`; targets still valid | Review `APPROVED`; notify author; if `scheduledAt <= now + 1 min` set `scheduledAt = now + 2 min` and tell the UI to confirm first |
| 5 | PENDING -> CHANGES (request changes) | approver | `note` required, 1-1000 chars | Review `CHANGES_REQUESTED` with note; notify author |
| 6 | DRAFT -> SCHEDULED | user who does not require approval | validation + future time | audit |
| 7 | DRAFT -> PUBLISHING (publish now) | same as 6 | validation | `scheduledAt = now`; enqueue targets |
| 8 | SCHEDULED -> PUBLISHING | scheduler only | `scheduledAt <= now`, within grace (section 7) | enqueue per target |
| 9 | PUBLISHING -> PUBLISHED / FAILED | worker | derived from targets (section 7) | notify on FAILED |
| 10 | FAILED -> PUBLISHING (retry) | `post.publish` | only FAILED targets are re-queued | audit |
| 11 | SCHEDULED -> DRAFT (unschedule) | `post.publish` or author | not within 60 s of `scheduledAt` | audit |

**Editing rules (content = caption, first comment, media, targets):**
- Editing a `PENDING`, `SCHEDULED` post by a user who `requiresApproval` -> `Post.version++`, status returns to `PENDING`, new `SUBMITTED` review, approvers notified. UI warns before saving.
- Editing by a user who may publish keeps `SCHEDULED`; `version++`; audit `post.edited_after_approval`.
- **Time-only changes** (reschedule): allowed for `post.reschedule` holders without resetting approval. For a user who requires approval, a time change on a `SCHEDULED`/`PENDING` post counts as a content edit (same as above). Dropping into the past is rejected.
- `PUBLISHING` and `PUBLISHED` posts are read-only. Deleting a published post removes it only from PostDesk (soft delete); it does not delete it on the network **[CONFIRM]**.
- Delete = soft delete (`deletedAt`). Own drafts: anyone. Others: `post.delete`.

**Bulk approve**: process each post independently in its own transaction; return `[{postId, ok, reason?}]`; never all-or-nothing; skip posts the actor cannot approve and explain why.

## 6. Undo (8-second window)

Every transition returns `undoToken` (post id + transition id). `POST /posts/:id/undo` is allowed only if **all** are true: same actor, within 8 s, the post is still in the state the transition produced, and (for approve) the post is not within 30 s of publishing.

| Transition | Undo effect |
|---|---|
| approve | SCHEDULED -> PENDING; mark that Review `voided` (kept in history, hidden in UI count) |
| request changes | CHANGES -> PENDING; void that Review |
| reschedule | restore previous `scheduledAt` |
| delete | clear `deletedAt` |
| approval rule change | restore previous mode |
| bulk approve | per-item undo of those that succeeded |

## 7. Scheduling and publishing

**Time handling**: input = local date+time in workspace timezone -> convert to UTC with `date-fns-tz`. Nonexistent local time (DST spring forward) -> move forward to the next valid minute. Ambiguous local time (DST fall back) -> use the first occurrence. Minimum lead time on schedule/submit: 5 minutes. Seconds are always 0.

**Scheduler tick (every 30 s)**, in one transaction:
```ts
const due = await tx.$queryRaw`
  SELECT id FROM Post
  WHERE status='SCHEDULED' AND deletedAt IS NULL AND scheduledAt <= UTC_TIMESTAMP()
  ORDER BY scheduledAt LIMIT 50 FOR UPDATE SKIP LOCKED`;
for (const p of due) {
  if (now - p.scheduledAt > LATE_PUBLISH_GRACE_MIN * 60_000) {      // default 30 min
    markFailed(p, 'MISSED_WINDOW'); notify(author+approvers); continue; // never publish stale content silently
  }
  setStatus(p, 'PUBLISHING');
  for (const t of targetsWhere(p, 'QUEUED'))
    enqueueJob('publishTarget', { targetId: t.id }, { dedupeKey: `target:${t.id}:a${t.attempts}` });
}
```

**`publishTarget` handler**
1. Load target, channel, post, media. If `target.externalPostId` already set -> done (idempotent).
2. If channel is `DISCONNECTED` or `postingEnabled=false` -> target `FAILED` with `CHANNEL_UNAVAILABLE` (no retry); notify managers + channel connector.
3. If token expires within 5 min -> refresh first; if refresh fails -> treat as `AUTH_EXPIRED`.
4. Build final content: apply link shortening + UTM (section 15); never mutate the stored caption.
5. `adapter.publish()` then, on first-comment support, post the first comment (failure here does **not** fail the post; log + audit).
6. Outcomes:
   - success: `externalPostId`, `publishedAt`, status `PUBLISHED`.
   - `RETRYABLE`: `attempts++`; retry delays **1 min, 5 min, 15 min**; after 3 failures -> `FAILED`.
   - `AUTH_EXPIRED`: channel -> `DISCONNECTED`, target `FAILED`, **no retry**, notify with a Reconnect link.
   - `PERMANENT` (content rejected etc.): `FAILED` immediately; store a **sanitised** message (no tokens, no raw payloads).
7. Recompute post status from all targets:
   - any target `QUEUED/PUBLISHING` -> `PUBLISHING`
   - all `PUBLISHED` (SKIPPED ignored) -> `PUBLISHED`, `publishedAt = max`
   - none published -> `FAILED`
   - mixed -> `FAILED` with `partialFailure = true` (retry re-queues only failed targets)

**Known risk (document in README)**: if the process dies after the network accepted the post but before the DB write, a retry could post twice. Mitigation: where the adapter supports it, use a client idempotency key or run `findRecentPost()` before retrying.

## 8. Channel and token health

- `status` is **derived** by `checkChannelHealth` (hourly) and on every adapter error:
  - `DISCONNECTED`: token expired, refresh failed, or `AUTH_EXPIRED` seen.
  - `EXPIRING`: token expires in `<= 7 days` (UI shows "Access expires in N d").
  - `PAUSED`: `postingEnabled=false` (keep both fields in sync).
  - else `CONNECTED`.
- Refresh job (daily) refreshes tokens expiring within 7 days. Failure -> notify OWNER, ADMIN and brand MANAGERs once per 24 h per channel.
- **Reconnect** must return the **same `externalId`**; otherwise reject with "That is a different account. Disconnect this channel and add the new one."
- Turning posting off: warn with the count and list of scheduled posts that target this channel; at publish time those targets are `SKIPPED`, and the post notes it.
- Disconnecting a channel keeps history; scheduled targets become `FAILED CHANNEL_UNAVAILABLE` at publish time and the author is notified immediately when it is disconnected.
- Tokens are encrypted at rest (file 04). Raw tokens never leave the server and never appear in logs, errors or audit meta.

## 9. Pre-publish validation (`POST /validate-post`, also run on submit/schedule)

Limits live in `packages/shared/networkLimits.ts` so they can be edited without code changes elsewhere. **Verify every number against each network's current documentation before launch.**

| Network | Caption limit | Media requirement |
|---|---|---|
| Instagram | 2,200 | at least 1 image or video (square crop preview) |
| Facebook | 63,206 | optional |
| TikTok | 2,200 | video required |
| Threads | 500 | optional |
| X | 280 | optional |
| LinkedIn | 3,000 (verify) | optional |
| YouTube | title 100 / description 5,000 (verify) | video required |
| Pinterest | 500 (verify) | image required |

Issue list returned per network: `{network, severity: 'error'|'warning', code, message}` such as `OVER_LIMIT (by N)`, `MEDIA_REQUIRED`, `CHANNEL_DISCONNECTED`, `CHANNEL_PAUSED`, `TIME_IN_PAST`, `TOO_MANY_HASHTAGS`. Errors block Schedule/Submit; warnings do not. Counting uses grapheme clusters (emoji = 1) except where a network counts differently (X counts URLs as a fixed length - encode this in the limits file).

## 10. Analytics logic

- **Engagement rate (post)** = `(likes + comments + shares + saves) / impressions * 100`; `null` if impressions = 0.
- **Period engagement rate** = `sum(engagements) / sum(impressions) * 100` (weighted, not an average of rates).
- **Follower growth %** = `(followers_end - followers_start) / followers_start * 100`. "vs previous period" compares with the immediately preceding window of equal length (dashed line).
- **"x usual reach"** (top post badge) = post reach / median reach of that brand's posts in the previous 90 days.
- **Content mix**: counts by kind (photo, video, carousel, text) and by network deliveries.
- **Heatmap (7 x 24, workspace tz)**: for each weekday-hour cell use posts published in range. Smoothed score `(sum_eng + k * globalMean) / (n + k)` with `k = 3`; normalise to 0-100 against the max cell; cells with `n = 0` are "no data" (neutral colour).
- **Best times** (`/best-times`): from the heatmap take the top 3 cells where hour is 06-22, at least 2 hours apart, converted to the **next occurrence in the future**. If the brand has fewer than 20 published posts: return defaults (Tue 12:00, Thu 18:00, Sat 09:00) labelled "Suggested - not enough data yet".
- **Next free slot**: first hour boundary at least 30 min from now with no post on that brand and network within +/- 60 min.
- Metrics sync: `syncMetrics` hourly pulls channel daily stats and per-post stats for posts published in the last 30 days (daily for older ones up to 90 days). Idempotent upsert on `(channelId, date)`.
- CSV export columns: `date, brand, network, followers, impressions, reach, engagements, clicks, posts`; UTF-8 with BOM; formula-injection safe (prefix cells starting with `= + - @` with `'`).
- Scheduled report: cron by workspace tz; recipients may be external emails (validate, max 10, require OWNER/ADMIN); includes unsubscribe-free internal link only.

## 11. Inbox logic

- **Ingest** (webhook or poll): upsert by `(channelId, externalId)`. New incoming message on an existing conversation -> `unread=true`, `lastMessageAt`, and **reopen** if it was `CLOSED`.
- **Sentiment** (`lib/sentiment.ts`): rule-based (lexicon, negation handling, emoji map) returns `{label, score}`. Keep the function behind an interface so an LLM or external API can replace it later. Do not claim "AI" in the UI for v1.
- **Priority** = sentiment NEGATIVE, or text matches urgent terms (refund, broken, scam, legal, "not received", "still no", "cancel"), or sender flagged VIP **[CONFIRM list]**. Priority is a flag the user can toggle off.
- **Assign**: assignee must be an active member with `inbox.reply` and brand access; notify them; unassigned = `assigneeId null`.
- **First reply time** = first `OUT` message time minus conversation creation time; header shows the **median** over the last 30 days.
- **Reply**: create `OUT` message in state `sending`, call adapter, mark `sent` or `failed` (with Retry). Saved-reply variables: `{name}` (author first name), `{brand}`.
- **Notes** (`NOTE` direction) are never sent to the network; hide from CLIENT.
- Unread is shared per conversation in v1 (not per user).

## 12. Listening logic

- Keyword kinds: BRAND and TOPIC match case-insensitive on word boundaries; HASHTAG matches exactly; COMPETITOR matches the handle or name.
- Mentions dedupe on `(network, externalId, keywordId)`.
- **Net sentiment** = `(positive - negative) / total * 100`, shown like "39%".
- **Potential reach** = sum of mention author reach.
- **Share of voice** (7 days) = `brandMentions / (brandMentions + sum(competitorMentions)) * 100`.
- **Trending terms**: tokenise mentions of the last 7 days, remove stop-words, keep terms with count >= 3, rank by `count * lift` where `lift = count / max(1, countPrevious7d)`, top 20.
- "Reply in inbox" creates (or reuses) a `MENTION` conversation linked to the mention.

## 13. Team, invites, seats

- **Seats used** = `ACTIVE + INVITED` memberships. `SUSPENDED` does not count. Inviting when `used >= seatLimit` -> `402 SEATS_FULL`.
- **Invite**: random 32-byte URL-safe token; store only `sha256(token)`; expires in 7 days; **resend rotates the token** and extends expiry; cancel deletes it. Email enumeration safe: inviting an existing user adds a membership to this workspace.
- **Accept**: token valid and unexpired -> create user (name, password rules in file 04) or link existing; membership `ACTIVE`; set invite `acceptedAt`; audit; notify inviter.
- **Brand scope**: OWNER/ADMIN get `allBrands=true`. Every other role needs at least one brand (CLIENT: one or more). Removing the last brand from someone with brand-only access is blocked.
- **Suspend/remove**: revoke all refresh tokens immediately; reassign or unassign their open conversations; keep their authored posts/audit rows (author name stays).
- **2FA coverage** = active members with `totpEnabled` / active members. If `requireMfa` is turned on, members without 2FA are forced to set it up at next request (API returns `MFA_SETUP_REQUIRED`).

## 14. Notifications

| Event | Recipients | In-app | Email | Setting key |
|---|---|:-:|:-:|---|
| Approval requested | eligible approvers | Y | Y | `approvals` |
| Post approved / changes requested | author | Y | Y | `approvals` |
| Post failed / missed window | author, brand managers, connector | Y | Y | `failures` |
| Channel expiring / disconnected | OWNER, ADMIN, brand managers | Y | Y | `failures` |
| New mention in conversation I own / reply on my thread | assignee | Y | - | `mentions` |
| Conversation assigned to me | assignee | Y | - | `mentions` |
| Weekly digest (Mon 08:00 workspace tz) | opted-in members | - | Y | `digest` (default off) |

De-duplicate: same event + same entity within 10 minutes -> one notification. SSE pushes in-app ones instantly. Emails are queued (`sendEmail` job) with 3 retries.

## 15. Links, UTM, shortening

For each URL found in the caption at publish time: keep existing `utm_*` params; otherwise add `utm_source={workspace.utmSource}`, `utm_medium=social`, `utm_campaign={campaign slug or brand slug}`, `utm_content={network}`. If `shortenLinks`: replace with `{API_URL}/s/{code}` (table `ShortLink{code,url,postTargetId,clicks,createdAt}`; redirect 302 and count the click; rate-limit; block non-http(s) schemes and private-IP targets). The stored caption stays untouched; shortening happens per target at publish.

## 16. Audit rules

Log (append-only, no update/delete API): login success/fail, 2FA changes, password change, invite/accept/cancel, role or brand change, suspend/remove, channel connect/disconnect/reconnect/toggle, workspace setting changes (esp. approval mode), every post transition (including submit, approve, changes, schedule, reschedule, retry, delete, undo), library deletes, data export, report schedule changes. Each row: `actorId, action, entity, entityId, brandId, meta (before/after for settings), ip, at`. Retention 12 months **[CONFIRM]**. Team activity cards render these as plain English ("Elise approved a post for Brand X").

## 17. Edge cases that must be handled

1. Two approvers click Approve at the same time -> second gets `409`, UI refreshes the card.
2. Author edits a post while an approver is reviewing -> approve call fails with stale `version`; approver sees "Updated by author - review again".
3. Approver loses access to the brand after the post is queued -> they disappear from "Can approve"; existing pending posts remain approvable by others.
4. Target channel deleted or disconnected between approval and publish time -> that target fails; others proceed (partial failure).
5. Server downtime over scheduled time -> `MISSED_WINDOW` after grace (section 7); user can reschedule in one click.
6. Duplicate webhook deliveries -> ignored by unique `(channelId, externalId)`.
7. User in two workspaces (future) -> `ctx` is per workspace; v1 supports exactly one membership per user per workspace and a workspace switcher is out of scope.
8. Daylight-saving boundaries -> section 7 rules; include unit tests for the nonexistent and ambiguous hour.
9. Very long captions with emoji -> grapheme-aware counting.
10. Deleting a brand with scheduled posts -> blocked until they are cancelled or moved.
11. Seat limit reached while invite pending -> accepting still works (the seat was already counted).
12. Clock skew -> always use database time (`UTC_TIMESTAMP()`) for scheduler comparisons.

## 18. Out of scope for v1 (do not build unless asked)

Per-user custom permissions UI, multi-workspace switching, Stripe checkout (billing page is read-only), AI caption writing, link-in-bio pages, ad management, mobile apps.
