-- Migration 009: Create daily_plans table
-- Persists the daily plan so users can close browser and resume within the same day.

CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, plan_date)
);

-- Index for fast daily lookups
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date
  ON daily_plans (user_id, plan_date);

-- Row Level Security
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily plans"
  ON daily_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily plans"
  ON daily_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily plans"
  ON daily_plans FOR UPDATE
  USING (auth.uid() = user_id);
