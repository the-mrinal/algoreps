import { createClient } from "@/lib/supabase/server";
import { getAllProblems, getCategories } from "@/lib/problems";
import StatsOverview from "@/components/progress/StatsOverview";
import type { StatsData } from "@/components/progress/StatsOverview";
import TopicChart from "@/components/progress/TopicChart";
import type { TopicData } from "@/components/progress/TopicChart";
import HistoryTable from "@/components/progress/HistoryTable";
import type { HistoryRow } from "@/components/progress/HistoryTable";

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function calculateStreak(
  submissions: { created_at: string }[]
): number {
  if (submissions.length === 0) return 0;

  const uniqueDates = new Set(
    submissions.map((s) => formatDateStr(new Date(s.created_at)))
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const checkDate = new Date(today);

  // If no submission today, start checking from yesterday
  if (!uniqueDates.has(formatDateStr(checkDate))) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (uniqueDates.has(formatDateStr(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch all submissions (full fields for history table + stats calculation)
  const { data: submissions } = await supabase
    .from("user_progress")
    .select(
      "id, problem_id, performance_score, created_at, next_revision_date, time_taken_mins, time_complexity, space_complexity, is_self_reported, approach, remarks, ai_review"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allSubmissions = submissions ?? [];

  // Basic stats
  const totalUniqueProblems = new Set(
    allSubmissions.map((s) => s.problem_id)
  ).size;
  const totalSubmissions = allSubmissions.length;
  const averageScore =
    totalSubmissions > 0
      ? Math.round(
          (allSubmissions.reduce((sum, s) => sum + s.performance_score, 0) /
            totalSubmissions) *
            10
        ) / 10
      : 0;

  // Streak
  const currentStreak = calculateStreak(allSubmissions);

  // Due today and this week
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(now);
  const dayOfWeek = endOfWeek.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);

  const { data: dueThisWeek } = await supabase
    .from("user_progress")
    .select("next_revision_date")
    .eq("user_id", user.id)
    .not("next_revision_date", "is", null)
    .lte("next_revision_date", endOfWeek.toISOString());

  const revisions = dueThisWeek ?? [];

  const problemsDueToday = revisions.filter((r) => {
    const revDate = new Date(r.next_revision_date);
    return revDate <= endOfToday;
  }).length;

  const problemsDueThisWeek = revisions.length;

  const stats: StatsData = {
    totalUniqueProblems,
    currentStreak,
    totalSubmissions,
    averageScore,
    problemsDueToday,
    problemsDueThisWeek,
  };

  // Topic mastery: compute avg score per NeetCode category
  const problems = getAllProblems();
  const slugToCategory = new Map(problems.map((p) => [p.slug, p.category]));

  const categoryAgg = new Map<string, { total: number; count: number }>();
  for (const s of allSubmissions) {
    const category = slugToCategory.get(s.problem_id);
    if (!category) continue;
    const agg = categoryAgg.get(category);
    if (agg) {
      agg.total += s.performance_score;
      agg.count += 1;
    } else {
      categoryAgg.set(category, { total: s.performance_score, count: 1 });
    }
  }

  const topicData: TopicData[] = Array.from(categoryAgg.entries()).map(
    ([category, agg]) => ({
      category,
      avgScore: Math.round((agg.total / agg.count) * 10) / 10,
      attempts: agg.count,
    })
  );

  // Build enriched history rows for HistoryTable
  const slugToProb = new Map(problems.map((p) => [p.slug, p]));

  const historyRows: HistoryRow[] = allSubmissions.map((s) => {
    const prob = slugToProb.get(s.problem_id);
    return {
      id: s.id,
      problem_id: s.problem_id,
      created_at: s.created_at,
      performance_score: s.performance_score,
      time_taken_mins: s.time_taken_mins,
      time_complexity: s.time_complexity,
      space_complexity: s.space_complexity,
      is_self_reported: s.is_self_reported,
      approach: s.approach ?? null,
      remarks: s.remarks ?? null,
      ai_review: s.ai_review as HistoryRow["ai_review"],
      problemTitle: prob?.title ?? s.problem_id,
      difficulty: prob?.difficulty ?? "Medium",
      category: prob?.category ?? "Unknown",
    };
  });

  const allCategories = getCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Progress
      </h1>
      <StatsOverview stats={stats} />
      <TopicChart data={topicData} />
      <HistoryTable rows={historyRows} categories={allCategories} />
    </div>
  );
}
