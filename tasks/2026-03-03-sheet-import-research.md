---
date: 2026-03-03T13:46:15Z
researcher: claude
git_commit: f1d873dddbcc1ec2d6b2b625e19047dc611dd0ff
branch: ralph/dsa-spaced-repetition-platform
repository: dsa-dashboard
topic: "Sheet import capability and deduplication - current state research"
tags: [research, codebase, import, sheets, problems, deduplication]
status: complete
last_updated: 2026-03-03
last_updated_by: claude
---

# Research: Sheet Import Capability & Deduplication

**Date**: 2026-03-03T13:46:15Z
**Git Commit**: f1d873dddbcc1ec2d6b2b625e19047dc611dd0ff
**Branch**: ralph/dsa-spaced-repetition-platform
**Repository**: dsa-dashboard

## Research Question
User wants to import questions from different DSA sheets (Striver sheet, NeetCode sheet, etc.) into the DB with deduplication across sheets. Currently there is no option to import questions.

## Summary

**Problems are NOT stored in the database.** The current system stores 150 NeetCode-150 problems as a static JSON file (`data/problems.json`) that is loaded into memory at runtime. There is no database table for problems/questions — only `user_progress` (for tracking submissions) and `profiles` exist in the Supabase schema. There is no UI or API endpoint to import, add, or manage the problem set. The only way to change the problem set is to run the `scripts/merge-problems.ts` script locally, which merges data from 3 hardcoded GitHub repos into the JSON file.

## Detailed Findings

### 1. Current Problem Storage: Static JSON File

**File:** `data/problems.json` (150 problems, all NeetCode-150)

Problems are loaded from this file via `src/lib/problems.ts:7-13`:
```typescript
function loadProblems(): Problem[] {
  if (cachedProblems) return cachedProblems;
  const filePath = path.join(process.cwd(), "data", "problems.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  cachedProblems = JSON.parse(raw) as Problem[];
  return cachedProblems;
}
```
- Read once from disk, cached in memory
- No database involvement at all
- No API endpoint to modify the problem set

### 2. Current Problem Schema

**File:** `src/types/index.ts:8-25`

Each problem has these fields:
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Zero-padded LeetCode frontend ID (e.g., "0001") |
| `title` | string | Problem name |
| `slug` | string | URL-friendly identifier (e.g., "two-sum") |
| `difficulty` | "Easy" / "Medium" / "Hard" | Difficulty level |
| `category` | string | One of 18 NeetCode categories |
| `is_neetcode150` | boolean | Always `true` in current dataset |
| `is_blind75` | boolean | Whether in Blind 75 subset |
| `topics` | string[] | LeetCode topic tags |
| `description` | string | Full problem statement (text) |
| `examples` | ProblemExample[] | Example inputs/outputs |
| `constraints` | string[] | Problem constraints |
| `hints` | string[] | Solution hints |
| `code_snippets` | Record<string, string> | Starter code per language |
| `neetcode_video_id` | string / null | YouTube video ID |
| `neetcode_url` | string | NeetCode.io link |
| `leetcode_url` | string | LeetCode link |

### 3. Current Data Pipeline: merge-problems.ts

**File:** `scripts/merge-problems.ts` (378 lines)

This is the only mechanism for populating `data/problems.json`. It:

1. Clones 3 hardcoded GitHub repos into `data/sources/`:
   - `krmanik/Anki-NeetCode` — NeetCode-150 index + LeetCode JSON data
   - `neenza/leetcode-problems` — Detailed problem descriptions & examples
   - `neetcode-gh/leetcode` — Blind75 flags & video IDs

2. Uses NeetCode-150 list as the master index (only these 150 problems are included)

3. Merges data with priority: neenza > krmanik fallback

4. Writes sorted output to `data/problems.json`

**Key limitation:** The script is hardcoded to NeetCode-150 only. There is no concept of "sheets" as a first-class entity — the entire problem set IS the NeetCode-150 sheet.

### 4. Database Schema — No Problems Table

**File:** `supabase/schema.sql`

Only two tables exist:
- `profiles` — User accounts (id, email, display_name)
- `user_progress` — Submission records, references `problem_id` as TEXT (the slug)

The `problem_id` in `user_progress` is a free-text field — it's not a foreign key to any problems table. It stores the slug (e.g., "two-sum") and is matched against `data/problems.json` at display time.

### 5. How Problems Are Referenced Across the App

| Component | File | How It Uses Problems |
|-----------|------|---------------------|
| Practice page | `src/app/dashboard/practice/page.tsx` | `getAllProblems()` from JSON |
| Trust mode log | `src/app/dashboard/log/page.tsx` | `getAllProblems()` for dropdown |
| Morning cron | `src/app/api/cron/morning/route.ts` | `getAllProblems()` to map IDs → titles |
| Evening cron | `src/app/api/cron/evening/route.ts` | Builds `slugToCategory` map from all problems |
| Problem browser | `src/components/practice/ProblemBrowser.tsx` | Filters by category/difficulty |
| Problem pane | `src/components/practice/ProblemPane.tsx` | Displays description, examples, links |

### 6. Current Sheet-Related Flags

The only "sheet" concept is two boolean flags on each problem:
- `is_neetcode150: boolean` — Always `true` for current dataset
- `is_blind75: boolean` — `true` for 75 of the 150 problems

There is no:
- `sheet_name` or `sheet_source` field
- Problems table in the database
- Import API endpoint
- UI for importing/managing sheets
- Striver sheet data or references anywhere in the codebase

### 7. Deduplication — Current State

The merge script uses the **LeetCode slug** as the unique identifier:
- `nc150Map` is keyed by slug (extracted from LeetCode URL)
- `neenzaMap` is keyed by slug (extracted from filename)
- `siteDataMap` is keyed by slug

Since the script only processes the NeetCode-150 list, duplicates don't arise. There is no cross-sheet deduplication logic because only one sheet exists.

## Code References

- `data/problems.json` — Static problem dataset (150 NeetCode-150 problems)
- `scripts/merge-problems.ts` — Data merge script (sole mechanism to populate problems)
- `src/lib/problems.ts` — Problem loading & query functions (reads JSON, caches in memory)
- `src/types/index.ts:8-25` — Problem interface definition
- `supabase/schema.sql:22-40` — user_progress table (only stores `problem_id` as TEXT)

## Architecture Documentation

### Current Problem Data Flow
```
GitHub Repos (3 sources)
       ↓
scripts/merge-problems.ts (run manually, local only)
       ↓
data/problems.json (static file, committed to repo)
       ↓
src/lib/problems.ts (reads JSON, caches in memory)
       ↓
Components & API routes (getAllProblems(), getProblemBySlug(), etc.)
```

### What Does NOT Exist
- No `problems` or `sheets` table in the database
- No API endpoint for importing, creating, or managing problems
- No UI for sheet management or problem import
- No Striver sheet data anywhere in the codebase
- No deduplication logic across multiple sheets
- No concept of a "sheet" as a named collection of problems

## Open Questions

1. What data source would be used for the Striver sheet? (There's no public API; would need a scraped/community dataset)
2. Should problems move from static JSON to a Supabase table to support dynamic imports?
3. Should the `slug` (LeetCode URL slug) remain the unique identifier for deduplication?
4. Should the Problem interface gain a `sheets: string[]` field (many-to-many) or should there be a separate junction table?
5. How should problems that exist in multiple sheets (e.g., "Two Sum" is in both NeetCode-150 and Striver) be handled in the UI?
