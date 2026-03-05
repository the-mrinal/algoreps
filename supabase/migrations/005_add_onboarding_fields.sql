-- Migration: Add onboarding preference columns to profiles table
-- These columns store user preferences collected during the onboarding wizard.

ALTER TABLE profiles ADD COLUMN questions_per_day INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN hours_per_day DECIMAL DEFAULT 1.5;
ALTER TABLE profiles ADD COLUMN proficiency_level TEXT DEFAULT 'rusty' CHECK (proficiency_level IN ('beginner','rusty','intermediate','advanced'));
ALTER TABLE profiles ADD COLUMN interview_date DATE;
ALTER TABLE profiles ADD COLUMN problem_set TEXT DEFAULT 'neetcode-150';
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN current_pattern_index INTEGER DEFAULT 0;
