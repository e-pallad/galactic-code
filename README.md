# Galactic Code

A space-themed RPG learning platform where developers complete coding missions to earn XP, rank up, and unlock gear — while the platform automates their learning progression.

**Live demo:** [galacticcode.dev/demo](https://galacticcode.dev/demo)

---

## What it is

Galactic Code wraps structured programming education in a persistent RPG layer. Each lesson is a **Mission**, each month of content is a **Star System**, and progress earns **XP**, **Credits**, and **Medals**. Users spend Credits in the Armory to outfit their ship, then battle **Void Entities** in the Combat Arena — solo or with their **Fleet**.

The goal: make daily learning feel less like homework and more like logging into a game.

---

## Features

### Academy
- Structured missions organized into Star Systems → Sectors → Missions
- Four mission types: Briefing, Training Op, Strike Mission, Debrief
- Focus Cycle (Pomodoro) sessions that award bonus XP
- Skill Check quizzes with graded XP rewards (5 / 20 / 35 XP)
- Mission notes editor per lesson

### Progression
- XP-based rank system with 10 ranks (Cadet → Starfleet Legend)
- Hyperdrive Charge (streak) with freeze mechanic
- 11 unlockable Medals with XP bonuses
- Daily login XP and weekly streak bonuses
- AI-generated study recommendations via Anthropic SDK

### Combat Arena
- Turn-based battles against Void Entities (4 rarity tiers)
- Fleet battles: groups of pilots team up for boss encounters
- Ship loadout: weapon, shield, engine, and skin gear slots
- Credits-based Armory with item drop loot tables

### Social & Viral
- **Referral system** — shareable `/r/[code]` links; both parties earn +50 XP on signup
- **Achievement share cards** — dynamic OG images for rank-ups and medals, shareable to X/Twitter and LinkedIn
- **Public leaderboard** with opt-in visibility
- Fleet system with crew roles (Captain, Officer, Pilot) and presence indicator

### Platform
- Star Map — visual roadmap explorer (JavaScript, TypeScript roadmaps)
- External course tracker (Udemy, YouTube, etc.)
- Operations — capstone projects tied to each Star System
- Weekly XP summary emails + re-engagement drip (via Resend)
- Offline support via service worker
- PWA manifest

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, App Router, TypeScript (strict) |
| Database | Neon (PostgreSQL) + Drizzle ORM |
| Auth | Clerk (`@clerk/nextjs` v6+) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Motion v12 (`motion/react`) |
| Charts | Recharts (dynamic import, client-only) |
| Cache / Presence | Upstash Redis |
| Email | Resend |
| AI | Anthropic SDK (Claude) |
| Payments | Stripe |
| Analytics | `@vercel/analytics` |
| Deployment | Vercel |

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy env vars
cp .env.example .env.local
# Fill in all required values (see Env vars section below)

# 3. Push database schema
npx drizzle-kit push

# 4. Seed demo data (optional)
npx tsx scripts/seed-demo.ts

# 5. Run dev server
npm run dev
```

---

## Env vars

All variables are validated via Zod on startup (`lib/env.ts`). The app will not start if required vars are missing.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend secret |
| `CLERK_WEBHOOK_SECRET` | ✅ | Svix webhook secret for Clerk events |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend key |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token |
| `RESEND_API_KEY` | ✅ | Resend email API key |
| `RESEND_FROM_EMAIL` | — | Sender address (default: `Galactic Code <noreply@galacticcode.dev>`) |
| `CRON_SECRET` | ✅ | Shared secret for cron route auth |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full public URL (`https://galacticcode.dev`) |
| `ANTHROPIC_API_KEY` | — | For AI study recommendations |
| `STRIPE_SECRET_KEY` | — | Stripe backend key (Pro plan) |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | Stripe frontend key |

---

## Database

Uses Drizzle ORM with Neon (serverless Postgres).

```bash
# Push schema changes to the database
npx drizzle-kit push

# Open Drizzle Studio (schema browser)
npx drizzle-kit studio
```

**Schema highlights:**
- `users` — XP, rank, streak, referral code/count, Stripe subscription
- `missions` / `sectors` / `star_systems` — content hierarchy
- `mission_progress` — per-user mission state
- `medals` — earned achievements
- `battles` / `battle_participants` — combat state
- `fleets` / `fleet_members` — team system
- `ships` / `items` / `user_inventory` — gear economy
- `daily_logs` — XP history for heatmap + weekly emails

---

## Automated email sequences

Cron routes (secured with `CRON_SECRET`) are called by Vercel Cron:

| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/weekly-summary` | Sundays | XP debrief for active users |
| `/api/cron/re-engagement` | Daily | Nudge users inactive for 2–3 days |

Trigger email is sent on signup via the Clerk `user.created` webhook at `/api/webhooks/clerk`.

---

## XP values

| Action | XP |
|---|---|
| Complete mission | 15 |
| Complete mission (with Focus Cycle) | 20 |
| Skip mission | 2 |
| Daily login | 5 |
| Skill check pass | 20 |
| Skill check perfect (100%) | 35 |
| Complete operation | 100 |
| 7-day streak bonus | +10 |
| 30-day streak bonus | +25 |
| Referral bonus (both parties) | +50 |

---

## Rank thresholds

| Rank | XP Required | Title |
|---|---|---|
| 1 | 0 | Cadet |
| 2 | 100 | Navigator |
| 3 | 250 | Ensign |
| 4 | 500 | Lieutenant |
| 5 | 1,000 | Commander |
| 6 | 2,000 | Captain |
| 7 | 3,500 | Fleet Captain |
| 8 | 5,000 | Admiral |
| 9 | 7,500 | Grand Admiral |
| 10 | 10,000 | Starfleet Legend |

---

## Space terminology

| Concept | UI Name |
|---|---|
| Lesson / learning block | Mission |
| Month of content | Star System |
| Week / theme | Sector |
| Streak | Hyperdrive Charge |
| Level | Rank |
| Achievement | Medal |
| Dashboard | Command Bridge |
| Pomodoro session | Focus Cycle |
| Quiz | Skill Check |

---

## Architecture notes

- **Node-only routes** (anything importing `lib/db`): no `export const runtime = "edge"`. Neon requires Node.js.
- **Edge runtime**: only `/api/crew-bay/presence` (Upstash Redis only) and `/api/og` (ImageResponse).
- **Recharts**: always a dynamic import with `"use client"` — it breaks on SSR.
- **Motion**: `import { motion } from "motion/react"` — requires `"use client"`.
- **date-fns**: named imports only (`import { format } from "date-fns"`).

---

## Dev commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # Run test suite
npx drizzle-kit push # Push schema to DB
npx tsx scripts/seed-demo.ts  # Seed demo account
```

---

## License

MIT
