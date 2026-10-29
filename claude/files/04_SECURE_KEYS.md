# 04 - SECURE KEYS, SECRETS & SECURITY CONFIGURATION

Companion to `01_FRONTEND.md`, `02_BACKEND.md`, `03_LOGIC.md`.
**This file contains NO real secrets.** Every value shown is a placeholder or example only.
Real secrets go in `.env` files (never committed to git) and in the hosting platform's secret manager.

---

## 1. Environment Files

### File layout (monorepo root)

```
.env.example          <- Committed to git (placeholder values, comments, no real secrets)
.env                  <- NOT committed. Copy from .env.example, fill in real values locally.
.env.production       <- NOT committed. Populated by CI/CD pipeline or hosting secret manager.
apps/api/.env         <- Symlink or copy of root .env for local Node server
apps/web/.env         <- VITE_ variables only (public). Never put secrets here.
```

Add `.env`, `.env.*.local`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks` to `.gitignore`.
Run `git secrets --scan` or `truffleHog --only-verified` in CI to catch accidental commits.

---

## 2. Complete `.env.example` (all variables with descriptions)

```dotenv
# DATABASE
# XAMPP local: mysql://root:@localhost:3306/postdesk
# Production:  mysql://USER:PASS@HOST:3306/postdesk?ssl=true
DATABASE_URL="mysql://root:@localhost:3306/postdesk"

# APP RUNTIME
NODE_ENV="development"          # development | production | test
PORT=4000
API_URL="http://localhost:4000"
WEB_URL="http://localhost:5173"

# JWT TOKENS
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Use DIFFERENT keys for access and refresh.
JWT_ACCESS_SECRET="REPLACE_WITH_64_BYTE_HEX_SECRET_1"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_SECRET="REPLACE_WITH_64_BYTE_HEX_SECRET_2"
JWT_REFRESH_EXPIRY="30d"

# ENCRYPTION (AES-256-GCM for TOTP secrets and OAuth tokens at rest)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="REPLACE_WITH_32_BYTE_HEX_KEY"
# Stored format: "v1:<iv>:<tag>:<cipher>"
# Rotation: add ENCRYPTION_KEY_PREV, migrate all rows, then remove ENCRYPTION_KEY_PREV

# COOKIE
COOKIE_SECRET="REPLACE_WITH_32_BYTE_HEX_SECRET"
COOKIE_DOMAIN="localhost"   # ".yourdomain.com" in prod
COOKIE_SECURE="false"       # true in prod (HTTPS only)

# EMAIL (SMTP)
SMTP_HOST="localhost"       # dev: Mailpit localhost:1025; prod: your SMTP provider
SMTP_PORT=1025
SMTP_SECURE="false"         # true for port 465
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="PostDesk <noreply@yourdomain.com>"

# FILE STORAGE
STORAGE_DRIVER="local"      # local | s3
UPLOAD_DIR="./uploads"      # never inside web root
MAX_IMAGE_MB=25
MAX_VIDEO_MB=200
# S3-compatible (leave blank if driver=local)
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_ENDPOINT=""              # blank for AWS; fill for Cloudflare R2, MinIO, etc.

# SOCIAL NETWORK OAUTH APPS
# Redirect URI: {API_URL}/api/v1/channels/oauth/{network}/callback
META_APP_ID=""
META_APP_SECRET=""
LINKEDIN_CLIENT_ID=""
LINKEDIN_CLIENT_SECRET=""
X_CLIENT_ID=""
X_CLIENT_SECRET=""
TIKTOK_CLIENT_KEY=""
TIKTOK_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
PINTEREST_APP_ID=""
PINTEREST_APP_SECRET=""
THREADS_APP_ID=""
THREADS_APP_SECRET=""

# WEBHOOK VERIFICATION SECRETS
WEBHOOK_SECRET_META=""
WEBHOOK_SECRET_LINKEDIN=""
WEBHOOK_SECRET_X=""

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_GLOBAL=300
RATE_LIMIT_MAX_LOGIN=5
RATE_LIMIT_MAX_INVITES=20

# MISC
LOG_LEVEL="info"
SEED_OWNER_EMAIL="owner@example.com"
NETWORK_MODE="mock"         # mock | live
LATE_PUBLISH_GRACE_MIN=30
SHORT_LINK_BASE_URL="${API_URL}/s"
```

Frontend (`apps/web/.env`):
```dotenv
VITE_API_URL="http://localhost:4000/api/v1"
VITE_APP_NAME="PostDesk"
VITE_SENTRY_DSN=""
```
Every `VITE_` variable is bundled into client JS. NEVER put secrets there.

---

## 3. Secret Generation Commands

```bash
# 64-byte hex for JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 32-byte hex for ENCRYPTION_KEY and COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# URL-safe base64 alternative
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Store in a password manager (Bitwarden, 1Password) or the hosting platform secret manager
(Render: Environment -> Secret Files, Railway: Variables, Vercel: Environment Variables Sensitive).
Never share over Slack, email, or commit to git.

---

## 4. Token Encryption at Rest (`lib/crypto.ts`)

Social OAuth tokens and TOTP secrets are NEVER stored in plaintext.
AES-256-GCM with a random 12-byte IV per encryption:

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const VERSION = 'v1';
const ALG     = 'aes-256-gcm';
const KEY     = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // must be 32 bytes

export function encrypt(plain: string): string {
  const iv  = randomBytes(12);
  const cip = createCipheriv(ALG, KEY, iv);
  const ct  = Buffer.concat([cip.update(plain, 'utf8'), cip.final()]);
  const tag = cip.getAuthTag();
  // Format: "v1:<iv_hex>:<tag_hex>:<ct_hex>"
  return `${VERSION}:${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

export function decrypt(stored: string): string {
  const [version, ivHex, tagHex, ctHex] = stored.split(':');
  if (version !== VERSION) throw new Error('Unknown encryption version');
  const iv  = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ct  = Buffer.from(ctHex, 'hex');
  const dec = createDecipheriv(ALG, KEY, iv);
  dec.setAuthTag(tag);
  return dec.update(ct).toString('utf8') + dec.final('utf8');
}
```

Key rotation plan:
1. Set new ENCRYPTION_KEY in env, move old to ENCRYPTION_KEY_PREV.
2. Run one-time migration job: SELECT every encrypted field, decrypt with prev, encrypt with new, UPDATE.
3. Remove ENCRYPTION_KEY_PREV after confirming all rows migrated.

---

## 5. Password Rules (`lib/password.ts`)

- Minimum 12 characters (no max below 72; argon2 handles longer safely).
- Hash with **argon2id** (`argon2` npm package): memoryCost 65536, timeCost 3, parallelism 4.
- Breached password check: hash locally, compare prefix with HaveIBeenPwned k-Anonymity API (no plaintext leaves server).
- Recovery codes: 8 codes, each 8 alphanumeric chars, stored as individual argon2id hashes. Show once. Mark used = set redeemedAt.

```typescript
import argon2 from 'argon2';

const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

export const hashPassword   = (plain: string) => argon2.hash(plain, ARGON_OPTIONS);
export const verifyPassword = (hash: string, plain: string) => argon2.verify(hash, plain);
```

---

## 6. JWT Strategy

```
ACCESS TOKEN
  Algorithm  : HS256 (upgrade to RS256 if public key endpoint added later)
  Expiry     : 15 minutes
  Payload    : { sub: userId, wid: workspaceId, jti: uuid, iat, exp }
  Storage    : Memory only on client (Zustand). NEVER localStorage.
  Refresh    : Issued on every /auth/refresh call.

REFRESH TOKEN
  Algorithm  : HS256
  Expiry     : 30 days (sliding)
  Storage    : httpOnly + Secure + SameSite=Strict cookie
  DB record  : { tokenHash: sha256(token), familyId, userId, expiresAt, revokedAt }
  Rotation   : Every /auth/refresh issues NEW token; old one revoked immediately.
  Reuse detection: If a revoked token is presented -> revoke ENTIRE family (all sessions logged out).
  Invalidated when: password changed, user suspended, manual revoke from Sessions page.
```

Access token MUST include workspaceId (wid) - middleware reads it from token, never from request body.

---

## 7. TOTP / 2FA (`lib/totp.ts`)

```typescript
import { authenticator } from 'otplib';

authenticator.options = {
  window: 1,    // accept 1 step before/after for 30s clock skew
  step:   30,
  digits: 6,
};

export const generateSecret = () => authenticator.generateSecret(20); // 160-bit secret
export const generateQrUri  = (email: string, secret: string) =>
  authenticator.keyuri(email, 'PostDesk', secret); // pass to QR code library
export const verifyToken    = (token: string, secret: string) =>
  authenticator.verify({ token, secret });
```

2FA Setup Flow:
1. POST /me/2fa/setup -> generate secret, encrypt at rest, return QR URI + manual key + 8 recovery codes (hashed in DB, shown once only).
2. POST /me/2fa/setup/confirm body {code} -> verify code -> totpEnabled = true; audit log.
3. Login: after password OK -> return {needs2fa: true, challengeId}; client POSTs {challengeId, code}; server verifies, clears challengeId (5-min TTL in DB), issues tokens.
4. Recovery code: constant-time hash compare against stored hashes; mark used; if 0 remain, notify user to regenerate.

---

## 8. HTTP Security Headers (Helmet + custom CSP)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],             // no unsafe-inline; use hash nonces if needed
      styleSrc:    ["'self'", "'unsafe-inline'"], // Tailwind CSS requires this
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'", process.env.API_URL!],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
      baseUri:     ["'self'"],
      formAction:  ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true }, // prod only
}));
```

CORS allow-list:
```typescript
import cors from 'cors';

const ALLOWED = new Set(
  [process.env.WEB_URL, 'http://localhost:5173'].filter(Boolean)
);

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED.has(origin)),
  credentials: true,    // required for httpOnly refresh-token cookie
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
```

---

## 9. Upload Security

1. Client-side: check extension + size in FileDropzone before upload (UX only; server re-validates everything).
2. Server-side (multer):
   - Accept multipart/form-data only on upload routes.
   - Enforce max file size via multer limits.
   - MAGIC BYTES CHECK after buffer received: read first 12 bytes, compare known signatures:
     - PNG:  89 50 4E 47 0D 0A 1A 0A
     - JPG:  FF D8 FF
     - WebP: 52 49 46 46 xx xx xx xx 57 45 42 50
     - MP4:  xx xx xx xx 66 74 79 70
   - Re-encode images with `sharp` (strips EXIF/GPS metadata automatically).
   - Store with crypto.randomUUID() filename - NEVER use user-supplied filename.
   - Serve with Content-Disposition: attachment and X-Content-Type-Options: nosniff headers.

---

## 10. Rate Limiting Strategy

```typescript
import rateLimit from 'express-rate-limit';

// Global per-user (applied after auth middleware)
export const globalLimit = rateLimit({
  windowMs: 60_000,
  max: 300,
  keyGenerator: (req) => req.ctx?.userId ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

// Login attempts - per email+IP (applied before auth)
export const loginLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 5,
  keyGenerator: (req) => `${req.body?.email ?? 'unknown'}:${req.ip}`,
  skipSuccessfulRequests: false,
  handler: (_req, res) => res.status(429).json({
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' },
  }),
});

// Upload per user
export const uploadLimit = rateLimit({
  windowMs: 10 * 60_000,
  max: 30,
  keyGenerator: (req) => req.ctx?.userId ?? req.ip,
});
```

---

## 11. Input Sanitisation Rules

| Context | Rule |
|---|---|
| SQL queries | Always use Prisma parameterised queries - NEVER string-interpolate user input |
| HTML rendering | React escapes by default; never use dangerouslySetInnerHTML without DOMPurify |
| Email body | Escape HTML; never insert user strings into SMTP headers (header injection risk) |
| File paths | Never construct paths from user input; use only UUID-named stored paths |
| CSV export | Prefix cells starting with = + - @ with apostrophe to prevent formula injection |
| Application logs | Redact tokens, passwords, raw payloads (pino `redact` option) |
| Error responses | Never return stack traces, SQL errors, or internal paths in production |
| Webhook payloads | Verify HMAC on raw body BEFORE JSON.parse; reject on mismatch; respond fast |
| Short-link redirect | Block javascript: scheme and private/internal IP targets (SSRF prevention) |

---

## 12. Security Checklist Before Client Launch

- [ ] .env is in .gitignore; `git log -- .env` shows nothing committed
- [ ] `git secrets --scan` and `truffleHog` pass in CI pipeline
- [ ] All JWT secrets are >= 64 bytes, generated with crypto.randomBytes
- [ ] ENCRYPTION_KEY is exactly 32 bytes (hex = 64 chars); encrypt/decrypt round-trip test passes
- [ ] Refresh token reuse detection unit-tested (file 02_BACKEND.md section 12)
- [ ] Self-approval blocked in API (not just UI); covered by unit test
- [ ] Tenant isolation tested: user from workspace A gets 404 on workspace B resources
- [ ] Login brute-force: 6th attempt in 15 min returns 429 with retryAfter
- [ ] Upload: magic-bytes check rejects a .jpg file containing PHP or JS payload
- [ ] Upload: EXIF stripped; verify with `exiftool` - no GPS in stored images
- [ ] All production responses have Strict-Transport-Security (HSTS) header
- [ ] CSP script-src 'self' - no unsafe-eval or unsafe-inline for scripts
- [ ] `npm audit --omit=dev` returns zero high or critical vulnerabilities
- [ ] Tokens never appear in application logs (pino redact configured)
- [ ] OAuth state + PKCE verified on callback; missing/mismatched state rejected
- [ ] Webhook HMAC verified on raw body before JSON.parse; 200 returned before processing
- [ ] requireMfa flow tested: user without 2FA blocked from API until setup complete
- [ ] Sessions page revoke logs out other devices within 15 min (access token TTL)
- [ ] Data export (Owner only) confirmed behind workspace.manage + OWNER role check
- [ ] Short-link redirect blocks javascript: and private-IP targets
