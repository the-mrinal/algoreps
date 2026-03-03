# PRD: DSA Spaced Repetition Platform

## Introduction

A self-hosted, multi-user DSA preparation platform with an in-browser code editor, on-demand AI code review (free-tier Gemini API), and spaced repetition scheduling. Next.js dashboard as the central read/write client, Discord webhooks for push notifications, Supabase for all state. Deployed on a DigitalOcean Droplet for a small study group (2-5 users).

Users can browse NeetCode-150 problems by category, write and execute code in-browser (with custom input/output), get AI-powered reviews, log externally-solved problems, track progress with SRS scheduling, view stats/streaks, and receive automated Discord alerts.

## Goals

- Provide a unified DSA practice hub for a small study group with passwordless auth
- Offer an in-browser code editor with live execution (custom input → stdout output)
- Deliver free AI-powered code reviews via Gemini 2.5 Flash on manual trigger
- Schedule revisions using SM-2 variant spaced repetition
- Support two tracks: in-app practice (Track A) and external problem logging (Track B)
- Push daily revision reminders and progress summaries via Discord webhooks
- Deploy on a single DigitalOcean Droplet with minimal ops overhead

## User Stories

### US-001: Initialize Next.js project with core dependencies
**Description:** As a developer, I need a scaffolded Next.js 14 project with TypeScript, Tailwind CSS, and all required dependencies so that development can begin.

**Acceptance Criteria:**
- [ ] Next.js 14 project created with App Router, TypeScript, Tailwind CSS, ESLint, `src/` directory
- [ ] Dependencies installed: `@supabase/supabase-js`, `@monaco-editor/react`, `node-cron`
- [ ] `.env.local.example` created with placeholder keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`
- [ ] Project directory structure matches the layout defined in Technical Considerations
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

### US-002: Build unified problem bank from source repos
**Description:** As a developer, I need a merge script that combines NeetCode-150 problem data from three GitHub repos into a single `data/problems.json` file so the app has a complete problem bank.

**Acceptance Criteria:**
- [ ] `scripts/merge-problems.ts` created
- [ ] Script reads NeetCode-150 list from `krmanik/Anki-NeetCode` (category mapping, URLs)
- [ ] Script matches each problem to `neenza/leetcode-problems/problems/{number}-{slug}.json` (descriptions, examples, constraints, hints, code snippets)
- [ ] Script enriches with Blind75 flag and YouTube video ID from `neetcode-gh/leetcode/.problemSiteData.json`
- [ ] Outputs `data/problems.json` with all 150 problems in the unified schema (see Technical Considerations)
- [ ] Each problem has: id, title, slug, difficulty, category, is_neetcode150, is_blind75, topics, description, examples, constraints, hints, code_snippets (javascript + python3 at minimum), neetcode_video_id, neetcode_url, leetcode_url
- [ ] All 18 NeetCode categories are represented
- [ ] `data/sources/` is gitignored; `data/problems.json` is committed
- [ ] Script can be re-run idempotently

### US-003: Define TypeScript interfaces and problem loader
**Description:** As a developer, I need shared TypeScript types and a utility to load problem data so all components use consistent interfaces.

**Acceptance Criteria:**
- [ ] `src/types/index.ts` defines interfaces: `Problem`, `UserProgress`, `AIReview`, `SRSCalculation`
- [ ] `src/lib/problems.ts` exports functions to: load all problems, get problem by slug, filter by category, filter by difficulty
- [ ] Problem data loaded from `data/problems.json` at build time (static import or fs read in server components)
- [ ] Typecheck passes

### US-004: Set up Supabase schema with profiles and user_progress
**Description:** As a developer, I need the database schema deployed to Supabase so the app can store user data and submission history.

**Acceptance Criteria:**
- [ ] `supabase/schema.sql` contains full schema: `profiles` table, `user_progress` table, triggers, indexes, RLS policies
- [ ] `profiles` table: id (UUID, FK to auth.users), email, display_name, created_at, updated_at
- [ ] `user_progress` table: id, user_id, problem_id, is_self_reported, source_url, topics, approach, remarks, code, time_taken_mins, performance_score (1-5), time_complexity, space_complexity, ai_review (JSONB), next_revision_date, created_at, updated_at
- [ ] Trigger `on_auth_user_created` auto-creates profile row on signup
- [ ] Index on `(user_id, next_revision_date)` for SRS queries
- [ ] Index on `(user_id, problem_id, created_at DESC)` for history queries
- [ ] RLS enabled on both tables: users can only read/write their own data
- [ ] SQL applies without errors in Supabase SQL editor

### US-005: Implement magic link authentication flow
**Description:** As a user, I want to log in via a magic link sent to my email so I don't need to remember a password.

**Acceptance Criteria:**
- [ ] `src/lib/supabase/client.ts` — browser Supabase client
- [ ] `src/lib/supabase/server.ts` — server-side Supabase client using cookies
- [ ] `src/middleware.ts` — refreshes auth session on every request
- [ ] `src/app/login/page.tsx` — email input form, calls `supabase.auth.signInWithOtp()`
- [ ] `src/app/auth/callback/route.ts` — handles magic link redirect, exchanges code for session
- [ ] After login, user is redirected to `/dashboard`
- [ ] Unauthenticated access to `/dashboard/*` redirects to `/login`
- [ ] Session persists across page refreshes
- [ ] Typecheck passes
- [ ] Verify login page in browser

### US-006: Create authenticated dashboard layout with navigation
**Description:** As a user, I want a dashboard shell with navigation so I can move between practice, logging, and progress views.

**Acceptance Criteria:**
- [ ] `src/app/dashboard/layout.tsx` — protected layout that checks session, redirects to `/login` if unauthenticated
- [ ] Sidebar or top navigation with links: Dashboard (SRS Queue), Practice, Log, Progress
- [ ] Shows current user email/display name
- [ ] Logout button that calls `supabase.auth.signOut()` and redirects to `/login`
- [ ] Responsive layout (works on desktop, usable on tablet)
- [ ] Typecheck passes
- [ ] Verify navigation in browser

### US-007: Build problem browser with category filtering
**Description:** As a user, I want to browse NeetCode-150 problems by category so I can pick what to practice.

**Acceptance Criteria:**
- [ ] `src/app/dashboard/practice/page.tsx` — main practice page
- [ ] Category sidebar listing all 18 NeetCode categories with problem counts
- [ ] Problem list filtered by selected category
- [ ] Each problem row shows: title, difficulty badge (Easy=green, Medium=yellow, Hard=red), Blind75 indicator
- [ ] Click a problem to load it into the practice arena (US-008, US-009)
- [ ] Search/filter by problem title
- [ ] Typecheck passes
- [ ] Verify problem browser in browser

### US-008: Display problem description pane
**Description:** As a user, I want to read the full problem description, examples, and constraints while coding so I understand what to solve.

**Acceptance Criteria:**
- [ ] `src/components/practice/ProblemPane.tsx` — left pane of practice arena
- [ ] Renders: problem title, difficulty badge, category tag, topics
- [ ] Renders: full description (HTML/markdown safe), examples with input/output, constraints
- [ ] Collapsible hints section
- [ ] External links: "View on LeetCode", "Watch NeetCode Video" (opens in new tab)
- [ ] Typecheck passes
- [ ] Verify problem pane renders correctly in browser

### US-009: Implement code editor with input/output executor
**Description:** As a user, I want to write code in an in-browser editor, provide custom input, and run it to see stdout output so I can test my solution.

**Acceptance Criteria:**
- [ ] `src/components/practice/EditorPane.tsx` — right pane with Monaco Editor configured for JavaScript
- [ ] Editor pre-populated with the problem's JavaScript code snippet
- [ ] Custom input textarea below the editor where users can type test input (stdin)
- [ ] "Run Code" button that sends code + input to the execution API
- [ ] `src/app/api/run-code/route.ts` — receives code + stdin input, writes to temp file, executes in a child process, returns stdout/stderr
- [ ] Execution has a 10-second timeout to prevent infinite loops
- [ ] Output panel below editor shows: stdout, stderr (if any), execution time (ms)
- [ ] Clear visual indication of success (ran without errors) vs runtime error
- [ ] "Analyze & Score" button visible (triggers AI review in US-010)
- [ ] Typecheck passes
- [ ] Verify code execution flow in browser

### US-010: Integrate Gemini AI code review
**Description:** As a user, I want to click "Analyze & Score" to get an AI-powered review of my solution so I can understand its quality and learn improvements.

**Acceptance Criteria:**
- [ ] `src/lib/ai-review.ts` — builds the Gemini prompt with code, problem title, and problem description
- [ ] `src/app/api/analyze/route.ts` — calls Gemini 2.5 Flash API with `responseMimeType: 'application/json'`, returns structured review
- [ ] Response includes: time_complexity, space_complexity, performance_score (1-5), review object (code_quality, edge_cases, alternative_approaches, interview_readiness)
- [ ] `src/components/practice/AIReview.tsx` — displays complexity, score (visual 1-5 indicator), and all review sections
- [ ] Loading state while API call is in progress
- [ ] Error handling: show user-friendly message if Gemini API fails or rate-limits
- [ ] Typecheck passes
- [ ] Verify AI review display in browser

### US-011: Save practice submission with SRS scheduling
**Description:** As a user, after reviewing my AI score, I want to save my submission so it's tracked and scheduled for future revision.

**Acceptance Criteria:**
- [ ] "Save & Schedule Revision" button on the AI review panel
- [ ] `src/lib/srs.ts` — `calculateNextRevisionDate(score)`: score 1-2 → +1 day, score 3 → +4 days, score 4-5 → +14 days
- [ ] On save, POST to `/api/submissions` with: problem_id, code, performance_score, time_complexity, space_complexity, ai_review (full JSON), is_self_reported=false
- [ ] API calculates and sets `next_revision_date` using SRS logic
- [ ] Record inserted into `user_progress` in Supabase
- [ ] Success confirmation shown to user
- [ ] After save, user can navigate to next problem or return to browser
- [ ] Typecheck passes

### US-012: Build Trust Mode logger form for external submissions
**Description:** As a user, I want to log a problem I solved on LeetCode so it's tracked in my SRS schedule without re-solving it here.

**Acceptance Criteria:**
- [ ] `src/app/dashboard/log/page.tsx` and `src/components/logger/TrustModeForm.tsx`
- [ ] Form fields: problem selector (searchable dropdown from problems.json), LeetCode URL (optional), code paste area (with syntax highlighting), multi-select topics/tags, approach textarea, remarks textarea, self-assessed score slider (1-5 with labels: Struggled → Optimal), time taken (minutes), time complexity dropdown, space complexity dropdown
- [ ] Submit button posts to `/api/submissions` with `is_self_reported: true`
- [ ] Validation: problem and score are required; other fields optional
- [ ] Success confirmation with link to view in progress history
- [ ] Typecheck passes
- [ ] Verify form in browser

### US-013: Implement submissions CRUD API
**Description:** As a developer, I need a submissions API to create and read user progress records from Supabase.

**Acceptance Criteria:**
- [ ] `src/app/api/submissions/route.ts`
- [ ] POST: validates input, calculates `next_revision_date` via SRS logic, inserts into `user_progress`, returns created record
- [ ] GET: returns current user's submissions with pagination (limit/offset), optional filters: problem_id, is_self_reported, date range
- [ ] All queries scoped to authenticated user via Supabase RLS
- [ ] Returns proper HTTP status codes (201 for create, 200 for read, 401 for unauthenticated)
- [ ] Typecheck passes

### US-014: Build SRS revision queue on dashboard home
**Description:** As a user, I want to see my daily revision queue on the dashboard home so I know which problems are due for review.

**Acceptance Criteria:**
- [ ] `src/app/dashboard/page.tsx` — dashboard home page
- [ ] Queries Supabase: `user_progress WHERE user_id = current AND next_revision_date <= NOW()`
- [ ] Shows total count of due revisions
- [ ] Groups revisions by last score: Hard (1-2), Medium (3), Easy (4-5)
- [ ] Each item shows: problem title, category, last score, days since last attempt
- [ ] Empty state message when no revisions are due ("You're all caught up!")
- [ ] Typecheck passes
- [ ] Verify SRS queue in browser

### US-015: Implement revision card with progressive disclosure
**Description:** As a user, I want to reveal my previous approach, remarks, and code step-by-step during revision so I practice active recall before seeing the answer.

**Acceptance Criteria:**
- [ ] `src/components/srs/RevisionCard.tsx`
- [ ] Default state: problem title, topic tags, last score badge, days since last attempt
- [ ] Step 1: "Reveal Approach" button → shows approach text
- [ ] Step 2: "Reveal Remarks" button → shows remarks/notes
- [ ] Step 3: "Reveal Code" button → shows previous solution with syntax highlighting
- [ ] "Practice Again" button → navigates to Practice Arena with this problem pre-loaded
- [ ] "Quick Re-Score" buttons (1-5) → updates `next_revision_date` in Supabase without re-solving
- [ ] After re-scoring, card moves to "Reviewed" section or disappears from queue
- [ ] Typecheck passes
- [ ] Verify progressive disclosure in browser

### US-016: Build stats overview component
**Description:** As a user, I want to see my overall stats (streak, totals, averages) so I can track my DSA preparation progress.

**Acceptance Criteria:**
- [ ] `src/app/dashboard/progress/page.tsx` — progress page
- [ ] `src/components/progress/StatsOverview.tsx` — stats cards at top of page
- [ ] Displays: total unique problems solved, current streak (consecutive days with ≥1 submission), total submissions (including re-attempts), average performance score (overall), problems due today, problems due this week
- [ ] Streak calculation: count consecutive days backwards from today where at least 1 submission exists
- [ ] All stats scoped to current user
- [ ] Typecheck passes
- [ ] Verify stats in browser

### US-017: Build topic mastery chart
**Description:** As a user, I want to see my average score per NeetCode category in a chart so I can identify weak areas to focus on.

**Acceptance Criteria:**
- [ ] `src/components/progress/TopicChart.tsx`
- [ ] Bar or radar chart showing average performance score per category
- [ ] Uses a lightweight chart library (e.g., `recharts`)
- [ ] Highlights weak areas: categories with average score < 3 shown in red/warning color
- [ ] Shows attempt count per category as secondary info
- [ ] Handles empty state (no data yet)
- [ ] Typecheck passes
- [ ] Verify chart renders in browser

### US-018: Build submission history table
**Description:** As a user, I want to see a sortable, filterable table of all my submissions so I can review my practice history.

**Acceptance Criteria:**
- [ ] `src/components/progress/HistoryTable.tsx`
- [ ] Columns: Date, Problem Title, Difficulty, Score (1-5), Time Taken, Time Complexity, Space Complexity, Track (A=Practice / B=Trust Mode)
- [ ] Sortable by any column
- [ ] Filters: category dropdown, difficulty dropdown, score range, date range
- [ ] Click row to expand and show: approach, remarks, AI review (if Track A)
- [ ] Pagination (20 items per page)
- [ ] Typecheck passes
- [ ] Verify table in browser

### US-019: Implement Discord webhook helper
**Description:** As a developer, I need a reusable Discord webhook utility so the cron jobs can send formatted notifications.

**Acceptance Criteria:**
- [ ] `src/lib/discord.ts` — exports `sendDiscordEmbed(title, fields, color)` function
- [ ] Sends rich embed via POST to `DISCORD_WEBHOOK_URL` env var
- [ ] Embed includes: title, fields array (name/value pairs), color (hex), timestamp
- [ ] Handles errors gracefully (logs failure, does not throw)
- [ ] Typecheck passes

### US-020: Build morning revision briefing cron endpoint
**Description:** As a user, I want to receive a Discord message each morning listing my due revisions so I know what to practice today.

**Acceptance Criteria:**
- [ ] `src/app/api/cron/morning/route.ts`
- [ ] Queries all users with due revisions (`next_revision_date <= NOW()`)
- [ ] Per user, groups problems by last score: Hard (1-2, red), Medium (3, yellow), Easy (4-5, green)
- [ ] Sends one Discord embed per user with categorized problem list and dashboard link
- [ ] Secured with a `CRON_SECRET` header to prevent unauthorized triggers
- [ ] Returns 200 with summary of notifications sent
- [ ] Typecheck passes

### US-021: Build evening progress wrap-up cron endpoint
**Description:** As a user, I want to receive a Discord summary each evening showing my daily progress, streak, and insights.

**Acceptance Criteria:**
- [ ] `src/app/api/cron/evening/route.ts`
- [ ] Calculates per user: problems solved today, track split (A vs B count), current streak, weekly progress
- [ ] Identifies topic insight: category with most attempts or lowest average this week
- [ ] Sends one Discord embed per user with daily stats
- [ ] Secured with `CRON_SECRET` header
- [ ] Returns 200 with summary
- [ ] Typecheck passes

### US-022: Configure cron scheduling for Discord notifications
**Description:** As a developer, I need cron jobs to trigger the morning and evening endpoints automatically on the DigitalOcean Droplet.

**Acceptance Criteria:**
- [ ] `scripts/cron-setup.sh` or documentation for setting up cron on the droplet
- [ ] Morning briefing triggers at 8:00 AM IST daily
- [ ] Evening wrap-up triggers at 9:00 PM IST daily
- [ ] Cron jobs call the API endpoints with the `CRON_SECRET` header
- [ ] Approach: either `node-cron` in a separate process, system crontab, or external cron service
- [ ] Typecheck passes

### US-023: Deploy to DigitalOcean Droplet
**Description:** As a developer, I need the app deployed and running on a DigitalOcean Droplet so the study group can access it.

**Acceptance Criteria:**
- [ ] Deployment script or documentation: `scripts/deploy.sh` or `DEPLOYMENT.md`
- [ ] `next build && next start` runs via PM2 for process management
- [ ] Nginx reverse proxy configured for the domain/IP
- [ ] Environment variables set on the droplet
- [ ] App accessible via droplet IP or domain
- [ ] HTTPS configured (Let's Encrypt via certbot, or Cloudflare)
- [ ] Cron jobs running (from US-022)

## Functional Requirements

- FR-1: The system must authenticate users via Supabase magic link (email OTP). No password auth.
- FR-2: The system must load NeetCode-150 problems from a static `data/problems.json` file at build time.
- FR-3: The system must display problems grouped by 18 NeetCode categories with difficulty badges.
- FR-4: The system must provide a Monaco code editor pre-populated with the problem's JavaScript code snippet.
- FR-5: The system must execute user code server-side with custom stdin input and return stdout/stderr with a 10-second timeout.
- FR-6: The system must call Gemini 2.5 Flash API on manual "Analyze & Score" trigger and return structured JSON review.
- FR-7: The system must calculate `next_revision_date` using SM-2 variant: score 1-2 → +1 day, score 3 → +4 days, score 4-5 → +14 days.
- FR-8: The system must store all submissions in `user_progress` with RLS ensuring users only access their own data.
- FR-9: The system must support Trust Mode logging for externally-solved problems with `is_self_reported: true`.
- FR-10: The system must display a daily SRS queue showing problems where `next_revision_date <= NOW()`.
- FR-11: The system must support progressive disclosure on revision cards (approach → remarks → code).
- FR-12: The system must display user stats: unique problems solved, streak, total submissions, average score, due counts.
- FR-13: The system must display a topic mastery chart with per-category average scores.
- FR-14: The system must provide a sortable, filterable submission history table.
- FR-15: The system must send Discord embeds at 8 AM IST (morning revisions) and 9 PM IST (evening wrap-up).
- FR-16: Cron endpoints must be secured with a `CRON_SECRET` header.

## Non-Goals

- No real-time collaborative features or multiplayer
- No LLM-generated problems (all sourced from existing repos)
- No mobile app (responsive web only)
- No payment or subscription system
- No LeetCode API integration (manual copy-paste only)
- No two-way Discord bot (webhooks only, read-only push)
- No per-problem test case mapping or automated test suites — execution is generic (code + stdin → stdout)
- No language switching in the editor (JavaScript only for v1)
- No code persistence/drafts between sessions (only saved on explicit submit)

## Design Considerations

- Dual-pane layout for Practice Arena: problem description left, editor + output right
- Dashboard home is the SRS queue (most important daily view)
- Navigation: sidebar with 4 items (Dashboard, Practice, Log, Progress)
- Color coding: Easy=green, Medium=yellow, Hard=red throughout
- Monaco Editor with dark theme for code editing
- Progressive disclosure on revision cards to enforce active recall
- Mobile-responsive but optimized for desktop (coding on mobile is impractical)

## Technical Considerations

- **Next.js 14 App Router** with TypeScript, Tailwind CSS
- **Supabase** for auth (magic links), database (PostgreSQL), and RLS
- **Monaco Editor** (`@monaco-editor/react`) lazy-loaded to avoid blocking initial render
- **Gemini 2.5 Flash** free tier: 500 req/day, 1M tokens/day — more than sufficient for a small group
- **Code execution**: child process with temp file, 10s timeout, sandboxed directory
- **Problem data**: static JSON loaded at build time (no runtime DB for problems)
- **Charts**: `recharts` for topic mastery visualization
- **Deployment**: DigitalOcean Droplet, PM2, Nginx reverse proxy, Let's Encrypt
- **Cron**: system crontab or `node-cron` for Discord notification scheduling

### Project Structure
```
dsa-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # SRS queue
│   │   │   ├── practice/page.tsx
│   │   │   ├── log/page.tsx
│   │   │   └── progress/page.tsx
│   │   └── api/
│   │       ├── analyze/route.ts
│   │       ├── run-code/route.ts
│   │       ├── submissions/route.ts
│   │       └── cron/
│   │           ├── morning/route.ts
│   │           └── evening/route.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── srs.ts
│   │   ├── ai-review.ts
│   │   ├── discord.ts
│   │   └── problems.ts
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   ├── practice/
│   │   │   ├── ProblemPane.tsx
│   │   │   ├── EditorPane.tsx
│   │   │   └── AIReview.tsx
│   │   ├── logger/TrustModeForm.tsx
│   │   ├── srs/RevisionCard.tsx
│   │   └── progress/
│   │       ├── StatsOverview.tsx
│   │       ├── TopicChart.tsx
│   │       └── HistoryTable.tsx
│   └── types/index.ts
├── data/
│   ├── problems.json
│   └── sources/              # gitignored
├── scripts/
│   ├── merge-problems.ts
│   └── ralph/
├── supabase/
│   └── schema.sql
└── .env.local
```

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
  "examples": [{ "example_num": 1, "example_text": "Input: ...\nOutput: ...", "images": [] }],
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

## Success Metrics

- All study group members can sign up, log in, and access the dashboard
- A user can solve a problem end-to-end: browse → code → execute → AI review → save
- A user can log an external problem and see it in their SRS queue when due
- SRS queue correctly shows due problems based on past scores
- Progress stats accurately reflect submission data
- Discord notifications fire daily at scheduled times with correct data
- App runs stable on DigitalOcean Droplet with no downtime during normal use

## Open Questions

- Should we support Python execution in addition to JavaScript in a future version?
- Should Discord messages tag specific users or post to a shared channel?
- Do we need rate limiting on the Gemini API endpoint beyond the free tier limits?
- Should the problem browser show completion status (solved/unsolved) per problem?
