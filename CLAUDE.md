# Galactic Code

Space-themed RPG learning platform. Players complete coding missions to earn XP, rank up, and unlock medals.

## Stack
- Next.js 15, TypeScript strict, App Router
- Drizzle ORM + Neon (PostgreSQL)
- Clerk auth (`@clerk/nextjs` v6+)
- Tailwind CSS v4 + shadcn/ui
- Motion v12, Recharts, Upstash Redis, date-fns v3, Anthropic SDK
- `@vercel/analytics`

## Dev commands
```bash
npm run dev
npm run build
npm run lint
npm run type-check
npx drizzle-kit push
npx tsx scripts/seed-demo.ts
npm test
```

## Install scripts
- `allowScripts` in `package.json` records the npm install-script decisions (npm 12 blocks dependency install scripts by default). All current ones are denied: builds, lint and tests pass without them
- If a new dependency genuinely needs its script, approve just that package with `npm install-scripts approve <pkg> --no-allow-scripts-pin` (npm 11.16+)

## Critical rules
- Never `export const runtime = "edge"` on routes that import `lib/db` (Neon is Node-only)
- `export const runtime = "edge"` is only for `/api/crew-bay/presence` (Upstash only)
- Recharts: always dynamic import with `"use client"`
- Motion: `import { motion } from "motion/react"`, `"use client"` required
- date-fns: named imports only
- Animations: respect `prefers-reduced-motion`

## Space terminology
| Concept | UI Name |
|---|---|
| Learning block | Mission |
| Month | Star System |
| Week/theme | Sector |
| Streak | Hyperdrive Charge |
| Level | Rank |
| Achievement | Medal |
| Dashboard | Command Bridge |
| Pomodoro | Focus Cycle |
| Quiz | Skill Check |

## XP values
- Complete mission: 15 (20 with Focus Cycle)
- Skip mission: 2
- Daily login: 5
- Skill check pass: 20 (35 if perfect, 5 if < 70%)
- Sim Deck exercise pass: 10 (once per exercise)
- Complete operation: 100
- Streak bonus 7d: +10, 30d: +25

## Navigation unlocks
- Areas appear by rank: `unlockRank` per item in `components/layout/nav-config.ts`, logic in `lib/unlocks.ts`
- Explorer Mode (`users.explorer_mode`) and the demo show everything; direct URLs to locked areas render a lock screen (`RouteGuard`)
- Merged areas keep their routes and share a `SectionTabs` strip (Academy, Hangar, Crew); list them in `alsoMatches`
- Settings lives in the top bar, not the nav

## Env vars
All validated via Zod in `lib/env.ts`. See `.env.example`.
