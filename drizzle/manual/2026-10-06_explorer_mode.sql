-- Manual migration — run once in the Neon SQL editor BEFORE deploying the
-- rank-gated navigation (drizzle-kit push is unusable on this database; see
-- 2026-07-03_exercise_xp.sql for why).

-- Explorer Mode: users who opt in see every area regardless of rank.
ALTER TABLE users ADD COLUMN IF NOT EXISTS explorer_mode boolean NOT NULL DEFAULT false;
