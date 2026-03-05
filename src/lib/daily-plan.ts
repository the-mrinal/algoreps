import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanItem, UserProfile } from "@/types";

/**
 * Canonical NeetCode roadmap category order (index = current_pattern_index).
 */
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

/** Estimated minutes per difficulty level */
const ESTIMATED_MINUTES: Record<string, number> = {
  Easy: 15,
  Medium: 25,
  Hard: 40,
};

/** Target difficulty distribution by proficiency level (Easy / Medium / Hard ratios) */
const DIFFICULTY_DISTRIBUTION: Record<string, { Easy: number; Medium: number; Hard: number }> = {
  beginner: { Easy: 0.5, Medium: 0.4, Hard: 0.1 },
  rusty: { Easy: 0.4, Medium: 0.45, Hard: 0.15 },
  intermediate: { Easy: 0.2, Medium: 0.6, Hard: 0.2 },
  advanced: { Easy: 0.1, Medium: 0.4, Hard: 0.5 },
};

/**
 * Generate a personalized daily plan mixing revision + new problems.
 *
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client (server or admin)
 * @returns Array of PlanItem for today
 */
export async function generateDailyPlan(
  userId: string,
  supabase: SupabaseClient,
): Promise<PlanItem[]> {
  // 1. Load user profile preferences
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("questions_per_day, proficiency_level, problem_set, current_pattern_index")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error(`Failed to load profile: ${profileError?.message ?? "not found"}`);
  }

  const {
    questions_per_day: questionsPerDay,
    proficiency_level: proficiencyLevel,
    problem_set: problemSet,
    current_pattern_index: currentPatternIndex,
  } = profile as Pick<UserProfile, "questions_per_day" | "proficiency_level" | "problem_set" | "current_pattern_index">;

  const revisionQuota = Math.floor(questionsPerDay * 0.7);
  const newQuota = Math.max(Math.ceil(questionsPerDay * 0.3), questionsPerDay - revisionQuota);

  // 2. Get revision items: problems due for review (next_revision_date <= now)
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const { data: revisionRows } = await supabase
    .from("user_progress")
    .select("problem_id, performance_score")
    .eq("user_id", userId)
    .lte("next_revision_date", today)
    .order("performance_score", { ascending: true })
    .limit(revisionQuota);

  // We need problem metadata for revision items
  const revisionProblemIds = (revisionRows || []).map((r: { problem_id: string }) => r.problem_id);
  const revisionScoreMap = new Map(
    (revisionRows || []).map((r: { problem_id: string; performance_score: number }) => [r.problem_id, r.performance_score]),
  );

  let revisionProblems: Array<{ slug: string; difficulty: string; category: string }> = [];
  if (revisionProblemIds.length > 0) {
    const { data: revProbData } = await supabase
      .from("problems")
      .select("slug, difficulty, category")
      .in("slug", revisionProblemIds);
    revisionProblems = revProbData || [];
  }

  const revisionItems: PlanItem[] = revisionProblems.map((p) => ({
    problem_id: p.slug,
    type: "revision" as const,
    status: "pending" as const,
    difficulty: p.difficulty,
    category: p.category,
    estimated_minutes: ESTIMATED_MINUTES[p.difficulty] ?? 25,
  }));

  // Sort by score (hardest first) using the score map
  revisionItems.sort(
    (a, b) => (revisionScoreMap.get(a.problem_id) ?? 5) - (revisionScoreMap.get(b.problem_id) ?? 5),
  );

  // 3. Get all solved problem IDs for this user (to exclude from new items)
  const { data: solvedRows } = await supabase
    .from("user_progress")
    .select("problem_id")
    .eq("user_id", userId);
  const solvedSet = new Set((solvedRows || []).map((r: { problem_id: string }) => r.problem_id));

  // Also exclude problems already in revision items
  const planSet = new Set(revisionItems.map((r) => r.problem_id));

  // 4. Build sheet filter based on problem_set preference
  const sheetFilter =
    problemSet === "blind-75"
      ? ["blind-75"]
      : problemSet === "both"
        ? ["neetcode-150", "blind-75"]
        : ["neetcode-150"];

  // 5. Get candidate new problems ordered by pattern_order
  const { data: candidateRows } = await supabase
    .from("problems")
    .select("slug, difficulty, category, pattern_order, sheets")
    .not("pattern_order", "is", null)
    .order("pattern_order", { ascending: true });

  // Filter candidates: must be in the right sheet, not solved, not already in plan
  const allCandidates = (candidateRows || []).filter((p: { slug: string; sheets: string[] }) => {
    if (solvedSet.has(p.slug) || planSet.has(p.slug)) return false;
    if (!p.sheets) return false;
    return sheetFilter.some((s) => p.sheets.includes(s));
  });

  // 6. Select new problems based on difficulty distribution and pattern progression
  const dist = DIFFICULTY_DISTRIBUTION[proficiencyLevel] ?? DIFFICULTY_DISTRIBUTION.rusty;
  // Determine target counts per difficulty
  const targetEasy = Math.round(newQuota * dist.Easy);
  const targetHard = Math.round(newQuota * dist.Hard);
  const targetMedium = newQuota - targetEasy - targetHard;
  const targets: Record<string, number> = { Easy: targetEasy, Medium: targetMedium, Hard: targetHard };

  // Build categorized candidate pools starting from current pattern
  // Priority: current pattern first, then subsequent patterns
  const orderedCandidates = sortCandidatesByPatternPriority(
    allCandidates as Array<{ slug: string; difficulty: string; category: string; pattern_order: number }>,
    currentPatternIndex,
  );

  const newItems: PlanItem[] = [];
  const remaining: Record<string, number> = { ...targets };

  // First pass: fill by target difficulty distribution
  for (const difficulty of ["Easy", "Medium", "Hard"] as const) {
    if (remaining[difficulty] <= 0) continue;
    for (const p of orderedCandidates) {
      if (remaining[difficulty] <= 0) break;
      if (p.difficulty !== difficulty) continue;
      if (planSet.has(p.slug)) continue;
      newItems.push({
        problem_id: p.slug,
        type: "new",
        status: "pending",
        difficulty: p.difficulty,
        category: p.category,
        estimated_minutes: ESTIMATED_MINUTES[p.difficulty] ?? 25,
      });
      planSet.add(p.slug);
      remaining[difficulty]--;
    }
  }

  // Second pass: if we didn't fill quota due to missing difficulties, fill with any available
  let totalNew = newItems.length;
  if (totalNew < newQuota) {
    for (const p of orderedCandidates) {
      if (totalNew >= newQuota) break;
      if (planSet.has(p.slug)) continue;
      newItems.push({
        problem_id: p.slug,
        type: "new",
        status: "pending",
        difficulty: p.difficulty,
        category: p.category,
        estimated_minutes: ESTIMATED_MINUTES[p.difficulty] ?? 25,
      });
      planSet.add(p.slug);
      totalNew++;
    }
  }

  // 7. Weak pattern boost: if a pattern has avg confidence < 3, insert 1 extra problem
  const { data: confidenceRows } = await supabase
    .from("user_pattern_confidence")
    .select("pattern_name, confidence_rating, diagnostic_score")
    .eq("user_id", userId);

  if (confidenceRows && confidenceRows.length > 0) {
    // Find weak patterns (avg of confidence_rating and diagnostic_score if available < 3)
    for (const conf of confidenceRows as Array<{ pattern_name: string; confidence_rating: number; diagnostic_score: number | null }>) {
      const avgScore = conf.diagnostic_score != null
        ? (conf.confidence_rating + conf.diagnostic_score) / 2
        : conf.confidence_rating;

      if (avgScore < 3) {
        // Find one unsolved problem from this weak pattern
        const boostCandidate = orderedCandidates.find(
          (p) => p.category === conf.pattern_name && !planSet.has(p.slug),
        );
        if (boostCandidate) {
          newItems.push({
            problem_id: boostCandidate.slug,
            type: "new",
            status: "pending",
            difficulty: boostCandidate.difficulty,
            category: boostCandidate.category,
            estimated_minutes: ESTIMATED_MINUTES[boostCandidate.difficulty] ?? 25,
          });
          planSet.add(boostCandidate.slug);
        }
      }
    }
  }

  return [...revisionItems, ...newItems];
}

/**
 * Sort candidates by pattern priority: current pattern first, then subsequent patterns
 * wrapping around. Within each pattern, Easy → Medium → Hard.
 */
function sortCandidatesByPatternPriority(
  candidates: Array<{ slug: string; difficulty: string; category: string; pattern_order: number }>,
  currentPatternIndex: number,
): Array<{ slug: string; difficulty: string; category: string; pattern_order: number }> {
  const difficultyOrder: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

  // Build priority: categories starting from current index, wrapping around
  const categoryPriority = new Map<string, number>();
  for (let i = 0; i < CATEGORY_ORDER.length; i++) {
    const idx = (currentPatternIndex + i) % CATEGORY_ORDER.length;
    categoryPriority.set(CATEGORY_ORDER[idx], i);
  }

  return [...candidates].sort((a, b) => {
    const catA = categoryPriority.get(a.category) ?? 99;
    const catB = categoryPriority.get(b.category) ?? 99;
    if (catA !== catB) return catA - catB;
    // Within same category: Easy → Medium → Hard
    const diffA = difficultyOrder[a.difficulty] ?? 1;
    const diffB = difficultyOrder[b.difficulty] ?? 1;
    if (diffA !== diffB) return diffA - diffB;
    // Within same difficulty: by pattern_order
    return a.pattern_order - b.pattern_order;
  });
}
