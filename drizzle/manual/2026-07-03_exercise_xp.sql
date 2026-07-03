-- Manual migration — run once in the Neon SQL editor BEFORE re-running
-- scripts/seed-curriculum.ts.
--
-- Why manual: drizzle-kit push is unusable against this database. The DB is
-- on Postgres 18, where NOT NULL constraints are catalogued; push tries to
-- drop users_id_not_null (part of the PK) and dies with 42P16.

-- Sim Deck exercise completions: one row per (user, exercise); the first
-- insert pays XP_VALUES.COMPLETE_EXERCISE, replays are no-ops.
CREATE TABLE IF NOT EXISTS exercise_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  completed_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT exercise_progress_user_id_exercise_id_unique UNIQUE (user_id, exercise_id)
);

-- Upsert identity for seeded content, so seed re-runs update rows in place
-- instead of skipping (skill checks) or delete+reinserting (exercises).
-- Dedupe defensively before adding the constraints.
DELETE FROM skill_check_questions a
  USING skill_check_questions b
  WHERE a.id > b.id
    AND a.mission_id = b.mission_id
    AND a.display_order = b.display_order;

ALTER TABLE skill_check_questions
  ADD CONSTRAINT skill_check_questions_mission_id_display_order_unique
  UNIQUE (mission_id, display_order);

DELETE FROM exercises a
  USING exercises b
  WHERE a.id > b.id
    AND a.mission_id = b.mission_id
    AND a.display_order = b.display_order;

ALTER TABLE exercises
  ADD CONSTRAINT exercises_mission_id_display_order_unique
  UNIQUE (mission_id, display_order);
