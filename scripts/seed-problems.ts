/**
 * Seed the `problems` table from data/problems.json (NeetCode-150).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-problems.ts
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

interface RawProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  is_neetcode150: boolean;
  is_blind75: boolean;
  topics: string[];
  description: string;
  examples: unknown[];
  constraints: string[];
  hints: string[];
  code_snippets: Record<string, string>;
  neetcode_video_id: string | null;
  neetcode_url: string;
  leetcode_url: string;
}

async function main() {
  const filePath = path.join(__dirname, "..", "data", "problems.json");
  const raw: RawProblem[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log(`Loaded ${raw.length} problems from problems.json`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const p of raw) {
    const sheets: string[] = [];
    if (p.is_neetcode150) sheets.push("neetcode-150");
    if (p.is_blind75) sheets.push("blind-75");

    const row = {
      leetcode_id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      category: p.category,
      sheets,
      topics: p.topics,
      description: p.description,
      examples: p.examples,
      constraints: p.constraints,
      hints: p.hints,
      code_snippets: p.code_snippets,
      neetcode_video_id: p.neetcode_video_id,
      neetcode_url: p.neetcode_url,
      leetcode_url: p.leetcode_url,
    };

    // Check if problem exists
    const { data: existing } = await supabase
      .from("problems")
      .select("id, sheets")
      .eq("slug", p.slug)
      .single();

    if (existing) {
      // Merge sheets arrays
      const mergedSheets = Array.from(new Set([...existing.sheets, ...sheets]));
      const { error } = await supabase
        .from("problems")
        .update({ ...row, sheets: mergedSheets, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) {
        console.error(`Error updating ${p.slug}:`, error.message);
        errors++;
      } else {
        updated++;
      }
    } else {
      const { error } = await supabase.from("problems").insert(row);

      if (error) {
        console.error(`Error inserting ${p.slug}:`, error.message);
        errors++;
      } else {
        inserted++;
      }
    }
  }

  console.log(`Done: ${inserted} inserted, ${updated} updated, ${errors} errors`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
