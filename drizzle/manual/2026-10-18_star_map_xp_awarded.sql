-- Star Map XP is paid once per node. Un-checking a node resets its status, so the
-- "already paid" fact needs its own column (see the one-time claim in /api/star-map).
ALTER TABLE star_map_progress ADD COLUMN IF NOT EXISTS xp_awarded_at timestamp;

-- Every existing row counts as paid. A row that is NOT_STARTED today was un-checked
-- after being completed (and paid) under the old route, and its completed_at is gone,
-- so "currently COMPLETED" would miss it and let the node pay a second time.
UPDATE star_map_progress
SET xp_awarded_at = COALESCE(completed_at, now())
WHERE xp_awarded_at IS NULL;
