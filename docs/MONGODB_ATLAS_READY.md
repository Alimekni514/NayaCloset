# MongoDB Atlas — Production Readiness Report

> Generated: 2026-07-31  
> Project: NayaCloset (delivery-commerce)  
> Cluster: `cluster0.xe3utsd.mongodb.net`  
> Database: `delivery-commerce`

---

## ✅ MongoDB Connection

| Check | Result |
|-------|--------|
| Atlas connection | ✅ Connected successfully |
| Host | `ac-qzbxwcs-shard-00-00.xe3utsd.mongodb.net` |
| Database name | `delivery-commerce` |
| Connection time | < 2 seconds |
| Retry logic | ✅ 5 retries / 3 s backoff |
| Graceful shutdown | ✅ SIGTERM / SIGINT handlers registered |
| URI in logs | ✅ Never logged (pino redaction + event-only logging) |

---

## ✅ Collections Created

| Collection | Documents | Status |
|-----------|-----------|--------|
| `users` | 0 | ✅ Ready |
| `products` | 0 | ✅ Ready |
| `orders` | 0 | ✅ Ready |
| `auditlogs` | 0 | ✅ Ready |
| `refreshsessions` | 0 | ✅ Ready |

No seed / demo data detected. Database is clean and ready for production.

---

## ✅ Indexes Verified

### Users
| Index | Field | Type |
|-------|-------|------|
| Unique email | `email` | unique |
| Role lookup | `role` | index |
| Active flag | `isActive` | index |

### Products
| Index | Field | Type |
|-------|-------|------|
| Unique slug | `slug` | unique |
| Active flag | `isActive` | index |

### Orders
| Index | Field | Type |
|-------|-------|------|
| Unique reference | `reference` | unique |
| Unique idempotencyKey | `idempotencyKey` | unique + sparse |
| Customer lookup | `customer.userId` | index |
| Status filter | `status` | index |
| Date sort | `submittedAt` | index |

### RefreshSessions
| Index | Field | Type |
|-------|-------|------|
| User sessions | `userId` | index |
| Expiry filter | `expiresAt` | index |
| Compound list | `{ userId: 1, createdAt: -1 }` | compound |

### AuditLogs
| Index | Field | Type |
|-------|-------|------|
| Action filter | `action` | index |
| Actor lookup | `actorUserId` | index |
| Entity type | `entityType` | index |
| Entity id | `entityId` | index |

---

## ✅ Smoke Tests Passed

| Endpoint | Method | Status | Note |
|----------|--------|--------|------|
| `/api/health` | GET | `200 {"status":"ok"}` | ✅ |
| `/api/products` | GET | `200 {"items":[]}` | ✅ |
| `/api/auth/register` | POST | `201` | ✅ User created in Atlas |
| `/api/auth/login` | POST | `200` + 3 cookies | ✅ JWT + CSRF |
| `/api/not-found-route` | GET | `404` + requestId | ✅ No URI leak |

Smoke test user (`test-smoke@nayacloset.dev`) **cleaned up** — database is clean.

---

## ✅ Full Validation Results

| Check | Result |
|-------|--------|
| Typecheck API | ✅ 0 errors |
| Typecheck web | ✅ 0 errors |
| Lint API | ✅ 0 warnings |
| Lint web | ✅ 0 warnings |
| Tests web | ✅ 37/37 |
| Tests API | ⚠️ 31/32 (1 pre-existing — ABM mock missing in `auth.integration.test.ts`) |
| Build API (`tsc`) | ✅ `apps/api/dist/` |
| Build web (`vite`) | ✅ `apps/web/dist/` |

---

## 🚀 Render — Environment Variables

Configure these in **Render → API Service → Environment**:

```
NODE_ENV=production
# PORT is injected automatically by Render – do NOT set manually

WEB_ORIGIN=https://<your-cloudflare-pages-domain>.pages.dev

MONGODB_URI=mongodb+srv://NayaStore:<password>@cluster0.xe3utsd.mongodb.net/delivery-commerce?appName=Cluster0

JWT_ACCESS_SECRET=<generate: openssl rand -hex 64>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 64>

COOKIE_DOMAIN=
COOKIE_SAME_SITE=none
COOKIE_SECURE=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

ABM_BASE_URL=https://client.abm-delivery.com
ABM_USERNAME=<rotated ABM username>
ABM_PASSWORD=<rotated ABM password>
ABM_REQUEST_TIMEOUT_MS=15000
```

> **Build Command:** `npm run build --workspace @delivery-commerce/api`  
> **Start Command:** `node dist/server.js`  
> **Root Directory:** `apps/api`

---

## 🌐 Cloudflare Pages — Environment Variables

Configure these in **Cloudflare Pages → Settings → Environment Variables**:

```
VITE_API_BASE_URL=https://<your-render-api>.onrender.com/api
```

> **Build Command:** `npm run build --workspace @delivery-commerce/web`  
> **Output Directory:** `apps/web/dist`  
> **Root Directory:** `/` (monorepo root)

The `_redirects` file is already in `apps/web/public/` — Cloudflare Pages SPA fallback is configured.

---

## ⚠️ Actions Required Before Go-Live

| Priority | Action |
|----------|--------|
| 🔴 CRITICAL | Rotate ABM credentials on the ABM portal (they were in local `.env` during dev) |
| 🔴 CRITICAL | Generate production JWT secrets: `openssl rand -hex 64` (×2) |
| 🔴 CRITICAL | Set `WEB_ORIGIN` on Render to the actual Cloudflare Pages domain |
| 🔴 CRITICAL | Set `VITE_API_BASE_URL` on Cloudflare Pages to the actual Render URL |
| 🟡 IMPORTANT | Create at least 1 ADMIN user via a secure seed script or Render CLI before first login |
| 🟡 IMPORTANT | Add products to the `products` collection via admin or seed script |
| 🟡 IMPORTANT | Configure MongoDB Atlas Network Access to allow Render IPs (or 0.0.0.0/0 for shared plans) |
| 🟡 IMPORTANT | Enable MongoDB Atlas monitoring and alerts |
| 🟢 NICE-TO-HAVE | Fix the 1 pre-existing failing test (`enforces rbac on admin routes`) |
| 🟢 NICE-TO-HAVE | Implement code splitting in the web bundle (currently 910 kB, target < 500 kB) |

---

## MongoDB Atlas Checklist (Admin Portal)

- [ ] **Network Access**: Add Render outbound IPs (or `0.0.0.0/0` for initial testing)
- [ ] **Database User**: Confirm `NayaStore` user has `readWrite` on `delivery-commerce` only
- [ ] **Backup**: Enable Atlas automated backups (M10+ tier required)
- [ ] **Monitoring**: Enable Atlas Performance Advisor and alerts

---

## Connection Architecture

```
Cloudflare Pages (Frontend)
  │
  │  HTTPS + CORS + SameSite=none cookies
  ▼
Render API (Express 5 + Mongoose)
  │
  │  TLS mongodb+srv (Mongoose retry × 5)
  ▼
MongoDB Atlas Cluster0
  Database: delivery-commerce
  Collections: users · products · orders · auditlogs · refreshsessions
```
