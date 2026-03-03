import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDiscordEmbed } from "@/lib/discord";
import { getAllProblems } from "@/lib/problems";

// Discord embed colors
const COLOR_BLUE = 0x5865f2;

interface Submission {
  user_id: string;
  problem_id: string;
  performance_score: number;
  is_self_reported: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
}

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

  // Start counting from today or yesterday
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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const todayStart = getStartOfDay(new Date()).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Fetch today's submissions across all users
  const { data: todaySubmissions, error: todayError } = await supabase
    .from("user_progress")
    .select("user_id, problem_id, performance_score, is_self_reported, created_at")
    .gte("created_at", todayStart);

  if (todayError) {
    return NextResponse.json({ error: todayError.message }, { status: 500 });
  }

  if (!todaySubmissions || todaySubmissions.length === 0) {
    return NextResponse.json({
      message: "No activity today — no notifications sent",
      notifications_sent: 0,
    });
  }

  // Fetch this week's submissions for streak & weekly stats
  const { data: weekSubmissions } = await supabase
    .from("user_progress")
    .select("user_id, problem_id, performance_score, created_at")
    .gte("created_at", weekAgo);

  // Fetch all submissions for streak calculation (up to last year)
  const activeUserIds = Array.from(
    new Set((todaySubmissions as Submission[]).map((s) => s.user_id))
  );

  const { data: allSubmissions } = await supabase
    .from("user_progress")
    .select("user_id, created_at")
    .in("user_id", activeUserIds)
    .order("created_at", { ascending: false });

  // Build slug → category map
  const problems = await getAllProblems(supabase);
  const slugToCategory = new Map(problems.map((p) => [p.slug, p.category]));

  // Group today's submissions by user
  const todayByUser = new Map<string, Submission[]>();
  for (const sub of todaySubmissions as Submission[]) {
    const list = todayByUser.get(sub.user_id) || [];
    list.push(sub);
    todayByUser.set(sub.user_id, list);
  }

  // Group week's submissions by user
  const weekByUser = new Map<string, Submission[]>();
  for (const sub of (weekSubmissions || []) as Submission[]) {
    const list = weekByUser.get(sub.user_id) || [];
    list.push(sub);
    weekByUser.set(sub.user_id, list);
  }

  // Group all submissions by user for streak
  const allByUser = new Map<string, string[]>();
  for (const sub of (allSubmissions || []) as { user_id: string; created_at: string }[]) {
    const list = allByUser.get(sub.user_id) || [];
    list.push(sub.created_at);
    allByUser.set(sub.user_id, list);
  }

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in("id", activeUserIds);

  const profileMap = new Map<string, UserProfile>(
    (profiles || []).map((p: UserProfile) => [p.id, p])
  );

  // Send one embed per active user
  let notificationsSent = 0;

  for (const [userId, todaySubs] of Array.from(todayByUser.entries())) {
    const profile = profileMap.get(userId);
    const userName = profile?.display_name || profile?.email || "User";

    // Problems solved today
    const solvedToday = todaySubs.length;

    // Track split
    const practiceCount = todaySubs.filter((s) => !s.is_self_reported).length;
    const trustCount = todaySubs.filter((s) => s.is_self_reported).length;

    // Current streak
    const userAllDates = allByUser.get(userId) || [];
    const streak = calculateStreak(userAllDates);

    // Weekly progress
    const weekSubs = weekByUser.get(userId) || [];
    const weeklyCount = weekSubs.length;

    // Topic insight: category with lowest average score this week
    const categoryScores = new Map<string, { total: number; count: number }>();
    for (const sub of weekSubs) {
      const category = slugToCategory.get(sub.problem_id);
      if (category) {
        const existing = categoryScores.get(category) || { total: 0, count: 0 };
        existing.total += sub.performance_score;
        existing.count++;
        categoryScores.set(category, existing);
      }
    }

    let topicInsight = "";
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

      topicInsight = `${weakestCategory} (avg ${lowestAvg.toFixed(1)}/5, ${weakestCount} attempt${weakestCount === 1 ? "" : "s"} this week)`;
    }

    // Build embed fields
    const fields: { name: string; value: string }[] = [
      {
        name: "📊 Problems Solved Today",
        value: `${solvedToday} problem${solvedToday === 1 ? "" : "s"}`,
      },
      {
        name: "🎯 Track Split",
        value: `Practice: ${practiceCount} | Trust Mode: ${trustCount}`,
      },
      {
        name: "🔥 Current Streak",
        value: `${streak} day${streak === 1 ? "" : "s"}`,
      },
      {
        name: "📅 Weekly Progress",
        value: `${weeklyCount} submission${weeklyCount === 1 ? "" : "s"} in the last 7 days`,
      },
    ];

    if (topicInsight) {
      fields.push({
        name: "💡 Focus Area",
        value: topicInsight,
      });
    }

    await sendDiscordEmbed(
      `🌙 Evening Wrap-up for ${userName}`,
      fields,
      COLOR_BLUE
    );

    notificationsSent++;
  }

  return NextResponse.json({
    message: "Evening wrap-up sent",
    notifications_sent: notificationsSent,
    users_notified: activeUserIds,
  });
}
