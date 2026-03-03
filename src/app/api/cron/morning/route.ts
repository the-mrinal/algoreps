import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDiscordEmbed } from "@/lib/discord";
import { getAllProblems } from "@/lib/problems";

// Discord embed colors
const COLOR_RED = 0xff4444;

interface DueRevision {
  user_id: string;
  problem_id: string;
  performance_score: number;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all due revisions across all users
  const { data: dueRevisions, error: revError } = await supabase
    .from("user_progress")
    .select("user_id, problem_id, performance_score")
    .not("next_revision_date", "is", null)
    .lte("next_revision_date", new Date().toISOString());

  if (revError) {
    return NextResponse.json({ error: revError.message }, { status: 500 });
  }

  if (!dueRevisions || dueRevisions.length === 0) {
    return NextResponse.json({
      message: "No due revisions for any user",
      notifications_sent: 0,
    });
  }

  // Build slug → title map from problems table
  const problems = await getAllProblems(supabase);
  const slugToTitle = new Map(problems.map((p) => [p.slug, p.title]));

  // Group revisions by user
  const byUser = new Map<string, DueRevision[]>();
  for (const rev of dueRevisions) {
    const list = byUser.get(rev.user_id) || [];
    list.push(rev);
    byUser.set(rev.user_id, list);
  }

  // Fetch profiles for all users with due revisions
  const userIds = Array.from(byUser.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in("id", userIds);

  const profileMap = new Map<string, UserProfile>(
    (profiles || []).map((p: UserProfile) => [p.id, p])
  );

  // Send one embed per user
  let notificationsSent = 0;

  for (const [userId, revisions] of Array.from(byUser.entries())) {
    const profile = profileMap.get(userId);
    const userName =
      profile?.display_name || profile?.email || "User";

    // Group by score category
    const hard: string[] = [];   // score 1-2
    const medium: string[] = []; // score 3
    const easy: string[] = [];   // score 4-5

    for (const rev of revisions) {
      const title = slugToTitle.get(rev.problem_id) || rev.problem_id;
      if (rev.performance_score <= 2) {
        hard.push(title);
      } else if (rev.performance_score === 3) {
        medium.push(title);
      } else {
        easy.push(title);
      }
    }

    const fields: { name: string; value: string }[] = [];

    if (hard.length > 0) {
      fields.push({
        name: `🔴 Hard (${hard.length})`,
        value: hard.map((t) => `• ${t}`).join("\n"),
      });
    }
    if (medium.length > 0) {
      fields.push({
        name: `🟡 Medium (${medium.length})`,
        value: medium.map((t) => `• ${t}`).join("\n"),
      });
    }
    if (easy.length > 0) {
      fields.push({
        name: `🟢 Easy (${easy.length})`,
        value: easy.map((t) => `• ${t}`).join("\n"),
      });
    }

    await sendDiscordEmbed(
      `☀️ Morning Briefing for ${userName} — ${revisions.length} problem${revisions.length === 1 ? "" : "s"} due`,
      fields,
      COLOR_RED
    );

    notificationsSent++;
  }

  return NextResponse.json({
    message: "Morning briefing sent",
    notifications_sent: notificationsSent,
    users_notified: userIds,
  });
}
