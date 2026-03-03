# DSA Spaced Repetition Platform — Implementation Plan

## Overview

A self-hosted, multi-user DSA preparation platform with local test execution, on-demand AI code review (free-tier Gemini API), and spaced repetition scheduling. Next.js dashboard as the central read/write client, Discord as read-only push notifications, Supabase for all state.

## Current State

Greenfield project. `/Users/marketfeed/Documents/dsa-dashboard/` is empty.

## Desired End State

A fully functional web platform where users can:
- Browse NeetCode-150 problems by category, solve them in-browser with Monaco Editor
- Run local test suites and get AI-powered code reviews on demand (zero cost)
- Log externally-solved problems (LeetCode) via a manual form
- Track progress with spaced repetition scheduling (SM-2 variant)
- View personal history, stats, streaks, and weak areas
- Receive automated Discord alerts for due revisions and daily summaries
- Authenticate via magic link (passwordless email)

**Verification**: All 7 phases pass their success criteria. A user can sign up, solve a problem, get AI review, log an external problem, see their SRS queue, view progress stats, and receive Discord notifications.

## What We're NOT Doing

- No real-time collaborative features
- No LLM-generated problems (all sourced from existing repos)
- No mobile app (responsive web only)
- No payment/subscription system
- No LeetCode API integration (manual copy-paste only)
- No two-way Discord bot (webhooks only, read-only)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Auth | Supabase Auth (magic links) |
| Database | Supabase (PostgreSQL) |
| AI Engine | Google Gemini 2.5 Flash (free tier, manual trigger) |
| Notifications | Discord Webhooks |
| Scheduler | `node-cron` |
| Deployment | DigitalOcean Droplet |

---

## Problem Bank Strategy

### Data Sources

1. **`neenza/leetcode-problems`** — 1000+ problems in clean per-file JSON format with descriptions, examples, constraints, hints, code snippets (19 languages)
2. **`krmanik/Anki-NeetCode`** — NeetCode-150 index with category mapping, neetcode/leetcode URLs
3. **`neetcode-gh/leetcode`** — `.problemSiteData.json` for Blind75 flags and YouTube video IDs

### Merge Strategy

A one-time build script will:
1. Read `neetcode-150-list.json` from krmanik repo (150 problems, 18 categories)
2. For each problem, match to `neenza/leetcode-problems/problems/{number}-{slug}.json` via URL slug
3. Enrich with `blind75` flag and `video` ID from neetcode-gh `.problemSiteData.json`
4. Output a single `problems.json` file with unified schema

### Unified Problem Schema

```json
{
  "id": "0001",
  "title": "Two Sum",
  "slug": "two-sum",
  "difficulty": "Easy",
  "category": "Arrays & Hashing",
  "is_neetcode150": true,
  "is_blind75": true,
  "topics": ["Array", "Hash Table"],
  "description": "Given an array of integers nums...",
  "examples": [
    {
      "example_num": 1,
      "example_text": "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]",
      "images": []
    }
  ],
  "constraints": ["2 <= nums.length <= 10^4"],
  "hints": ["A really brute force way..."],
  "code_snippets": {
    "javascript": "var twoSum = function(nums, target) { };",
    "python3": "class Solution:\n    def twoSum(self, nums, target):"
  },
  "neetcode_video_id": "KLlXCFG5TnA",
  "neetcode_url": "https://neetcode.io/problems/two-integer-sum?list=neetcode150",
  "leetcode_url": "https://leetcode.com/problems/two-sum/"
}
```

---

## Database Schema (Supabase)

### Auth

Supabase Auth handles user management automatically. Magic link flow sends a login email, user clicks, gets a session. The `auth.users` table is managed by Supabase.

### Table: `profiles`

Extends Supabase auth with display data. Auto-created on first login via a database trigger.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Table: `user_progress`

Stores every submission (both Track A and Track B).

```sql
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for SRS queries (due revisions per user)
CREATE INDEX idx_user_progress_revision
  ON user_progress (user_id, next_revision_date)
  WHERE next_revision_date IS NOT NULL;

-- Index for history queries
CREATE INDEX idx_user_progress_user_problem
  ON user_progress (user_id, problem_id, created_at DESC);
```

### Row Level Security (RLS)

```sql
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own data
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## SRS Engine Logic

```typescript
// lib/srs.ts
export function calculateNextRevisionDate(score: number): Date {
  const today = new Date();
  let daysToAdd: number;

  if (score <= 2) {
    daysToAdd = 1;    // Hard — review tomorrow
  } else if (score === 3) {
    daysToAdd = 4;    // Medium — review in 4 days
  } else {
    daysToAdd = 14;   // Easy — review in 2 weeks
  }

  today.setDate(today.getDate() + daysToAdd);
  return today;
}
```

---

## AI Review Architecture (Gemini 2.5 Flash)

### API Configuration

- **Model**: `gemini-2.5-flash` (free tier: 500 req/day, 1M tokens/day)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Auth**: API key via `GEMINI_API_KEY` env var

### Prompt Template

```typescript
// lib/ai-review.ts
export function buildReviewPrompt(code: string, problemTitle: string, problemDescription: string): string {
  return `You are a senior software engineer conducting a code review for a DSA interview preparation platform.

## Problem
**Title**: ${problemTitle}
**Description**: ${problemDescription}

## Submitted Code
\`\`\`javascript
${code}
\`\`\`

## Required Output (JSON)
Return ONLY valid JSON with this exact structure:
{
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "performance_score": <1-5>,
  "review": {
    "code_quality": "Assessment of naming, readability, idiomatic patterns",
    "edge_cases": "Edge cases handled or missed (empty input, single element, overflow, duplicates)",
    "alternative_approaches": "Other algorithms or data structures that could solve this, with trade-offs",
    "interview_readiness": "Would this pass in a real 45-min coding round? What would an interviewer say?"
  }
}

## Scoring Guide
1 = Incorrect or brute force with bugs
2 = Works but highly suboptimal
3 = Correct with acceptable complexity, minor issues
4 = Clean and optimal, minor style nits
5 = Textbook optimal solution, production quality`;
}
```

### API Route

```typescript
// app/api/analyze/route.ts
export async function POST(req: Request) {
  const { code, problemTitle, problemDescription } = await req.json();
  const prompt = buildReviewPrompt(code, problemTitle, problemDescription);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );

  const data = await response.json();
  const review = JSON.parse(data.candidates[0].content.parts[0].text);
  return Response.json(review);
}
```

---

## Phase 1: Project Scaffold & Problem Bank

### Overview
Initialize the Next.js project, set up the development environment, clone problem source repos, and build the merge script to create the unified local problem bank.

### Changes Required

#### 1. Project Initialization
```bash
npx create-next-app@latest dsa-dashboard --typescript --tailwind --eslint --app --src-dir
cd dsa-dashboard
npm install @supabase/supabase-js @monaco-editor/react node-cron
npm install -D @types/node
```

#### 2. Problem Bank Setup
- Clone repos into `data/sources/` (gitignored)
- Build `scripts/merge-problems.ts` that:
  - Reads `neetcode-150-list.json` for category mapping
  - Matches each to `neenza/leetcode-problems/problems/*.json` via slug
  - Enriches with Blind75 flags + video IDs from `.problemSiteData.json`
  - Outputs `data/problems.json` (committed to repo)

#### 3. Project Structure
```
dsa-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with auth provider
│   │   ├── page.tsx              # Landing / login page
│   │   ├── login/page.tsx        # Magic link login
│   │   ├── dashboard/
│   │   │   ├── layout.tsx        # Authenticated layout
│   │   │   ├── page.tsx          # Dashboard home / SRS queue
│   │   │   ├── practice/page.tsx # Practice Arena (Track A)
│   │   │   ├── log/page.tsx      # Trust Mode Logger (Track B)
│   │   │   └── progress/page.tsx # User Progress & History
│   │   └── api/
│   │       ├── analyze/route.ts  # Gemini AI review
│   │       ├── run-tests/route.ts # Local test execution
│   │       ├── submissions/route.ts # CRUD for user_progress
│   │       └── cron/
│   │           ├── morning/route.ts  # Morning Discord briefing
│   │           └── evening/route.ts  # Evening Discord wrap-up
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── srs.ts                # SRS calculation logic
│   │   ├── ai-review.ts          # Gemini prompt builder
│   │   ├── discord.ts            # Discord webhook helper
│   │   └── problems.ts           # Problem bank loader
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── practice/
│   │   │   ├── ProblemPane.tsx    # Left pane: description
│   │   │   ├── EditorPane.tsx    # Right pane: Monaco + buttons
│   │   │   ├── TestResults.tsx   # Test output display
│   │   │   └── AIReview.tsx      # AI review display
│   │   ├── logger/
│   │   │   └── TrustModeForm.tsx
│   │   ├── srs/
│   │   │   └── RevisionCard.tsx  # Progressive disclosure card
│   │   └── progress/
│   │       ├── StatsOverview.tsx  # Streak, total solved, etc.
│   │       ├── TopicChart.tsx     # Score by category chart
│   │       └── HistoryTable.tsx   # Submission history table
│   └── types/
│       └── index.ts              # TypeScript interfaces
├── data/
│   ├── problems.json             # Merged problem bank (committed)
│   └── sources/                  # Cloned repos (gitignored)
├── scripts/
│   └── merge-problems.ts         # One-time merge script
├── .env.local                    # Supabase URL, Anon Key, Gemini Key, Discord Webhook
└── supabase/
    └── schema.sql                # Full SQL schema for reference
```

#### 4. Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Success Criteria

#### Automated Verification:
- [ ] `npm run dev` starts without errors
- [ ] `npx ts-node scripts/merge-problems.ts` generates `data/problems.json` with 150 problems
- [ ] Each problem in `problems.json` has: title, slug, difficulty, category, description, examples, code_snippets
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

#### Manual Verification:
- [ ] `data/problems.json` contains all 18 NeetCode categories
- [ ] Problem descriptions render correctly (no broken HTML/markdown)

**Pause here for confirmation before proceeding to Phase 2.**

---

## Phase 2: Supabase Schema & Auth

### Overview
Set up Supabase project, apply database schema, configure magic link authentication, and wire up the Next.js auth flow.

### Changes Required

#### 1. Supabase Project Setup
- Create new Supabase project
- Enable Email Auth with magic links (disable password auth)
- Configure site URL and redirect URLs

#### 2. Apply SQL Schema
Run the full schema SQL from the Database Schema section above (profiles table, user_progress table, triggers, indexes, RLS policies).

#### 3. Next.js Auth Integration
**File**: `src/lib/supabase/client.ts` — Browser Supabase client
**File**: `src/lib/supabase/server.ts` — Server-side Supabase client (uses cookies)
**File**: `src/lib/supabase/middleware.ts` — Refresh session on every request
**File**: `src/app/login/page.tsx` — Magic link login form (email input → sends magic link)
**File**: `src/app/auth/callback/route.ts` — Handles magic link redirect, exchanges code for session
**File**: `src/app/dashboard/layout.tsx` — Protected layout, redirects to login if no session

### Success Criteria

#### Automated Verification:
- [ ] SQL schema applies without errors in Supabase SQL editor
- [ ] `npm run build` succeeds with auth components
- [ ] RLS policies block unauthenticated access (test with Supabase client)

#### Manual Verification:
- [ ] Enter email on login page → receive magic link email
- [ ] Click magic link → redirected to dashboard
- [ ] Profile auto-created in `profiles` table
- [ ] Unauthenticated access to `/dashboard/*` redirects to `/login`
- [ ] Session persists across page refreshes

**Pause here for confirmation before proceeding to Phase 3.**

---

## Phase 3: Practice Arena (Track A)

### Overview
Build the dual-pane practice interface with Monaco editor, local test execution, and AI-powered code review with the "Analyze & Score" manual trigger.

### Changes Required

#### 1. Problem Browser
**File**: `src/app/dashboard/practice/page.tsx`
- Category sidebar (18 NeetCode categories)
- Problem list filtered by category
- Difficulty badges (Easy/Medium/Hard)
- Click to load problem into practice arena

#### 2. Dual-Pane Layout
**File**: `src/components/practice/ProblemPane.tsx`
- Renders problem description, examples, constraints
- Shows hints (collapsible)
- Links to NeetCode video and LeetCode problem

**File**: `src/components/practice/EditorPane.tsx`
- Monaco Editor configured for JavaScript
- Pre-populated with code snippet from problem bank
- "Run Tests" button
- "Analyze & Score" button (disabled until tests run)

#### 3. Test Execution API
**File**: `src/app/api/run-tests/route.ts`
- Receives code + problem_id
- Writes code to temp file in isolated directory
- Spawns child process to run test suite
- Returns: pass/fail results, execution time (ms), memory (MB)
- Timeout after 10 seconds (prevents infinite loops)

#### 4. AI Review API
**File**: `src/app/api/analyze/route.ts`
- Implementation as described in AI Review Architecture section
- Returns structured JSON with complexity, score, and full code review

#### 5. Results Display
**File**: `src/components/practice/TestResults.tsx`
- Pass/fail per test case, execution time, memory

**File**: `src/components/practice/AIReview.tsx`
- Renders: Big O complexity, performance score (visual 1-5)
- Code review sections: quality, edge cases, alternatives, interview readiness
- "Save & Schedule Revision" button → saves to Supabase with SRS date

### Success Criteria

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] API route `/api/run-tests` returns valid test results for a known problem
- [ ] API route `/api/analyze` returns valid JSON with all review fields
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Select a problem → description renders in left pane
- [ ] Monaco editor loads with code snippet
- [ ] Write solution → click "Run Tests" → see pass/fail results
- [ ] Click "Analyze & Score" → see AI review with complexity, score, code review
- [ ] Click "Save" → record appears in Supabase `user_progress` with correct `next_revision_date`

**Pause here for confirmation before proceeding to Phase 4.**

---

## Phase 4: Trust Mode Logger (Track B)

### Overview
Build the manual submission form for externally-solved problems. No execution, no AI — direct save to Supabase.

### Changes Required

#### 1. Logger Form
**File**: `src/app/dashboard/log/page.tsx` and `src/components/logger/TrustModeForm.tsx`
- LeetCode URL input
- Code paste area (with syntax highlighting)
- Multi-select dropdown for topics/tags
- Approach text area (markdown supported)
- Remarks text area (markdown supported)
- Self-assessed score slider (1-5 with labels: Struggled → Optimal)
- Time taken (minutes) input
- Time complexity dropdown (O(1), O(log n), O(n), O(n log n), O(n²), O(2^n))
- Space complexity dropdown (same options)
- Submit button

#### 2. Submission API
**File**: `src/app/api/submissions/route.ts`
- POST: Validates input, calculates `next_revision_date` via SRS logic, inserts into `user_progress` with `is_self_reported: true`
- GET: Fetch user's submissions (with pagination, filtering)

### Success Criteria

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] POST to `/api/submissions` creates record in Supabase
- [ ] `is_self_reported` is `true` for Trust Mode entries
- [ ] `next_revision_date` is correctly calculated based on score

#### Manual Verification:
- [ ] Fill out form → submit → success confirmation
- [ ] Record appears in Supabase with all fields populated
- [ ] Validation prevents empty required fields (URL, score)

**Pause here for confirmation before proceeding to Phase 5.**

---

## Phase 5: SRS Queue & Progressive Disclosure

### Overview
Build the daily revision queue showing problems due for review, with progressive disclosure to force active recall.

### Changes Required

#### 1. SRS Queue Page
**File**: `src/app/dashboard/page.tsx` (dashboard home)
- Queries Supabase: `user_progress WHERE user_id = current AND next_revision_date <= NOW()`
- Groups by difficulty/score
- Shows count of due revisions

#### 2. Revision Card
**File**: `src/components/srs/RevisionCard.tsx`
- **Default state**: Problem title + topic tags + last score + days since last attempt
- **Step 1**: "Reveal Approach" button → shows approach text
- **Step 2**: "Reveal Remarks" button → shows remarks/notes
- **Step 3**: "Reveal Code" button → shows previous solution
- **Re-attempt**: "Practice Again" button → navigates to Practice Arena with this problem loaded
- **Quick Score**: For quick re-scoring without re-solving (updates SRS date)

### Success Criteria

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] Query correctly filters to only current user's due revisions

#### Manual Verification:
- [ ] Due problems appear on dashboard home
- [ ] Progressive disclosure works (each step reveals more)
- [ ] "Practice Again" loads the problem in Practice Arena
- [ ] Quick re-score updates `next_revision_date` in Supabase

**Pause here for confirmation before proceeding to Phase 6.**

---

## Phase 6: User Progress & History Dashboard

### Overview
Build the progress tracking view showing submission history, stats, streaks, and performance trends per user (identified by email).

### Changes Required

#### 1. Stats Overview
**File**: `src/components/progress/StatsOverview.tsx`
- Total problems solved (unique)
- Current streak (consecutive days with at least 1 submission)
- Total submissions (including re-attempts)
- Average score (overall and by category)
- Problems due today / this week

#### 2. Topic Mastery Chart
**File**: `src/components/progress/TopicChart.tsx`
- Bar or radar chart showing average score per NeetCode category
- Highlights weak areas (categories with avg score < 3)
- Uses a lightweight chart library (e.g., `recharts`)

#### 3. Submission History Table
**File**: `src/components/progress/HistoryTable.tsx`
- Sortable table of all submissions
- Columns: Date, Problem, Difficulty, Score, Time Taken, Complexity, Track (A/B)
- Filter by: category, difficulty, score range, date range
- Click row to expand and see approach, remarks, AI review

#### 4. Supabase Queries
```sql
-- Current streak
SELECT COUNT(DISTINCT DATE(created_at)) as streak_days
FROM user_progress
WHERE user_id = $1
  AND created_at >= (
    SELECT MAX(created_at) - INTERVAL '1 day' * (
      -- find the first gap in consecutive days
    )
  );

-- Average score by category (using problems.json topics mapping)
SELECT unnest(topics) as topic,
       AVG(performance_score) as avg_score,
       COUNT(*) as attempt_count
FROM user_progress
WHERE user_id = $1
GROUP BY topic
ORDER BY avg_score ASC;

-- Weekly stats
SELECT DATE(created_at) as solve_date,
       COUNT(*) as problems_solved,
       AVG(performance_score) as avg_score,
       SUM(time_taken_mins) as total_time
FROM user_progress
WHERE user_id = $1
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY solve_date;
```

### Success Criteria

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] SQL queries return correct results against test data
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Stats show correct totals matching Supabase data
- [ ] Streak calculation is accurate
- [ ] Topic chart highlights weak areas correctly
- [ ] History table sorts and filters work
- [ ] Expanding a row shows full submission details

**Pause here for confirmation before proceeding to Phase 7.**

---

## Phase 7: Discord Notifications & Cron Jobs

### Overview
Set up automated Discord webhook notifications for morning revision briefings and evening progress summaries, triggered by `node-cron` scheduled jobs.

### Changes Required

#### 1. Discord Webhook Helper
**File**: `src/lib/discord.ts`
```typescript
export async function sendDiscordEmbed(title: string, fields: { name: string; value: string }[], color: number) {
  await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title,
        fields,
        color,
        timestamp: new Date().toISOString()
      }]
    })
  });
}
```

#### 2. Morning Briefing (8:00 AM)
**File**: `src/app/api/cron/morning/route.ts`
- Queries Supabase for all users with due revisions
- Per user, groups by last score: Hard (1-2, red), Medium (3, yellow), Easy (4-5, green)
- Sends Discord embed with categorized problem list + dashboard link

**Discord output example**:
```
🔔 Morning Revisions Due:
🔴 Hard: Merge K Sorted Lists (Last score: 2)
🟡 Medium: Daily Temperatures (Last score: 3)
🟢 Easy: Two Sum (Routine 14-day check)
[Open Dashboard Queue]
```

#### 3. Evening Wrap-up (9:00 PM)
**File**: `src/app/api/cron/evening/route.ts`
- Calculates daily aggregates: problems solved, track split (A vs B), streak
- Calculates weekly progress vs goal
- Identifies topic insights (strongest/weakest this week)
- Sends Discord embed with stats

**Discord output example**:
```
🏆 Daily Wrap-up:
Solved Today: 4 (2 Automated, 2 Trust Mode)
Current Streak: 12 Days 🔥
Weekly Goal: 18/20 completed
Insight: Graph traversal times averaging 35+ minutes.
```

#### 4. Cron Scheduler
For DigitalOcean deployment, use external cron (e.g., `cron-job.org` or DigitalOcean functions) to hit the API routes at 8 AM and 9 PM IST.

Alternatively, if running a standalone Node.js process:
```typescript
// cron/scheduler.ts
import cron from 'node-cron';

cron.schedule('0 8 * * *', () => fetch(`${BASE_URL}/api/cron/morning`));
cron.schedule('0 21 * * *', () => fetch(`${BASE_URL}/api/cron/evening`));
```

### Success Criteria

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] Hitting `/api/cron/morning` sends a Discord message
- [ ] Hitting `/api/cron/evening` sends a Discord message
- [ ] Messages contain correct data from Supabase

#### Manual Verification:
- [ ] Morning embed shows correct due revisions categorized by difficulty
- [ ] Evening embed shows correct daily stats and streak
- [ ] Dashboard link in morning embed works
- [ ] Messages render cleanly in Discord (no formatting issues)

---

## Testing Strategy

### Unit Tests
- SRS calculation: verify correct dates for each score
- Problem bank loader: verify all 150 problems load with required fields
- AI prompt builder: verify prompt contains code and problem context

### Integration Tests
- Auth flow: magic link → session → protected routes
- Track A full flow: select problem → write code → run tests → AI review → save
- Track B full flow: fill form → submit → verify Supabase record
- SRS queue: create submissions with past `next_revision_date` → verify they appear in queue

### Manual Testing
1. Sign up with magic link → verify email arrives and login works
2. Solve Two Sum in Practice Arena → verify test results and AI review
3. Log an external problem via Trust Mode → verify record in Supabase
4. Wait for SRS date → verify problem appears in queue
5. Check progress page → verify stats match submissions
6. Trigger cron endpoints → verify Discord messages

## Performance Considerations

- **Problem bank**: Loaded once at build time, served as static JSON (no runtime DB queries for problem data)
- **Monaco Editor**: Lazy-loaded to avoid blocking initial page render
- **Supabase queries**: Indexed on `(user_id, next_revision_date)` for fast SRS lookups
- **Gemini API**: 500 req/day free tier is more than enough for personal use (even with multiple users)
- **Test execution**: Sandboxed with 10-second timeout to prevent resource exhaustion

## Deployment Notes

- **DigitalOcean Droplet**: Run `next build && next start` or use PM2
- **Environment variables**: Set via DigitalOcean app platform or `.env` on droplet
- **Supabase**: Managed service, no deployment needed
- **Discord webhooks**: Create in Discord server settings → copy URL to env var
- **Domain**: Optional — can use droplet IP or configure a domain with Nginx reverse proxy

## References

- [NeetCode-150 Problem Data](https://github.com/neetcode-gh/leetcode)
- [NeetCode-150 JSON Index](https://github.com/krmanik/Anki-NeetCode)
- [LeetCode Problems Database](https://github.com/neenza/leetcode-problems)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Supabase Auth (Magic Links)](https://supabase.com/docs/guides/auth/auth-email)
- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)
- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
