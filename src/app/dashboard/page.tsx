import { createClient } from "@/lib/supabase/server";
import { getAllProblems } from "@/lib/problems";
import { generateDailyPlan } from "@/lib/daily-plan";
import TodaysPlan from "@/components/dashboard/TodaysPlan";
import type { PlanItem } from "@/types";

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

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];

  // Check for existing daily plan
  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_date", today)
    .single();

  let planItems: PlanItem[];

  if (existingPlan) {
    planItems = existingPlan.plan_data as PlanItem[];
  } else {
    // Generate new plan and persist it
    planItems = await generateDailyPlan(user.id, supabase);

    await supabase.from("daily_plans").insert({
      user_id: user.id,
      plan_date: today,
      plan_data: planItems,
    });
  }

  // Load problem titles for display
  const problems = await getAllProblems();
  const problemMap = new Map(problems.map((p) => [p.slug, p]));

  const planItemsWithTitles = planItems.map((item) => {
    const problem = problemMap.get(item.problem_id);
    return {
      ...item,
      title: problem?.title ?? item.problem_id,
    };
  });

  // Calculate day number (days since profile creation)
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, current_pattern_index")
    .eq("id", user.id)
    .single();

  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const now = new Date();
  const dayNumber = Math.max(
    1,
    Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const currentPatternIndex = profile?.current_pattern_index ?? 0;
  const currentPattern = CATEGORY_ORDER[currentPatternIndex] ?? CATEGORY_ORDER[0];

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <TodaysPlan
        planItems={planItemsWithTitles}
        dayNumber={dayNumber}
        dateLabel={dateLabel}
        currentPattern={currentPattern}
        planDate={today}
      />
    </div>
  );
}
