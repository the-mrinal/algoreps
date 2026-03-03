-- Add theme preference to profiles table
ALTER TABLE profiles
  ADD COLUMN theme_preference TEXT DEFAULT 'system'
  CHECK (theme_preference IN ('light', 'dark', 'system'));
