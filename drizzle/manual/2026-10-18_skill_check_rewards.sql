-- Skill check rewards are claimed once per (pilot, mission, tier) so parallel
-- submissions can't pay the same tier twice. Tiers: 1 = attempt, 2 = pass, 3 = perfect.
CREATE TABLE IF NOT EXISTS skill_check_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  tier integer NOT NULL,
  claimed_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT skill_check_rewards_user_id_mission_id_tier_unique UNIQUE (user_id, mission_id, tier)
);

-- Tiers already earned through earlier attempts count as claimed.
INSERT INTO skill_check_rewards (user_id, mission_id, tier)
SELECT DISTINCT user_id, mission_id, 1 FROM skill_check_attempts
ON CONFLICT DO NOTHING;
INSERT INTO skill_check_rewards (user_id, mission_id, tier)
SELECT DISTINCT user_id, mission_id, 2 FROM skill_check_attempts WHERE passed
ON CONFLICT DO NOTHING;
INSERT INTO skill_check_rewards (user_id, mission_id, tier)
SELECT DISTINCT user_id, mission_id, 3 FROM skill_check_attempts WHERE perfect
ON CONFLICT DO NOTHING;
