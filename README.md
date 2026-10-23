# AhmiXen

Live AI workshop + mentorship landing site with public checkout/reserve flow, payment proof upload, admin panel (sessions, bookings, leads, content, testimonials), transactional email, and a public feedback form (admin-approve before live).

## Tech stack and versions

| Layer | Package / service | Version (see `package.json`) |
|--------|-------------------|------------------------------|
| Runtime | Node.js | `>= 20.9.0` |
| Framework | Next.js (App Router) | `^15.5.4` |
| UI | React | `^19.2.8` |
| Language | TypeScript | `~5.9.2` |
| Styling | Tailwind CSS | `^4.3.3` |
| Database | MongoDB + Mongoose | `^9.11.1` |
| Validation | Zod | `^4.6.5` |
| Auth (admin) | Jose (JWT cookies) + bcryptjs | jose `^6.2.12`, bcryptjs `^3.0.3` |
| Email | Nodemailer (SMTP) | `^10.1.0` |
| Motion | Framer Motion | `^14.0.0` |
| Lint | oxlint | `^1.81.0` |
| Hosting (typical) | Vercel | — |
| Database hosting (typical) | MongoDB Atlas | — |

There is **no SQL migration folder**. Schema is defined in Mongoose models under `src/models/`. See [docs/database.md](docs/database.md).

## Project overview

- **Public site:** landing, programs, reserve/checkout, pay + proof upload, testimonials, feedback (`/feedback`), privacy/terms.
- **Admin (`/admin`):** sessions, orders/bookings, reservations, leads, landing content, testimonials (approve feedback), instructor, media, pricing plans, email/payment settings, account password reset (OTP).
- **Email:** reservation confirmed (customer) + new booking to review (admin); outbox jobs in MongoDB.
- **Feedback:** public form → testimonial saved as **Pending** (`visible: false`) until admin shows it on the site.

## Setup (local)

1. Clone the repo and install:

   ```bash
   git clone <company-repo-url>
   cd ahmixen
   npm install
   ```

2. Copy env template and fill values (never commit real secrets):

   ```bash
   cp .env.example .env.local
   ```

   Minimum for local run:

   - `MONGODB_URI`
   - `AUTH_SECRET` (e.g. `openssl rand -hex 32`)
   - `SITE_URL=http://localhost:3000`
   - `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_WHATSAPP_NUMBER` (footer / WhatsApp float)

   For real email locally: set `EMAIL_MODE=smtp` and SMTP vars (see `.env.example`).

3. Start MongoDB Atlas (or local Mongo) and ensure the URI points at an empty or dedicated DB for this project.

4. Seed an admin (one-time):

   ```bash
   # In .env.local: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
   # Use ALLOW_SEED=true if your DB name looks production-like
   npm run seed:admin
   ```

5. Optional seeds (session, plans, content, payment display):

   ```bash
   npm run seed:session
   npm run seed:plan
   npm run seed:content
   npm run seed:payment
   ```

6. Run the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and admin at [http://localhost:3000/admin](http://localhost:3000/admin).

7. Useful checks:

   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

## Deployment (Vercel)

1. Import the GitHub repo in Vercel (Framework: **Next.js**).
2. Set **Environment Variables** for Preview and/or Production from `.env.example` (at least `MONGODB_URI`, `AUTH_SECRET`, `SITE_URL`, and SMTP vars if sending mail).
3. `SITE_URL` must be the public site origin (e.g. `https://your-domain.com` or the Vercel Preview URL).
4. In MongoDB Atlas **Network Access**, allow the deployment environment (often `0.0.0.0/0` for serverless).
5. Deploy. Create admin via `npm run seed:admin` against the same DB (from a trusted machine) if no admin exists yet.
6. After changing env vars, **Redeploy** so the new values load.

Build: `npm run build` · Start: Next.js default (no custom `vercel.json` required).

## Credentials — where they are stored

| What | Where |
|------|--------|
| Env var **names** (no values) | `.env.example` in this repo |
| Real secrets (DB, SMTP, `AUTH_SECRET`, admin bootstrap, hosting) | **Company password manager** only — not GitHub, not WhatsApp, not email |
| Local developer secrets | `.env.local` (gitignored) |
| Production/Preview secrets | Vercel → Project → Settings → Environment Variables |

**Do not commit** `.env`, `.env.local`, or any file with real passwords, API keys, or tokens.

## Documentation in this repo

- [docs/database.md](docs/database.md) — MongoDB collections / model overview  
- [docs/api.md](docs/api.md) — Public and admin HTTP API overview  
- `.env.example` — all required/optional environment variable names  

## Scripts (selected)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Next.js dev server |
| `npm run build` / `start` | Production build and serve |
| `npm run seed:admin` | Create first admin user |
| `npm run seed:session` / `seed:plan` / `seed:content` / `seed:payment` | Bootstrap content |
| `npm run clear:user-data` | QA wipe of orders/leads/etc. (dangerous; use carefully) |
| `npm run test:checkout` | Checkout flow harness (dev) |

## License / ownership

Private company project. Source is intended for the company GitHub organization account only.
