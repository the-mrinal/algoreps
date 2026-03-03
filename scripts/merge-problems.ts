#!/usr/bin/env npx tsx

/**
 * merge-problems.ts
 *
 * Clones 3 GitHub repos and merges NeetCode-150 problem data into
 * a single data/problems.json file with unified schema.
 *
 * Usage: npx tsx scripts/merge-problems.ts
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ── Paths ──────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const SOURCES_DIR = path.join(ROOT, "data", "sources");
const OUTPUT_FILE = path.join(ROOT, "data", "problems.json");

const REPO_KRMANIK = path.join(SOURCES_DIR, "Anki-NeetCode");
const REPO_NEENZA = path.join(SOURCES_DIR, "leetcode-problems");
const REPO_NEETCODE = path.join(SOURCES_DIR, "leetcode");

// ── Source repo URLs ───────────────────────────────────────────────
const REPOS = [
  {
    url: "https://github.com/krmanik/Anki-NeetCode.git",
    dir: REPO_KRMANIK,
  },
  {
    url: "https://github.com/neenza/leetcode-problems.git",
    dir: REPO_NEENZA,
  },
  {
    url: "https://github.com/neetcode-gh/leetcode.git",
    dir: REPO_NEETCODE,
  },
];

// ── Types ──────────────────────────────────────────────────────────

interface NeetCode150Entry {
  nurl: string;
  url: string;
  difficulty: string;
}

type NeetCode150List = Record<string, Record<string, NeetCode150Entry>>;

interface ProblemSiteDataEntry {
  problem: string;
  pattern: string;
  link: string;
  video: string;
  difficulty: string;
  code: string;
  neetcode150?: boolean;
  blind75?: boolean;
  premium?: boolean;
}

interface NeenzaProblem {
  title: string;
  problem_id: string;
  frontend_id: string;
  difficulty: string;
  problem_slug: string;
  topics: string[];
  description: string;
  examples: { example_num: number; example_text: string; images: string[] }[];
  constraints: string[];
  hints: string[];
  code_snippets: Record<string, string>;
}

interface KrmanikQuestion {
  questionId: string;
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  content: string | null;
  difficulty: string;
  topicTags: { name: string; slug: string }[];
  codeSnippets: { lang: string; langSlug: string; code: string }[] | null;
  hints: string[];
}

interface UnifiedProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  is_neetcode150: boolean;
  is_blind75: boolean;
  topics: string[];
  description: string;
  examples: { example_num: number; example_text: string; images: string[] }[];
  constraints: string[];
  hints: string[];
  code_snippets: { javascript: string; python3: string; [key: string]: string };
  neetcode_video_id: string;
  neetcode_url: string;
  leetcode_url: string;
}

// ── Helpers ────────────────────────────────────────────────────────

function extractSlug(leetcodeUrl: string): string {
  const match = leetcodeUrl.match(/\/problems\/([^/]+)/);
  return match ? match[1] : "";
}

function padId(frontendId: string): string {
  return frontendId.padStart(4, "0");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseKrmanikProblem(
  slug: string,
  nc150: { category: string; neetcode_url: string; title: string; difficulty: string },
  siteInfo: { is_blind75: boolean; video: string; code: string } | undefined,
  krmanikDataDir: string
): UnifiedProblem | null {
  const filePath = path.join(krmanikDataDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const q: KrmanikQuestion = raw.data.question;

  const codeSnippets: Record<string, string> = {};
  if (q.codeSnippets) {
    for (const snippet of q.codeSnippets) {
      if (snippet.langSlug === "javascript") codeSnippets.javascript = snippet.code;
      if (snippet.langSlug === "python3") codeSnippets.python3 = snippet.code;
      if (snippet.langSlug === "typescript") codeSnippets.typescript = snippet.code;
    }
  }

  return {
    id: padId(q.questionFrontendId),
    title: q.title,
    slug: q.titleSlug,
    difficulty: nc150.difficulty,
    category: nc150.category,
    is_neetcode150: true,
    is_blind75: siteInfo?.is_blind75 ?? false,
    topics: q.topicTags?.map((t) => t.name) ?? [],
    description: q.content ? stripHtml(q.content) : `${nc150.title} (LeetCode Premium)`,
    examples: [],
    constraints: [],
    hints: q.hints ?? [],
    code_snippets: codeSnippets as UnifiedProblem["code_snippets"],
    neetcode_video_id: siteInfo?.video ?? "",
    neetcode_url: nc150.neetcode_url,
    leetcode_url: `https://leetcode.com/problems/${slug}/`,
  };
}

function cloneOrPull(url: string, dir: string): void {
  if (fs.existsSync(path.join(dir, ".git"))) {
    console.log(`  ↻ Already cloned: ${path.basename(dir)}`);
    return;
  }
  console.log(`  ⬇ Cloning: ${url}`);
  execSync(`git clone --depth 1 "${url}" "${dir}"`, {
    stdio: "pipe",
  });
}

// ── Main ───────────────────────────────────────────────────────────

function main(): void {
  console.log("\n=== DSA Problem Bank Merge Script ===\n");

  // 1. Ensure sources directory exists
  fs.mkdirSync(SOURCES_DIR, { recursive: true });

  // 2. Clone source repos
  console.log("Step 1: Cloning source repositories...");
  for (const repo of REPOS) {
    cloneOrPull(repo.url, repo.dir);
  }

  // 3. Load NeetCode-150 list (krmanik) for category mapping + neetcode URLs
  console.log("\nStep 2: Loading NeetCode-150 index...");
  const neetcode150ListPath = path.join(
    REPO_KRMANIK,
    "neetcode-150-list.json"
  );
  const neetcode150List: NeetCode150List = JSON.parse(
    fs.readFileSync(neetcode150ListPath, "utf-8")
  );

  // Build slug → { category, neetcode_url, title, difficulty } map
  const nc150Map = new Map<
    string,
    {
      category: string;
      neetcode_url: string;
      title: string;
      difficulty: string;
    }
  >();
  let totalFromList = 0;
  for (const [category, problems] of Object.entries(neetcode150List)) {
    for (const [title, entry] of Object.entries(problems)) {
      const slug = extractSlug(entry.url);
      if (slug) {
        nc150Map.set(slug, {
          category,
          neetcode_url: entry.nurl,
          title,
          difficulty: entry.difficulty,
        });
        totalFromList++;
      }
    }
  }
  console.log(`  Found ${totalFromList} problems in NeetCode-150 list`);
  console.log(
    `  Categories: ${new Set(Array.from(nc150Map.values()).map((v) => v.category)).size}`
  );

  // 4. Load .problemSiteData.json (neetcode-gh) for blind75 flags + video IDs
  console.log("\nStep 3: Loading NeetCode site data...");
  const siteDataPath = path.join(REPO_NEETCODE, ".problemSiteData.json");
  const siteData: ProblemSiteDataEntry[] = JSON.parse(
    fs.readFileSync(siteDataPath, "utf-8")
  );

  // Build slug → { is_blind75, video, code } map
  const siteDataMap = new Map<
    string,
    { is_blind75: boolean; video: string; code: string }
  >();
  for (const entry of siteData) {
    const slug = entry.link.replace(/\/$/, "");
    siteDataMap.set(slug, {
      is_blind75: entry.blind75 === true,
      video: entry.video,
      code: entry.code,
    });
  }
  console.log(`  Loaded ${siteData.length} problems from site data`);

  // 5. Build neenza problem file index (glob the directory)
  console.log("\nStep 4: Indexing neenza problem files...");
  const neenzaProblemsDir = path.join(REPO_NEENZA, "problems");
  const neenzaFiles = fs.readdirSync(neenzaProblemsDir).filter((f) => f.endsWith(".json"));

  // Build slug → filename map
  const neenzaMap = new Map<string, string>();
  for (const file of neenzaFiles) {
    // filename format: {nnnn}-{slug}.json
    const slug = file.replace(/^\d+-/, "").replace(/\.json$/, "");
    neenzaMap.set(slug, file);
  }
  console.log(`  Indexed ${neenzaMap.size} problem files`);

  // 6. Merge everything
  console.log("\nStep 5: Merging problems...");
  const problems: UnifiedProblem[] = [];
  const missingSiteData: string[] = [];
  const krmanikDataDir = path.join(REPO_KRMANIK, "data", "leetcode-json-data");
  let fallbackCount = 0;

  for (const [slug, nc150] of Array.from(nc150Map.entries())) {
    // Look up site data for blind75 flag + video ID
    const siteInfo = siteDataMap.get(slug);
    if (!siteInfo) {
      missingSiteData.push(slug);
    }

    // Try neenza first (best data quality)
    const neenzaFile = neenzaMap.get(slug);
    if (neenzaFile) {
      const neenzaPath = path.join(neenzaProblemsDir, neenzaFile);
      const neenza: NeenzaProblem = JSON.parse(
        fs.readFileSync(neenzaPath, "utf-8")
      );

      const codeSnippets: Record<string, string> = {};
      if (neenza.code_snippets) {
        if (neenza.code_snippets.javascript) {
          codeSnippets.javascript = neenza.code_snippets.javascript;
        }
        if (neenza.code_snippets.python3) {
          codeSnippets.python3 = neenza.code_snippets.python3;
        }
        if (neenza.code_snippets.typescript) {
          codeSnippets.typescript = neenza.code_snippets.typescript;
        }
      }

      problems.push({
        id: padId(neenza.frontend_id),
        title: neenza.title,
        slug: neenza.problem_slug,
        difficulty: nc150.difficulty,
        category: nc150.category,
        is_neetcode150: true,
        is_blind75: siteInfo?.is_blind75 ?? false,
        topics: neenza.topics ?? [],
        description: neenza.description ?? "",
        examples: neenza.examples ?? [],
        constraints: neenza.constraints ?? [],
        hints: neenza.hints ?? [],
        code_snippets: codeSnippets as UnifiedProblem["code_snippets"],
        neetcode_video_id: siteInfo?.video ?? "",
        neetcode_url: nc150.neetcode_url,
        leetcode_url: `https://leetcode.com/problems/${slug}/`,
      });
      continue;
    }

    // Fallback to krmanik data (for premium problems missing from neenza)
    const fallback = parseKrmanikProblem(slug, nc150, siteInfo, krmanikDataDir);
    if (fallback) {
      problems.push(fallback);
      fallbackCount++;
      console.log(`  ↪ Fallback to krmanik data: ${slug} (premium)`);
    } else {
      console.log(`  ✗ Could not find data for: ${slug}`);
    }
  }

  // Sort by id for consistent ordering
  problems.sort((a, b) => a.id.localeCompare(b.id));

  // 7. Output
  console.log("\nStep 6: Writing output...");
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(problems, null, 2), "utf-8");

  // 8. Summary
  const categories = new Set(problems.map((p) => p.category));
  const blind75Count = problems.filter((p) => p.is_blind75).length;
  const withJs = problems.filter((p) => p.code_snippets.javascript).length;
  const withPy = problems.filter((p) => p.code_snippets.python3).length;

  console.log("\n=== Merge Complete ===");
  console.log(`  Total problems: ${problems.length}`);
  console.log(`  From neenza: ${problems.length - fallbackCount}`);
  console.log(`  From krmanik fallback: ${fallbackCount}`);
  console.log(`  Categories: ${categories.size} (${Array.from(categories).join(", ")})`);
  console.log(`  Blind75: ${blind75Count}`);
  console.log(`  With JavaScript snippets: ${withJs}`);
  console.log(`  With Python3 snippets: ${withPy}`);
  console.log(`  Output: ${OUTPUT_FILE}`);

  if (missingSiteData.length > 0) {
    console.log(
      `\n  ⚠ Missing from site data (${missingSiteData.length}): ${missingSiteData.join(", ")}`
    );
  }

  if (problems.length < 150) {
    console.log(
      `\n  ⚠ Only ${problems.length}/150 problems merged. Check warnings above.`
    );
  }
}

main();
