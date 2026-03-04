/**
 * Seed the `pattern_order` column on the `problems` table using NeetCode-150 roadmap order.
 *
 * Ordering rules:
 *   - Categories follow NeetCode roadmap order (Arrays & Hashing → Bit Manipulation)
 *   - Within each category: Easy first, then Medium, then Hard
 *   - pattern_order assigned 1-150 sequentially
 *   - Problems not in NeetCode-150 (custom/user-added) keep pattern_order = NULL
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-pattern-order.ts
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// NeetCode roadmap category order
const CATEGORY_ORDER = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Tries",
  "Heap / Priority Queue",
  "Backtracking",
  "Graphs",
  "Advanced Graphs",
  "1-D Dynamic Programming",
  "2-D Dynamic Programming",
  "Greedy",
  "Intervals",
  "Math & Geometry",
  "Bit Manipulation",
];

const DIFFICULTY_ORDER: Record<string, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

interface NeetCodeProblem {
  url: string;
  difficulty: string;
}

type NeetCodeList = Record<string, Record<string, NeetCodeProblem>>;

function extractSlug(leetcodeUrl: string): string {
  // e.g. "https://leetcode.com/problems/contains-duplicate/" → "contains-duplicate"
  const match = leetcodeUrl.match(/\/problems\/([^/]+)/);
  if (!match) throw new Error(`Cannot extract slug from ${leetcodeUrl}`);
  return match[1];
}

async function main() {
  const filePath = path.join(
    __dirname,
    "..",
    "data",
    "sources",
    "Anki-NeetCode",
    "neetcode-150-list.json"
  );
  const neetcodeList: NeetCodeList = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Build ordered list: [{ slug, order }]
  const orderedProblems: { slug: string; order: number }[] = [];
  let order = 1;

  for (const category of CATEGORY_ORDER) {
    const problems = neetcodeList[category];
    if (!problems) {
      console.warn(`Category "${category}" not found in neetcode-150-list.json`);
      continue;
    }

    // Sort problems within category: Easy → Medium → Hard
    const entries = Object.entries(problems).sort(
      ([, a], [, b]) => (DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.difficulty] ?? 1)
    );

    for (const [, problem] of entries) {
      const slug = extractSlug(problem.url);
      orderedProblems.push({ slug, order });
      order++;
    }
  }

  console.log(`Computed ordering for ${orderedProblems.length} NeetCode-150 problems`);

  // First, reset all pattern_order to NULL (idempotent)
  const { error: resetError } = await supabase
    .from("problems")
    .update({ pattern_order: null })
    .not("pattern_order", "is", null);

  if (resetError) {
    console.warn("Reset warning (may be no-op):", resetError.message);
  }

  let updated = 0;
  let notFound = 0;

  for (const { slug, order: patternOrder } of orderedProblems) {
    const { data, error } = await supabase
      .from("problems")
      .update({ pattern_order: patternOrder })
      .eq("slug", slug)
      .select("slug");

    if (error) {
      console.error(`Error updating ${slug}:`, error.message);
    } else if (!data || data.length === 0) {
      console.warn(`Problem not found in DB: ${slug}`);
      notFound++;
    } else {
      updated++;
    }
  }

  console.log(`Done: ${updated} updated, ${notFound} not found in DB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
