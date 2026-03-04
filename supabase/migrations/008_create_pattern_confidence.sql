-- Migration: Create user_pattern_confidence table
-- Stores diagnostic assessment results per pattern from the onboarding wizard.

CREATE TABLE IF NOT EXISTS user_pattern_confidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
  diagnostic_problem_id TEXT,
  diagnostic_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Each user can have only one confidence rating per pattern
ALTER TABLE user_pattern_confidence
  ADD CONSTRAINT uq_user_pattern_confidence UNIQUE (user_id, pattern_name);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE user_pattern_confidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pattern confidence"
  ON user_pattern_confidence FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pattern confidence"
  ON user_pattern_confidence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pattern confidence"
  ON user_pattern_confidence FOR UPDATE
  USING (auth.uid() = user_id);
