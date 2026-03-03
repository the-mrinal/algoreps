<p align="center">
  <h1 align="center">AlgoReps</h1>
  <p align="center">
    Stop grinding. Start retaining.
    <br />
    A spaced repetition platform for mastering Data Structures & Algorithms.
    <br />
    <br />
    <a href="https://reps.mrinal.dev">Live Demo</a>
    &middot;
    <a href="https://github.com/the-mrinal/algoreps/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/the-mrinal/algoreps/issues">Request Feature</a>
  </p>
</p>

---

## The Problem

You solve 200+ LeetCode problems. Two weeks later, you blank on a medium-difficulty question in an interview. Sound familiar?

The issue isn't practice volume -- it's the **forgetting curve**. Without systematic review, retention drops exponentially within days.

## The Solution

AlgoReps applies **spaced repetition** (the same science behind Anki and language-learning apps) to DSA practice. An SM-2 variant algorithm schedules reviews at optimal intervals based on how well you performed, so you revisit problems right before you'd forget them.

Struggled? You'll see it again tomorrow. Nailed it? See you in two weeks.

---

## Features

### Spaced Repetition Engine
SM-2 variant scheduling based on self-assessed performance scores (1-5). The algorithm calculates optimal review intervals to maximize retention with minimal reviews.

| Score | Meaning | Next Review |
|-------|---------|-------------|
| 1-2   | Struggled / couldn't solve | +1 day |
| 3     | Solved with difficulty | +4 days |
| 4-5   | Solved confidently | +14 days |

### Built-in Code Editor
Monaco-powered editor with **Python 3** and **Go** support. Write, run, and test your solutions directly in the browser with a 10-second execution timeout and stdout/stderr capture.

### AI Code Review (Optional)
Gemini 2.5 Flash integration that analyzes your solution for:
- Time and space complexity
- Code quality and readability
- Edge case coverage
- Alternative approaches
- Interview readiness score

### Trust Mode Logger
Solved a problem on LeetCode or in a notebook? Log it without submitting code. Add the source URL, your approach, and remarks -- it still gets scheduled for review.

### Progress Dashboard
- Total problems solved, current streak, average score
- Topic mastery chart (Recharts)
- Full submission history with sorting and filtering
- Due today / due this week counters

### Problem Bank
300+ curated problems from **NeetCode-150** and **Blind-75**, each with:
- Full description, examples, and constraints
- Python 3 and Go code stubs
- Hints and NeetCode video links
- Difficulty and topic tags

### Discord Notifications
- **Morning briefing** (8:00 AM): Lists all due revisions grouped by difficulty
- **Evening wrap-up** (9:00 PM): Daily stats, streak, and weak topics

### CSV Import
Bulk import problems from Google Sheets exports with automatic deduplication by slug.

### Theme System
Dark, light, and system modes with a neon hacker aesthetic (cyan/green/purple glow effects).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript |
| UI | React 18, [Tailwind CSS](https://tailwindcss.com) |
| Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Database | [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS) |
| Auth | Passwordless magic links (Supabase Auth) |
| AI | [Google Gemini 2.5 Flash](https://ai.google.dev) |
| Code Execution | Node.js child process (Python 3, Go) |
| Notifications | Discord Webhooks |
| Scheduling | node-cron |
| Charts | [Recharts](https://recharts.org) |
| Deployment | DigitalOcean + PM2 + Nginx + Let's Encrypt |

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Python 3** (for code execution)
- **Go** (for code execution)
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (optional, for AI review)

### 1. Clone and install

```bash
git clone https://github.com/the-mrinal/algoreps.git
cd algoreps
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in your keys:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional -- AI code review
GEMINI_API_KEY=your-gemini-api-key

# Optional -- Discord notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
CRON_SECRET=your-random-secret
```

### 3. Set up the database

Run the schema file in your Supabase SQL Editor:

```bash
# Copy the contents of supabase/schema.sql and run it in the
# Supabase Dashboard → SQL Editor
```

This creates:
- **`profiles`** -- auto-created on signup via database trigger
- **`problems`** -- problem bank with full metadata
- **`user_progress`** -- submissions, SRS state, AI reviews
- Row-Level Security policies for all tables

### 4. Seed the problem bank

```bash
npx tsx scripts/seed-problems.ts
```

This loads 300+ curated problems from `data/problems.json` into your Supabase instance.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── login/                       # Magic link auth
│   ├── auth/callback/               # OAuth callback handler
│   ├── dashboard/
│   │   ├── page.tsx                 # SRS revision queue
│   │   ├── practice/                # Code editor + problem browser
│   │   ├── log/                     # Trust mode submission form
│   │   ├── progress/                # Stats, charts, history
│   │   └── import/                  # CSV problem import
│   └── api/
│       ├── run-code/                # Python 3 / Go code execution
│       ├── analyze/                 # Gemini AI code review
│       ├── submissions/             # CRUD for user_progress
│       ├── problems/                # Problem CRUD
│       └── cron/                    # Morning & evening notification jobs
├── components/                      # UI components organized by feature
│   ├── srs/                         # RevisionQueue, RevisionCard
│   ├── practice/                    # EditorPane, ProblemPane, AIReview
│   ├── progress/                    # StatsOverview, TopicChart, HistoryTable
│   ├── logger/                      # TrustModeForm
│   ├── import/                      # SheetImportForm
│   ├── dashboard/                   # Sidebar, DesktopOnly
│   └── theme/                       # ThemeProvider, ThemeToggle
├── lib/
│   ├── supabase/                    # Browser, server, and admin clients
│   ├── srs.ts                       # SM-2 variant algorithm
│   ├── ai-review.ts                 # Gemini prompt builder
│   ├── discord.ts                   # Discord webhook sender
│   └── problems.ts                  # Problem query helpers
├── contexts/                        # React contexts (user/premium state)
└── types/                           # Shared TypeScript interfaces

scripts/                             # Seed, deploy, and cron scripts
data/                                # Problem bank JSON + solution templates
supabase/                            # Schema SQL + migrations
```

---

## Database Schema

### `profiles`
Extends Supabase Auth. Auto-created via trigger on signup.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | References `auth.users` |
| `email` | text | User email |
| `display_name` | text | Optional display name |
| `is_premium` | boolean | Unlocks AI features |
| `theme_preference` | text | `light`, `dark`, or `system` |

### `user_progress`
Tracks every submission and its SRS state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Submission ID |
| `user_id` | UUID (FK) | References `profiles` |
| `problem_id` | text | Problem slug |
| `performance_score` | int | Self-assessed score (1-5) |
| `next_revision_date` | timestamp | SRS-calculated next review |
| `code` | text | Submitted solution |
| `approach` | text | Notes on approach taken |
| `time_taken_mins` | int | Time spent |
| `ai_review` | JSONB | Gemini analysis response |
| `is_self_reported` | boolean | Trust mode flag |
| `source_url` | text | External problem URL |
| `topics` | text[] | Topic tags |

### `problems`
The problem bank. Publicly readable by authenticated users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Problem ID |
| `title` | text | Problem title |
| `slug` | text (unique) | URL-safe identifier |
| `difficulty` | text | Easy / Medium / Hard |
| `category` | text | Problem category |
| `sheets` | text[] | Source sheets (neetcode-150, blind-75) |
| `topics` | text[] | Topic tags |
| `description` | text | Full problem statement |
| `examples` | JSONB[] | Input/output examples |
| `code_snippets` | JSONB | Language-keyed code stubs |

All tables are protected by **Row-Level Security** -- users can only access their own data.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/run-code` | Execute Python 3 / Go code with stdin |
| `POST` | `/api/analyze` | AI code review (premium) |
| `POST` | `/api/submissions` | Create a submission |
| `PATCH` | `/api/submissions` | Update score / AI review |
| `GET` | `/api/problems` | Fetch problems (with filters) |
| `POST` | `/api/import-problems` | Bulk CSV import |
| `DELETE` | `/api/user-data` | Clear all user submissions |
| `GET` | `/api/cron/morning` | Trigger morning briefing |
| `GET` | `/api/cron/evening` | Trigger evening wrap-up |

Cron endpoints are protected by a `CRON_SECRET` header.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production setup instructions covering:
- DigitalOcean droplet provisioning
- PM2 process management
- Nginx reverse proxy configuration
- Let's Encrypt SSL certificates
- Crontab setup for notifications

---

## Scripts

```bash
npm run dev                          # Start dev server (port 3000)
npm run build                        # Production build
npm start                            # Start production server
npm run lint                         # Run ESLint
npx tsx scripts/seed-problems.ts     # Seed problem bank into Supabase
npx tsx scripts/merge-problems.ts    # Rebuild problem bank from sources
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Run lint checks (`npm run lint`)
5. Commit your changes (`git commit -m 'feat: add your feature'`)
6. Push to your branch (`git push origin feat/your-feature`)
7. Open a Pull Request

Please follow the existing code style and conventions.

---

## Roadmap

- [ ] Multi-language support (Java, C++, JavaScript)
- [ ] Collaborative problem sets
- [ ] Streak calendar visualization
- [ ] Mobile app (React Native)
- [ ] Custom SRS intervals
- [ ] Public problem set sharing
- [ ] LeetCode API integration for auto-importing submissions

---

## License

This project is licensed under the MIT License -- see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- Problem bank sourced from [NeetCode](https://neetcode.io) and [Blind 75](https://www.teamblind.com/post/New-Year-Gift---Curated-List-of-Top-75-LeetCode-Questions-to-Save-Your-Time-OaM1orEU)
- Spaced repetition algorithm based on [SM-2](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and [Monaco Editor](https://microsoft.github.io/monaco-editor/)
