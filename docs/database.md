# Database structure (MongoDB)

AhmiXen uses **MongoDB** with **Mongoose**. There are no SQL migrations. Collections are created/updated by the application when models are used (`syncIndexes` helpers exist for some domains).

Canonical definitions: `src/models/*.ts`.

## Collections overview

| Collection (typical) | Model file | Purpose |
|----------------------|------------|---------|
| `admins` | `Admin.ts` | Admin users (email, password hash, name) |
| `adminpasswordresets` | `AdminPasswordReset.ts` | OTP / password-reset challenges |
| `sessions` | `Session.ts` | Live workshop sessions, seats, holds, meeting link |
| `orders` | `Order.ts` | Bookings / checkout + workshop registrations, proof refs, status |
| `leads` | `Lead.ts` | CRM leads from forms / workshop / reserve |
| `plans` | `Plan.ts` | Pricing plans (checkout / landing / workshop) |
| `testimonials` | `Testimonial.ts` | Reviews; public feedback starts with `visible: false` |
| `mediaassets` | `MediaAsset.ts` | Uploaded / library media metadata (GridFS / static) |
| `sitecontents` | `SiteContent.ts` | Editable landing content blocks by key |
| `settings` | `Setting.ts` | Keyed settings (e.g. email test meta, payment display) |
| `emailjobs` | `EmailJob.ts` | Outbox for reservation + admin booking emails |
| `ratelimits` | `RateLimit.ts` | Public API rate-limit counters |
| `counters` | `Counter.ts` | Sequences (e.g. order numbers) |
| `auditlogs` | `AuditLog.ts` | Admin action audit trail |

Exact collection names follow Mongoose defaults (often pluralized lowercase of the model name) unless `collection:` is set on the schema.

## Important enums / statuses

### Order (`orders`)

Typical statuses include:

- `awaiting_payment` — reserve created, waiting for proof  
- `pending_verification` — proof uploaded, admin review  
- `approved` — seat confirmed  
- `rejected` / `cancelled` / `expired`  

Also: `sourceKind` (`checkout` | `workshop`), customer snapshot, amounts, optional `workshopMeta`, payment proof file id (GridFS).

### Lead (`leads`)

Statuses: `new` | `contacted` | `converted` (and related CRM fields).

### Testimonial (`testimonials`)

- `visible: true` → shown on public site  
- `visible: false` + `source: 'feedback'` → **Pending** public submission  
- `source: 'admin'` → created in admin panel  

### Session (`sessions`)

Open/closed status, seat totals, confirmed seats, time-limited holds tied to order ids.

## Indexes

Models define indexes for common queries (e.g. order `publicToken`, lead `emailNormalized` unique, email job `orderId + type` unique, testimonial `visible + sortOrder`). Prefer running the app once against a fresh DB so indexes can sync, or use existing `ensure*Indexes` helpers in the codebase.

## Binary / files

Payment screenshots and some media are stored via **GridFS** (or static paths for library assets), referenced by id from `orders` / `leads` / `mediaassets` — not as SQL BLOBs.

## Fresh environment

1. Create an empty MongoDB database.  
2. Set `MONGODB_URI` in `.env.local` / Vercel.  
3. Run seeds as needed (`seed:admin`, `seed:session`, `seed:plan`, `seed:content`).  
4. Do **not** restore production customer data into shared/dev DBs without approval.
