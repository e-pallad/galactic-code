# Launch Plan — Galactic Code

Live: https://galacticcode.app · Demo (no signup): https://galacticcode.app/demo
Curriculum (public): https://galacticcode.app/curriculum

Strategy: Show HN first (feedback + traffic spike, HN dislikes polished marketing),
Product Hunt ~1–2 weeks later with HN learnings folded in. Social drumbeat via
`scripts/gen-social-post.ts --post` throughout.

---

## 1. Show HN

**Title** (keep plain, no superlatives):

> Show HN: Galactic Code – learn React/Node by completing missions in a space RPG

**Post text:**

> I built a coding-practice platform that works like a space RPG. You pick a
> track (React, Node.js, or Next.js), and the curriculum is laid out as star
> systems → sectors → missions: 15–30 minute chunks with skill-check quizzes
> and in-browser coding exercises (Sandpack + Testing Library — write code,
> tests run live, XP on green).
>
> The RPG loop: missions pay XP and Credits, XP ranks you up
> (Cadet → … → Starfleet Legend), Credits buy ship gear, and the gear matters
> in a turn-based combat arena against "Void Entities" — solo or with your
> fleet. Streaks are timezone-aware, and everything XP-bearing is graded or
> capped server-side so the leaderboard means something.
>
> I built the mission chunking + focus timers primarily for my own ADHD brain;
> long-form courses never stuck for me.
>
> Stack: Next.js 15, Postgres (Neon), Drizzle, Clerk, Sandpack. There's a full
> demo without signup: https://galacticcode.app/demo — and the whole
> curriculum is browsable at https://galacticcode.app/curriculum.
>
> Would love feedback, especially on the exercise runner and whether the
> gamification helps or annoys.

**Rules of engagement:**
- Post Tue–Thu, 14:00–16:00 UTC (morning US traffic)
- Stay in the thread for 6+ hours; answer everything, even hostile takes, technically and honestly
- Do not ask anyone to upvote (HN detects voting rings)
- Have the demo warm: hit `/demo` and a Sim Deck exercise right before posting (cold starts)
- Expected hot questions: "how is this different from Codecademy/Exercism?",
  "is the AI-generated content any good?", "what's the business model?" — draft answers below

**Prepped answers:**
- *Vs. Exercism/Codecademy:* shorter mission granularity (15–30 min), the RPG economy
  actually consumes the currency (gear → combat), and the whole curriculum is public.
  Exercism is deeper per-language; this optimizes for consistency and momentum.
- *Business model:* free right now. If it grows: paid tracks/cosmetics, never paywalling
  the core loop. (Stripe scaffolding was deliberately deleted until there's traction.)
- *Content quality:* curriculum is hand-authored, exercises ship with reference
  solutions verified in CI against the same test harness users run.

## 2. Product Hunt

- **Name:** Galactic Code
- **Tagline** (≤60 chars): `Learn to code by playing a space RPG`
- **Description:**
  > Galactic Code turns learning React, Node.js, and Next.js into a space RPG.
  > Complete 15–30 minute missions to earn XP and Credits, rank up from Cadet
  > to Starfleet Legend, keep your Hyperdrive streak charged, run in-browser
  > coding exercises with live tests, then spend your Credits on ship gear and
  > battle Void Entities with your fleet. Try the full demo without an account.
- **Topics:** Education, Developer Tools, Games
- **Gallery checklist:** (capture at 1270×760)
  1. Command Bridge dashboard (XP, streak, rank)
  2. Sim Deck exercise with tests passing (the money shot)
  3. Academy system page (mission cards + progress)
  4. Combat Arena battle
  5. Public curriculum page
  6. Optional 30s screen recording: demo → mission → Sim Deck green tests → XP
- **First maker comment:** reuse the Show HN text, minus the stack paragraph, plus
  "Ask me anything about the gamification design — happy to share what flopped."
- **Timing:** launch 00:01 PT; be online 06:00–10:00 PT for the ranking window
- Update the site header that day: "We're live on Product Hunt" link

## 3. Social drumbeat

`scripts/gen-social-post.ts`:
- Dry run (print all variants): `npx tsx scripts/gen-social-post.ts`
- Publish one (context rotates daily): `npx tsx scripts/gen-social-post.ts --post`
- Specific angle: `--context N` (0-7; see CONTEXTS in the script)

Configured via env (any subset): Bluesky (app password), Mastodon (token),
X (OAuth 1.0a keys — free tier covers posting). LinkedIn output is copy-paste.

Cadence: 2–3 posts/week pre-launch, daily during launch week. Cheapest
automation: a weekly cron on any box with the env vars —
`npx tsx scripts/gen-social-post.ts --post`.

## 4. Pre-launch checklist

- [x] Demo mode works logged-out (verified 2026-07-04, Playwright)
- [x] Sim Deck + XP verified on prod
- [x] Public curriculum + /pilots live, sitemap correct
- [x] Tracks javascript/python deactivated; CRON_SECRET set
- [ ] Verify RESEND_FROM_EMAIL domain is galacticcode.app in Vercel (example file says .dev)
- [ ] OG image check: paste galacticcode.app into a Slack/Discord/X composer, confirm card renders
- [ ] Decide leaderboard XP reset before traffic arrives (old forged skill-check XP)
- [ ] Screenshots/recording captured for PH gallery
- [ ] Rate limits sanity: /demo and /api/progress/* under burst traffic (Upstash limits configured)
