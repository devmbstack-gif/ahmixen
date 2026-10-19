# API overview

Base URL (local): `http://localhost:3000`  
JSON APIs under `/api/...`. Admin routes require an authenticated admin session cookie (except login / password-reset endpoints).

Public routes enforce **Origin** checks and **rate limits** (see `src/lib/public/rateLimitConfig.ts`).

This is a practical map of routes, not a full OpenAPI spec. Request/response shapes live next to handlers and Zod schemas under `src/lib/**/schema*.ts`.

---

## Public APIs (`/api/public/...`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/public/checkout` | Checkout config (plans, hold minutes, etc.) |
| GET | `/api/public/session` | Landing/active session info |
| POST | `/api/public/orders` | Create reserve/checkout order |
| GET | `/api/public/orders/[token]` | Order status by public token |
| GET | `/api/public/orders/[token]/payment-info` | Bank / wallet payment details |
| POST | `/api/public/orders/[token]/proof` | Upload payment screenshot |
| POST | `/api/public/leads` | Lead capture (legacy/general form) |
| POST | `/api/public/workshop-register` | Workshop registration + proof + lead |
| POST | `/api/public/feedback` | Public testimonial feedback (saved pending) |

### Other public

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/media/[id]` | Serve media asset |

---

## Admin auth (`/api/admin/auth/...`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/admin/auth/login` | Login |
| POST | `/api/admin/auth/logout` | Logout |
| GET | `/api/admin/auth/warm` | Session warm / check |
| GET/PATCH | `/api/admin/auth/account` | Account settings |
| POST | `/api/admin/auth/forgot-password` | Start OTP reset |
| POST | `/api/admin/auth/verify-otp` | Verify OTP |
| POST | `/api/admin/auth/reset-password` | Set new password |

---

## Admin resources (`/api/admin/...`)

### Sessions
- `GET/POST /api/admin/sessions`
- `GET/PATCH/DELETE /api/admin/sessions/[id]`
- `POST /api/admin/sessions/[id]/activate`
- `GET /api/admin/sessions/dashboard`

### Orders / bookings
- `GET /api/admin/orders`
- `GET /api/admin/orders/dashboard`
- `GET /api/admin/orders/[id]`
- `POST /api/admin/orders/[id]/approve`
- `POST /api/admin/orders/[id]/reject`
- `POST /api/admin/orders/[id]/cancel`
- `POST /api/admin/orders/[id]/note`
- `POST /api/admin/orders/[id]/resend-email`
- `GET /api/admin/orders/[id]/proof`

### Reservations & leads
- `GET /api/admin/reservations` (+ export)
- `GET/PATCH/DELETE /api/admin/leads/[id]`
- `GET /api/admin/leads` (+ export)
- `GET /api/admin/leads/[id]/proof`

### Content, plans, media, testimonials
- `GET/PATCH /api/admin/content`, `.../content/[key]`, reset
- `GET/POST /api/admin/plans`, `.../plans/[id]`, status, landing, workshop flags
- `GET/POST /api/admin/media`, `.../media/[id]`, usages
- `GET/POST /api/admin/testimonials`, reorder, visibility, CRUD by id

### Settings
- `GET/POST /api/admin/settings/email` (status + test send)
- `GET/PATCH /api/admin/settings/payment`

---

## Email jobs (internal)

Not a separate public HTTP API. Sends are queued as `EmailJob` documents and sent via SMTP (`EMAIL_MODE=smtp`) or logged (`EMAIL_MODE=log`). Triggers include order approve (customer confirmation) and new booking / proof (admin notify).

---

## Auth notes for integrators

- Browser admin UI uses cookie session after `/api/admin/auth/login`.  
- Public POSTs from browsers must send a valid `Origin` / host allowed by `SITE_URL` and Vercel URL helpers.  
- Do not expose admin routes without authentication.
