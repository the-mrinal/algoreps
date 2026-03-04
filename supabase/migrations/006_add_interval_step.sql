-- Migration 006: Add interval_step column to user_progress table
-- Tracks the SRS interval step per submission for adaptive doubling algorithm.
-- Existing submissions default to 0 (backward compatible).

ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS interval_step INTEGER DEFAULT 0;
