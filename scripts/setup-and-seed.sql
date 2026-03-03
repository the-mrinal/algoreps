-- ============================================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This creates the missing tables and seeds demo data for dmrinal626@gmail.com
-- ============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'))
);

-- 2. Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auto-create profile trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_revision
  ON user_progress (user_id, next_revision_date)
  WHERE next_revision_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_progress_user_problem
  ON user_progress (user_id, problem_id, created_at DESC);

-- 5. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User progress policies (including DELETE for Clear All Data)
DO $$ BEGIN
  CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own progress" ON user_progress FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Insert profile for existing user
INSERT INTO profiles (id, email)
VALUES ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'dmrinal626@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed demo data (~40 submissions over 28 days with 7-day streak)
INSERT INTO user_progress (user_id, problem_id, is_self_reported, topics, approach, remarks, performance_score, time_taken_mins, time_complexity, space_complexity, next_revision_date, created_at, updated_at)
VALUES
  -- Today (day 0) - 3 problems
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'two-sum', false, ARRAY['Array','Hash Table'], 'Used a hash map to store complements. One-pass approach — for each num, check if target-num exists in the map.', 'Classic problem. Good warm-up.', 5, 8, 'O(n)', 'O(n)', NOW() + INTERVAL '14 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'valid-parentheses', false, ARRAY['String','Stack'], 'Stack-based approach. Push opening brackets, pop and match for closing brackets.', NULL, 4, 10, 'O(n)', 'O(n)', NOW() + INTERVAL '14 days', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'container-with-most-water', true, ARRAY['Array','Two Pointers'], 'Two pointers from both ends. Move the pointer with smaller height inward.', 'Greedy insight: always move the shorter line.', 3, 22, 'O(n)', 'O(1)', NOW() + INTERVAL '4 days', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),

  -- Yesterday (day 1) - 3 problems
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'merge-two-sorted-lists', false, ARRAY['Linked List','Recursion'], NULL, NULL, 5, 7, 'O(n)', 'O(1)', NOW() - INTERVAL '1 day' + INTERVAL '14 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', '3sum', true, ARRAY['Array','Two Pointers','Sorting'], 'Sort array first, then use two-pointer technique for each element. Skip duplicates.', 'Tricky to handle duplicates. Sorting makes it manageable.', 3, 35, 'O(n²)', 'O(1)', NOW() - INTERVAL '1 day' + INTERVAL '4 days', NOW() - INTERVAL '1 day' - INTERVAL '1 hour', NOW() - INTERVAL '1 day' - INTERVAL '1 hour'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'trapping-rain-water', false, ARRAY['Array','Two Pointers','Stack'], 'Two pointer approach. Track leftMax and rightMax.', 'Hard to get right on first try. Drew it out on paper first.', 2, 45, 'O(n)', 'O(1)', NOW() - INTERVAL '1 day' + INTERVAL '1 day', NOW() - INTERVAL '1 day' - INTERVAL '2 hours', NOW() - INTERVAL '1 day' - INTERVAL '2 hours'),

  -- Day 2 - 3 problems
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'best-time-to-buy-and-sell-stock', false, ARRAY['Array','Dynamic Programming'], NULL, NULL, 5, 6, 'O(n)', 'O(1)', NOW() - INTERVAL '2 days' + INTERVAL '14 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'group-anagrams', true, ARRAY['Array','Hash Table','String'], 'Sort each string as key, group by sorted key in a hash map.', NULL, 4, 18, 'O(n*k log k)', 'O(n)', NOW() - INTERVAL '2 days' + INTERVAL '14 days', NOW() - INTERVAL '2 days' - INTERVAL '1 hour', NOW() - INTERVAL '2 days' - INTERVAL '1 hour'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'longest-substring-without-repeating-characters', false, ARRAY['Hash Table','String','Sliding Window'], 'Sliding window with a set. Expand right pointer, shrink left when duplicate found.', NULL, 4, 20, 'O(n)', 'O(n)', NOW() - INTERVAL '2 days' + INTERVAL '14 days', NOW() - INTERVAL '2 days' - INTERVAL '2 hours', NOW() - INTERVAL '2 days' - INTERVAL '2 hours'),

  -- Day 3 - 3 problems
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'valid-palindrome', false, ARRAY['Two Pointers','String'], NULL, NULL, 5, 5, 'O(n)', 'O(1)', NOW() - INTERVAL '3 days' + INTERVAL '14 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'longest-consecutive-sequence', true, ARRAY['Array','Hash Table','Union Find'], NULL, NULL, 3, 25, 'O(n)', 'O(n)', NOW() - INTERVAL '3 days' + INTERVAL '4 days', NOW() - INTERVAL '3 days' - INTERVAL '1 hour', NOW() - INTERVAL '3 days' - INTERVAL '1 hour'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'merge-k-sorted-lists', false, ARRAY['Linked List','Heap'], 'Min-heap approach. Push first node from each list, pop smallest, push its next.', 'Heap solution is clean. Tried divide-and-conquer too.', 2, 40, 'O(N log k)', 'O(k)', NOW() - INTERVAL '3 days' + INTERVAL '1 day', NOW() - INTERVAL '3 days' - INTERVAL '2 hours', NOW() - INTERVAL '3 days' - INTERVAL '2 hours'),

  -- Day 4 - 2 problems
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'climbing-stairs', false, ARRAY['Dynamic Programming','Math'], 'Classic DP — dp[i] = dp[i-1] + dp[i-2]. Really just Fibonacci.', NULL, 5, 5, 'O(n)', 'O(1)', NOW() - INTERVAL '4 days' + INTERVAL '14 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'search-in-rotated-sorted-array', true, ARRAY['Array','Binary Search'], 'Modified binary search. Determine which half is sorted, then check if target lies in that half.', NULL, 3, 28, 'O(log n)', 'O(1)', NOW() - INTERVAL '4 days' + INTERVAL '4 days', NOW() - INTERVAL '4 days' - INTERVAL '1 hour', NOW() - INTERVAL '4 days' - INTERVAL '1 hour'),

  -- Day 5 - 2 problems
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'same-tree', false, ARRAY['Tree','DFS'], NULL, NULL, 5, 4, 'O(n)', 'O(n)', NOW() - INTERVAL '5 days' + INTERVAL '14 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'combination-sum', false, ARRAY['Array','Backtracking'], 'Backtracking with start index to avoid duplicates.', 'The key insight is allowing reuse of the same element.', 4, 20, 'O(2^n)', 'O(n)', NOW() - INTERVAL '5 days' + INTERVAL '14 days', NOW() - INTERVAL '5 days' - INTERVAL '1 hour', NOW() - INTERVAL '5 days' - INTERVAL '1 hour'),

  -- Day 6 - 2 problems
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'maximum-depth-of-binary-tree', false, ARRAY['Tree','DFS','BFS'], NULL, NULL, 4, 6, 'O(n)', 'O(n)', NOW() - INTERVAL '6 days' + INTERVAL '14 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'permutations', true, ARRAY['Array','Backtracking'], NULL, NULL, 3, 22, 'O(n!)', 'O(n)', NOW() - INTERVAL '6 days' + INTERVAL '4 days', NOW() - INTERVAL '6 days' - INTERVAL '1 hour', NOW() - INTERVAL '6 days' - INTERVAL '1 hour'),

  -- Day 8 - 2 problems (gap of 1 day, streak ends here)
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'add-two-numbers', false, ARRAY['Linked List','Math'], NULL, NULL, 4, 15, 'O(n)', 'O(n)', NOW() - INTERVAL '8 days' + INTERVAL '14 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'minimum-window-substring', true, ARRAY['Hash Table','String','Sliding Window'], 'Sliding window with character frequency maps.', 'Hardest sliding window problem. Took 45 minutes.', 2, 48, 'O(n)', 'O(n)', NOW() - INTERVAL '8 days' + INTERVAL '1 day', NOW() - INTERVAL '8 days' - INTERVAL '1 hour', NOW() - INTERVAL '8 days' - INTERVAL '1 hour'),

  -- Day 10 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'validate-binary-search-tree', false, ARRAY['Tree','DFS','BST'], 'Recursive DFS with min/max bounds.', 'Easy to make the mistake of only checking immediate children.', 3, 18, 'O(n)', 'O(n)', NOW() - INTERVAL '10 days' + INTERVAL '4 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  -- Day 12 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'binary-tree-level-order-traversal', false, ARRAY['Tree','BFS'], 'BFS with a queue. Process level by level.', NULL, 4, 12, 'O(n)', 'O(n)', NOW() - INTERVAL '12 days' + INTERVAL '14 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

  -- Day 14 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'merge-intervals', true, ARRAY['Array','Sorting'], 'Sort intervals by start time, then iterate and merge overlapping intervals.', NULL, 4, 15, 'O(n log n)', 'O(n)', NOW() - INTERVAL '14 days' + INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

  -- Day 16 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'subsets', false, ARRAY['Array','Backtracking'], 'Backtracking — at each index, choose to include or exclude the element.', NULL, 4, 14, 'O(2^n)', 'O(n)', NOW() - INTERVAL '16 days' + INTERVAL '14 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),

  -- Day 18 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'word-search', true, ARRAY['Array','Backtracking','Matrix'], 'DFS backtracking on the grid. Mark visited cells, explore 4 directions.', 'Standard grid DFS.', 3, 30, 'O(n*m*4^L)', 'O(L)', NOW() - INTERVAL '18 days' + INTERVAL '4 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),

  -- Day 20 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'maximum-subarray', false, ARRAY['Array','Dynamic Programming'], 'Kadanes algorithm. Keep running sum, reset to current element if sum goes negative.', NULL, 5, 8, 'O(n)', 'O(1)', NOW() - INTERVAL '20 days' + INTERVAL '14 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),

  -- Day 22 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'unique-paths', false, ARRAY['Math','Dynamic Programming'], 'DP on a grid. dp[i][j] = dp[i-1][j] + dp[i][j-1].', NULL, 4, 12, 'O(m*n)', 'O(n)', NOW() - INTERVAL '22 days' + INTERVAL '14 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),

  -- Day 25 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'decode-ways', true, ARRAY['String','Dynamic Programming'], '1D DP. dp[i] depends on single digit and two digit if valid.', NULL, 3, 25, 'O(n)', 'O(n)', NOW() - INTERVAL '25 days' + INTERVAL '4 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),

  -- Day 28 - 1 problem
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'edit-distance', false, ARRAY['String','Dynamic Programming'], 'Classic 2D DP. Insert/delete/replace maps to the grid.', 'The state transition for insert/delete/replace maps nicely.', 2, 40, 'O(m*n)', 'O(m*n)', NOW() - INTERVAL '28 days' + INTERVAL '1 day', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),

  -- Extra problems for variety (older)
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'rotate-image', false, ARRAY['Array','Math','Matrix'], NULL, NULL, 4, 15, 'O(n²)', 'O(1)', NOW() - INTERVAL '15 days' + INTERVAL '14 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'n-queens', true, ARRAY['Array','Backtracking'], NULL, NULL, 2, 55, 'O(n!)', 'O(n²)', NOW() - INTERVAL '11 days' + INTERVAL '1 day', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'balanced-binary-tree', false, ARRAY['Tree','DFS'], NULL, NULL, 5, 8, 'O(n)', 'O(n)', NOW() - INTERVAL '9 days' + INTERVAL '14 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'longest-palindromic-substring', false, ARRAY['String','Dynamic Programming'], NULL, NULL, 3, 30, 'O(n²)', 'O(1)', NOW() - INTERVAL '7 days' + INTERVAL '4 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'surrounded-regions', true, ARRAY['Array','DFS','BFS','Matrix'], NULL, NULL, 3, 22, 'O(m*n)', 'O(m*n)', NOW() - INTERVAL '13 days' + INTERVAL '4 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'jump-game', false, ARRAY['Array','Greedy'], NULL, NULL, 4, 10, 'O(n)', 'O(1)', NOW() - INTERVAL '17 days' + INTERVAL '14 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'median-of-two-sorted-arrays', false, ARRAY['Array','Binary Search'], NULL, NULL, 1, 60, 'O(log(m+n))', 'O(1)', NOW() - INTERVAL '19 days' + INTERVAL '1 day', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'word-ladder', true, ARRAY['Hash Table','String','BFS'], NULL, NULL, 2, 50, 'O(n²*L)', 'O(n*L)', NOW() - INTERVAL '21 days' + INTERVAL '1 day', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'largest-rectangle-in-histogram', false, ARRAY['Array','Stack'], NULL, NULL, 2, 45, 'O(n)', 'O(n)', NOW() - INTERVAL '24 days' + INTERVAL '1 day', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
  ('6d4f9e4d-c2dd-406f-967b-0a4aca98ad9b', 'plus-one', false, ARRAY['Array','Math'], NULL, NULL, 5, 3, 'O(n)', 'O(1)', NOW() - INTERVAL '27 days' + INTERVAL '14 days', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days');
