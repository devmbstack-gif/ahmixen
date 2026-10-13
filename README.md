# AhmiXen — Next.js

Live AI masterclass landing page built with Next.js App Router, React, TypeScript, and Tailwind CSS.

## Scripts

```bash
npm install
npm run dev         # http://localhost:3000
npm run typecheck
npm run build
npm run start
npm run lint
```

## Stack

- Next.js (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React

## Deploy on Vercel

1. Import the repo in Vercel (Framework Preset: **Next.js**).
2. Set these environment variables for Production and Preview (see `.env.example`):
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `AUTH_SECRET` — long random secret (`openssl rand -hex 32`)
   - `SITE_URL` — public origin, e.g. `https://your-domain.com`
3. In Atlas Network Access, allow Vercel to connect (often `0.0.0.0/0` for serverless).
4. Deploy. After the first deploy, create the admin locally or via a one-off seed:
   `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` then `npm run seed:admin` (with `ALLOW_SEED=true` if needed).
5. Optional: `CHECKOUT_HOLD_MINUTES`, `RATE_LIMIT_SALT`.

Build command: `npm run build` · Output: Next.js default (no custom `vercel.json` required).
