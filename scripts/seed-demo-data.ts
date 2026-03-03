/**
 * Seed demo usage data for a specific user.
 * Usage: npx tsx scripts/seed-demo-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  console.error("Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-demo-data.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TARGET_EMAIL = "dmrinal626@gmail.com";

// Problems to seed with realistic data
const problems = [
  { slug: "two-sum", topics: ["Array", "Hash Table"], difficulty: "Easy" },
  { slug: "valid-parentheses", topics: ["String", "Stack"], difficulty: "Easy" },
  { slug: "merge-two-sorted-lists", topics: ["Linked List", "Recursion"], difficulty: "Easy" },
  { slug: "best-time-to-buy-and-sell-stock", topics: ["Array", "Dynamic Programming"], difficulty: "Easy" },
  { slug: "valid-palindrome", topics: ["Two Pointers", "String"], difficulty: "Easy" },
  { slug: "climbing-stairs", topics: ["Dynamic Programming", "Math"], difficulty: "Easy" },
  { slug: "same-tree", topics: ["Tree", "DFS"], difficulty: "Easy" },
  { slug: "maximum-depth-of-binary-tree", topics: ["Tree", "DFS", "BFS"], difficulty: "Easy" },
  { slug: "balanced-binary-tree", topics: ["Tree", "DFS"], difficulty: "Easy" },
  { slug: "plus-one", topics: ["Array", "Math"], difficulty: "Easy" },
  { slug: "container-with-most-water", topics: ["Array", "Two Pointers"], difficulty: "Medium" },
  { slug: "3sum", topics: ["Array", "Two Pointers", "Sorting"], difficulty: "Medium" },
  { slug: "group-anagrams", topics: ["Array", "Hash Table", "String"], difficulty: "Medium" },
  { slug: "longest-substring-without-repeating-characters", topics: ["Hash Table", "String", "Sliding Window"], difficulty: "Medium" },
  { slug: "longest-consecutive-sequence", topics: ["Array", "Hash Table", "Union Find"], difficulty: "Medium" },
  { slug: "add-two-numbers", topics: ["Linked List", "Math"], difficulty: "Medium" },
  { slug: "longest-palindromic-substring", topics: ["String", "Dynamic Programming"], difficulty: "Medium" },
  { slug: "search-in-rotated-sorted-array", topics: ["Array", "Binary Search"], difficulty: "Medium" },
  { slug: "combination-sum", topics: ["Array", "Backtracking"], difficulty: "Medium" },
  { slug: "permutations", topics: ["Array", "Backtracking"], difficulty: "Medium" },
  { slug: "rotate-image", topics: ["Array", "Math", "Matrix"], difficulty: "Medium" },
  { slug: "merge-intervals", topics: ["Array", "Sorting"], difficulty: "Medium" },
  { slug: "unique-paths", topics: ["Math", "Dynamic Programming"], difficulty: "Medium" },
  { slug: "decode-ways", topics: ["String", "Dynamic Programming"], difficulty: "Medium" },
  { slug: "validate-binary-search-tree", topics: ["Tree", "DFS", "BST"], difficulty: "Medium" },
  { slug: "binary-tree-level-order-traversal", topics: ["Tree", "BFS"], difficulty: "Medium" },
  { slug: "subsets", topics: ["Array", "Backtracking"], difficulty: "Medium" },
  { slug: "word-search", topics: ["Array", "Backtracking", "Matrix"], difficulty: "Medium" },
  { slug: "maximum-subarray", topics: ["Array", "Dynamic Programming"], difficulty: "Medium" },
  { slug: "jump-game", topics: ["Array", "Greedy"], difficulty: "Medium" },
  { slug: "edit-distance", topics: ["String", "Dynamic Programming"], difficulty: "Medium" },
  { slug: "surrounded-regions", topics: ["Array", "DFS", "BFS", "Matrix"], difficulty: "Medium" },
  { slug: "trapping-rain-water", topics: ["Array", "Two Pointers", "Stack"], difficulty: "Hard" },
  { slug: "merge-k-sorted-lists", topics: ["Linked List", "Heap"], difficulty: "Hard" },
  { slug: "minimum-window-substring", topics: ["Hash Table", "String", "Sliding Window"], difficulty: "Hard" },
  { slug: "largest-rectangle-in-histogram", topics: ["Array", "Stack"], difficulty: "Hard" },
  { slug: "n-queens", topics: ["Array", "Backtracking"], difficulty: "Hard" },
  { slug: "median-of-two-sorted-arrays", topics: ["Array", "Binary Search"], difficulty: "Hard" },
  { slug: "word-ladder", topics: ["Hash Table", "String", "BFS"], difficulty: "Hard" },
  { slug: "binary-tree-maximum-path-sum", topics: ["Tree", "DFS"], difficulty: "Hard" },
];

const approaches: Record<string, string> = {
  "two-sum": "Used a hash map to store complements. One-pass approach — for each num, check if target-num exists in the map.",
  "valid-parentheses": "Stack-based approach. Push opening brackets, pop and match for closing brackets. Return true if stack is empty at end.",
  "3sum": "Sort array first, then use two-pointer technique for each element. Skip duplicates to avoid repeated triplets.",
  "container-with-most-water": "Two pointers from both ends. Move the pointer with smaller height inward since that's the only way to potentially increase area.",
  "longest-substring-without-repeating-characters": "Sliding window with a set. Expand right pointer, shrink left when duplicate found. Track max length.",
  "merge-intervals": "Sort intervals by start time, then iterate and merge overlapping intervals by comparing current end with next start.",
  "climbing-stairs": "Classic DP — dp[i] = dp[i-1] + dp[i-2]. Really just Fibonacci sequence. O(n) time, O(1) space with two variables.",
  "trapping-rain-water": "Two pointer approach. Track leftMax and rightMax. Water at each position = min(leftMax, rightMax) - height[i].",
  "group-anagrams": "Sort each string as key, group by sorted key in a hash map. O(n * k log k) where k is max string length.",
  "binary-tree-level-order-traversal": "BFS with a queue. Process level by level, tracking queue size at each level to separate levels.",
  "validate-binary-search-tree": "Recursive DFS with min/max bounds. Each node must be within (min, max) range. Update bounds as we go down.",
  "combination-sum": "Backtracking with start index to avoid duplicates. At each step, either include current number again or move to next.",
  "merge-k-sorted-lists": "Min-heap approach. Push first node from each list, pop smallest, push its next. O(N log k) time.",
  "minimum-window-substring": "Sliding window with character frequency maps. Expand right to satisfy, shrink left to minimize. Track global minimum.",
  "word-search": "DFS backtracking on the grid. Mark visited cells, explore 4 directions. Restore cell on backtrack.",
  "maximum-subarray": "Kadane's algorithm. Keep running sum, reset to current element if sum goes negative. Track global max.",
  "search-in-rotated-sorted-array": "Modified binary search. Determine which half is sorted, then check if target lies in that half.",
  "unique-paths": "DP on a grid. dp[i][j] = dp[i-1][j] + dp[i][j-1]. Base case: first row and column are all 1s.",
  "decode-ways": "1D DP. dp[i] depends on single digit (dp[i-1]) and two digit (dp[i-2]) if valid. Handle edge cases for '0'.",
  "subsets": "Backtracking — at each index, choose to include or exclude the element. Build all 2^n combinations.",
};

const remarks: Record<string, string> = {
  "two-sum": "Classic problem. Good warm-up. The brute force O(n²) is intuitive but hash map is much cleaner.",
  "3sum": "Tricky to handle duplicates. Sorting makes it manageable. Need to practice the two-pointer variant more.",
  "trapping-rain-water": "Hard to get right on first try. The two-pointer solution is elegant but not intuitive. Drew it out on paper first.",
  "container-with-most-water": "Greedy insight: always move the shorter line. Took a few attempts to convince myself why this works.",
  "merge-k-sorted-lists": "Heap solution is clean. Tried divide-and-conquer too — same complexity but heap felt more natural.",
  "minimum-window-substring": "Hardest sliding window problem. The 'satisfied' counter trick is key. Took 45 minutes.",
  "validate-binary-search-tree": "Easy to make the mistake of only checking immediate children. Need global min/max bounds.",
  "edit-distance": "Classic 2D DP. The state transition for insert/delete/replace maps nicely to the grid.",
  "combination-sum": "Backtracking template. The key insight is allowing reuse of the same element by not incrementing the index.",
  "word-search": "Standard grid DFS. Easy to forget to restore visited cells on backtrack.",
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function nextRevision(score: number, fromDate: Date): Date {
  const d = new Date(fromDate);
  if (score <= 2) d.setDate(d.getDate() + 1);
  else if (score === 3) d.setDate(d.getDate() + 4);
  else d.setDate(d.getDate() + 14);
  return d;
}

function randomScore(difficulty: string): number {
  if (difficulty === "Easy") {
    return [3, 4, 4, 5, 5][Math.floor(Math.random() * 5)];
  } else if (difficulty === "Medium") {
    return [2, 3, 3, 4, 4][Math.floor(Math.random() * 5)];
  } else {
    return [1, 2, 2, 3, 3][Math.floor(Math.random() * 5)];
  }
}

function randomTime(difficulty: string): number {
  if (difficulty === "Easy") return Math.floor(Math.random() * 15) + 5;
  if (difficulty === "Medium") return Math.floor(Math.random() * 25) + 15;
  return Math.floor(Math.random() * 30) + 25;
}

const timeComplexities = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2^n)"];
const spaceComplexities = ["O(1)", "O(n)", "O(n²)", "O(log n)"];

function pickComplexity(difficulty: string, isTime: boolean): string {
  if (isTime) {
    if (difficulty === "Easy") return ["O(n)", "O(n)", "O(n log n)"][Math.floor(Math.random() * 3)];
    if (difficulty === "Medium") return ["O(n)", "O(n log n)", "O(n²)"][Math.floor(Math.random() * 3)];
    return ["O(n log n)", "O(n²)", "O(2^n)", "O(n)"][Math.floor(Math.random() * 4)];
  }
  if (difficulty === "Easy") return ["O(1)", "O(n)"][Math.floor(Math.random() * 2)];
  return ["O(n)", "O(n)", "O(n²)"][Math.floor(Math.random() * 3)];
}

async function main() {
  // Find user by email via auth admin API
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error("Could not list users:", usersErr);
    process.exit(1);
  }

  const targetUser = usersData.users.find((u) => u.email === TARGET_EMAIL);
  if (!targetUser) {
    console.error("Could not find user with email", TARGET_EMAIL);
    process.exit(1);
  }

  const userId = targetUser.id;
  console.log(`Found user: ${userId}`);

  // Build submissions spread over the last 30 days
  // Create a realistic pattern: heavy recent activity, 7-day streak
  const submissions: Record<string, unknown>[] = [];

  // Days with activity (ensure a 7-day streak ending today)
  const activeDays = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28];

  let problemIdx = 0;

  for (const day of activeDays) {
    // 1-3 problems per day, more on recent days
    const count = day <= 3 ? 3 : day <= 7 ? 2 : 1;

    for (let i = 0; i < count && problemIdx < problems.length; i++) {
      const p = problems[problemIdx];
      const createdAt = daysAgo(day);
      const score = randomScore(p.difficulty);
      const revDate = nextRevision(score, createdAt);

      const row: Record<string, unknown> = {
        user_id: userId,
        problem_id: p.slug,
        is_self_reported: Math.random() > 0.6,
        topics: p.topics,
        performance_score: score,
        time_taken_mins: randomTime(p.difficulty),
        time_complexity: pickComplexity(p.difficulty, true),
        space_complexity: pickComplexity(p.difficulty, false),
        next_revision_date: revDate.toISOString(),
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString(),
      };

      if (approaches[p.slug]) row.approach = approaches[p.slug];
      if (remarks[p.slug]) row.remarks = remarks[p.slug];

      submissions.push(row);
      problemIdx++;
    }
  }

  console.log(`Inserting ${submissions.length} submissions...`);

  // Insert in batches
  const batchSize = 20;
  for (let i = 0; i < submissions.length; i += batchSize) {
    const batch = submissions.slice(i, i + batchSize);
    const { error } = await supabase.from("user_progress").insert(batch);
    if (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error.message);
    } else {
      console.log(`Batch ${i / batchSize + 1} inserted (${batch.length} rows)`);
    }
  }

  console.log("Done! Seeded demo data.");
}

main();
