-- Star Map XP is paid once per node. Un-checking a node resets its status, so the
-- "already paid" fact needs its own column (see the one-time claim in /api/star-map).
ALTER TABLE star_map_progress ADD COLUMN IF NOT EXISTS xp_awarded_at timestamp;

-- Nodes that are completed right now have already been paid.
UPDATE star_map_progress
SET xp_awarded_at = COALESCE(completed_at, now())
WHERE status = 'COMPLETED' AND xp_awarded_at IS NULL;
