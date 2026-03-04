-- DSA Spaced Repetition Platform — Supabase Schema
-- Apply this file in the Supabase SQL Editor to set up the database.

-- =============================================================================
-- Table: profiles
-- Extends Supabase auth with display data. Auto-created on signup via trigger.
-- =============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  is_premium BOOLEAN DEFAULT FALSE,
  questions_per_day INTEGER DEFAULT 5,
  hours_per_day DECIMAL DEFAULT 1.5,
  proficiency_level TEXT DEFAULT 'rusty' CHECK (proficiency_level IN ('beginner','rusty','intermediate','advanced')),
  interview_date DATE,
  problem_set TEXT DEFAULT 'neetcode-150',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  current_pattern_index INTEGER DEFAULT 0
);

-- =============================================================================
-- Table: user_progress
-- Stores every submission (both Track A: practice and Track B: trust mode).
-- =============================================================================

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  is_self_reported BOOLEAN DEFAULT FALSE,
  source_url TEXT,
  topics TEXT[] DEFAULT '{}',
  approach TEXT,
  remarks TEXT,
  code TEXT,
  time_taken_mins INTEGER,
  performance_score INTEGER CHECK (performance_score BETWEEN 1 AND 5),
  time_complexity TEXT,
  space_complexity TEXT,
  ai_review JSONB,
  next_revision_date TIMESTAMPTZ,
  interval_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Trigger: auto-create profile on signup
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for SRS queries (due revisions per user)
CREATE INDEX idx_user_progress_revision
  ON user_progress (user_id, next_revision_date)
  WHERE next_revision_date IS NOT NULL;

-- Index for history queries
CREATE INDEX idx_user_progress_user_problem
  ON user_progress (user_id, problem_id, created_at DESC);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- User progress policies
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Table: problems
-- Stores all DSA problems with sheet membership for deduplication.
-- =============================================================================

CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leetcode_id TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  category TEXT,
  sheets TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  examples JSONB DEFAULT '[]',
  constraints TEXT[] DEFAULT '{}',
  hints TEXT[] DEFAULT '{}',
  code_snippets JSONB DEFAULT '{}',
  neetcode_video_id TEXT,
  neetcode_url TEXT,
  leetcode_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_problems_slug ON problems (slug);
CREATE INDEX idx_problems_sheets ON problems USING GIN (sheets);

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read problems"
  ON problems FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert problems"
  ON problems FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update problems"
  ON problems FOR UPDATE TO authenticated USING (true);
