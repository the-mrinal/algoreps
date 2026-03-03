import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDiscordEmbed } from "@/lib/discord";
import { getAllProblems } from "@/lib/problems";

const COLOR_PURPLE = 0x9b59b6;

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateStreak(allDates: string[]): number {
  if (allDates.length === 0) return 0;

  const uniqueDays = new Set(
    allDates.map((d) => new Date(d).toISOString().split("T")[0])
  );
  const sortedDays = Array.from(uniqueDays).sort().reverse();

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let streak = 0;
  let checkDate: Date;

  if (sortedDays[0] === today) {
    checkDate = new Date(today);
  } else if (sortedDays[0] === yesterday) {
    checkDate = new Date(yesterday);
  } else {
    return 0;
  }

  for (let i = 0; i < 365; i++) {
    const dayStr = checkDate.toISOString().split("T")[0];
    if (uniqueDays.has(dayStr)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return streak;
}

export async function POST() {
  // Authenticate the user
  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const userId = user.id;

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", userId)
    .single();

  const userName = profile?.display_name || profile?.email || "User";

  // Fetch all problems for title/category mapping
  const problems = await getAllProblems(supabase);
  const slugToTitle = new Map(problems.map((p) => [p.slug, p.title]));
  const slugToCategory = new Map(problems.map((p) => [p.slug, p.category]));

  // 1. Due revisions (the plan)
  const { data: dueRevisions } = await supabase
    .from("user_progress")
    .select("problem_id, performance_score")
    .eq("user_id", userId)
    .not("next_revision_date", "is", null)
    .lte("next_revision_date", new Date().toISOString());

  // 2. Today's submissions (what's done)
  const todayStart = getStartOfDay(new Date()).toISOString();
  const { data: todaySubmissions } = await supabase
    .from("user_progress")
    .select("problem_id, performance_score, is_self_reported, created_at")
    .eq("user_id", userId)
    .gte("created_at", todayStart);

  // 3. Streak calculation
  const { data: allSubmissions } = await supabase
    .from("user_progress")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const streak = calculateStreak(
    (allSubmissions || []).map((s) => s.created_at)
  );

  // 4. Weekly stats
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: weekSubmissions } = await supabase
    .from("user_progress")
    .select("problem_id, performance_score")
    .eq("user_id", userId)
    .gte("created_at", weekAgo);

  // Build embed fields
  const fields: { name: string; value: string }[] = [];

  // Done today
  const doneToday = todaySubmissions || [];
  const practiceCount = doneToday.filter((s) => !s.is_self_reported).length;
  const trustCount = doneToday.filter((s) => s.is_self_reported).length;

  fields.push({
    name: "✅ Completed Today",
    value:
      doneToday.length === 0
        ? "No problems solved yet"
        : `${doneToday.length} problem${doneToday.length === 1 ? "" : "s"} (Practice: ${practiceCount} | Log: ${trustCount})`,
  });

  // Remaining due
  const doneSlugSet = new Set(doneToday.map((s) => s.problem_id));
  const remaining = (dueRevisions || []).filter(
    (r) => !doneSlugSet.has(r.problem_id)
  );

  if (remaining.length > 0) {
    const hard = remaining
      .filter((r) => r.performance_score <= 2)
      .map((r) => slugToTitle.get(r.problem_id) || r.problem_id);
    const medium = remaining
      .filter((r) => r.performance_score === 3)
      .map((r) => slugToTitle.get(r.problem_id) || r.problem_id);
    const easy = remaining
      .filter((r) => r.performance_score >= 4)
      .map((r) => slugToTitle.get(r.problem_id) || r.problem_id);

    const parts: string[] = [];
    if (hard.length > 0)
      parts.push(`🔴 **Hard (${hard.length})**\n${hard.map((t) => `• ${t}`).join("\n")}`);
    if (medium.length > 0)
      parts.push(`🟡 **Medium (${medium.length})**\n${medium.map((t) => `• ${t}`).join("\n")}`);
    if (easy.length > 0)
      parts.push(`🟢 **Easy (${easy.length})**\n${easy.map((t) => `• ${t}`).join("\n")}`);

    fields.push({
      name: `📋 Remaining (${remaining.length})`,
      value: parts.join("\n\n"),
    });
  } else {
    fields.push({
      name: "📋 Remaining",
      value: "All caught up! No pending revisions.",
    });
  }

  // Streak
  fields.push({
    name: "🔥 Current Streak",
    value: `${streak} day${streak === 1 ? "" : "s"}`,
  });

  // Weekly progress
  const weeklyCount = (weekSubmissions || []).length;
  fields.push({
    name: "📅 Weekly Progress",
    value: `${weeklyCount} submission${weeklyCount === 1 ? "" : "s"} in the last 7 days`,
  });

  // Focus area
  const categoryScores = new Map<
    string,
    { total: number; count: number }
  >();
  for (const sub of weekSubmissions || []) {
    const category = slugToCategory.get(sub.problem_id);
    if (category) {
      const existing = categoryScores.get(category) || {
        total: 0,
        count: 0,
      };
      existing.total += sub.performance_score;
      existing.count++;
      categoryScores.set(category, existing);
    }
  }

  if (categoryScores.size > 0) {
    let lowestAvg = Infinity;
    let weakestCategory = "";
    let weakestCount = 0;

    for (const [category, data] of Array.from(categoryScores.entries())) {
      const avg = data.total / data.count;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        weakestCategory = category;
        weakestCount = data.count;
      }
    }

    fields.push({
      name: "💡 Focus Area",
      value: `${weakestCategory} (avg ${lowestAvg.toFixed(1)}/5, ${weakestCount} attempt${weakestCount === 1 ? "" : "s"} this week)`,
    });
  }

  await sendDiscordEmbed(
    `📊 Status Update for ${userName}`,
    fields,
    COLOR_PURPLE
  );

  return NextResponse.json({ message: "Discord notification sent" });
}
