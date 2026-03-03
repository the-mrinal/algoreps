-- Migration: Create problems table for DSA sheet import with deduplication

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
