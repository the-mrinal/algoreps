# AlgoReps

A spaced repetition platform for mastering Data Structures & Algorithms. Instead of grinding 200+ LeetCode problems and forgetting them in days, AlgoReps uses an SM-2 variant scheduling algorithm to enforce systematic review and build long-term retention.

## Features

- **Spaced Repetition Engine** -- SM-2 variant algorithm schedules reviews based on performance (1-5 score). Struggled? Review tomorrow. Nailed it? See you in 2 weeks.
- **Code Editor** -- Monaco-powered editor with Python 3 and Go support. Run code locally with 10s timeout and stdout/stderr capture.
- **AI Code Review** -- Optional Gemini 2.5 Flash analysis for time/space complexity, code quality, and edge case coverage.
- **Trust Mode Logger** -- Track problems solved externally (on LeetCode, Blind75, etc.) without submitting code.
- **Progress Dashboard** -- Stats, streaks, topic mastery charts, and full submission history with filtering.
- **Problem Bank** -- 300+ curated problems from NeetCode-150 and Blind-75 with descriptions, examples, hints, and video links.
- **Discord Notifications** -- Morning briefing (due revisions) and evening wrap-up (daily progress, streak, weak topics) via webhooks.
- **Dark/Light/System Theme** -- Neon hacker aesthetic with cyan/green/purple accents and glow effects.
- **CSV Import** -- Bulk import problems from Google Sheets with automatic deduplication.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | React 18, Tailwind CSS |
| Editor | Monaco Editor |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Passwordless magic links |
| AI | Google Gemini 2.5 Flash |
| Code Execution | Node.js spawn (Python 3, Go) |
| Notifications | Discord Webhooks |
| Scheduling | node-cron |
| Charts | Recharts |
| Deployment | DigitalOcean + PM2 + Nginx |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3 (for code execution)
- Go (for code execution)
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)

### Setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd dsa-dashboard
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your keys:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GEMINI_API_KEY=your-gemini-api-key
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   CRON_SECRET=your-random-secret
   ```

3. **Set up the database**

   Run `supabase/schema.sql` in your Supabase SQL Editor. This creates:
   - `profiles` -- auto-created on signup via trigger
   - `problems` -- problem bank with full metadata
   - `user_progress` -- submissions, SRS state, AI reviews
   - Row-Level Security policies for all tables

4. **Seed problems**

   ```bash
   npx tsx scripts/seed-problems.ts
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/                      # Magic link auth
│   ├── dashboard/
│   │   ├── page.tsx                # SRS revision queue
│   │   ├── practice/               # Code editor + problem browser
│   │   ├── log/                    # Trust mode submission form
│   │   ├── progress/               # Stats, charts, history
│   │   └── import/                 # CSV problem import
│   └── api/
│       ├── run-code/               # Python 3 / Go execution
│       ├── analyze/                # Gemini AI review
│       ├── submissions/            # CRUD for user_progress
│       └── cron/                   # Morning & evening notifications
├── components/                     # UI components by feature
├── lib/
│   ├── supabase/                   # Client, server, admin clients
│   ├── srs.ts                      # SM-2 variant algorithm
│   ├── ai-review.ts                # Gemini prompt builder
│   ├── discord.ts                  # Webhook sender
│   └── problems.ts                 # Problem queries
└── types/                          # Shared TypeScript interfaces

scripts/
├── seed-problems.ts                # Load problems into Supabase
├── merge-problems.ts               # Build problem bank from sources
├── deploy.sh                       # PM2 build & restart
├── cron-setup.sh                   # Install crontab entries
└── nginx-dsa-dashboard.conf        # Reverse proxy config
```

## SRS Algorithm

The scheduling uses an SM-2 variant based on performance score:

| Score | Meaning | Next Review |
|---|---|---|
| 1-2 | Struggled / couldn't solve | +1 day |
| 3 | Solved with difficulty | +4 days |
| 4-5 | Solved confidently | +14 days |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production setup instructions (DigitalOcean, PM2, Nginx, Let's Encrypt, cron jobs).

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run ESLint
```

## License

Private project. All rights reserved.
