-- Migration: Add pattern_order column to problems table
-- Stores the NeetCode roadmap position (1-150) for plan engine ordering.

ALTER TABLE problems ADD COLUMN IF NOT EXISTS pattern_order INTEGER;
