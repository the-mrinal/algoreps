import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDiscordEmbed } from "@/lib/discord";
import { getAllProblems } from "@/lib/problems";
import { generateDailyPlan } from "@/lib/daily-plan";
import type { PlanItem } from "@/types";

// Discord embed colors
const COLOR_CYAN = 0x00e5ff;

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

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  onboarding_completed: boolean;
  current_pattern_index: number;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch all users
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, onboarding_completed, current_pattern_index");

  if (profileError || !profiles || profiles.length === 0) {
    return NextResponse.json({
      message: "No users found",
      notifications_sent: 0,
    });
  }

  // Build slug → title map from problems table
  const problems = await getAllProblems(supabase);
  const slugToTitle = new Map(problems.map((p) => [p.slug, p.title]));

  let notificationsSent = 0;

  for (const profile of profiles as UserProfile[]) {
    const userName = profile.display_name || profile.email || "User";

    // Try daily plan approach for onboarded users
    if (profile.onboarding_completed) {
      try {
        const planItems = await generateOrLoadPlan(profile.id, today, supabase);

        if (planItems.length === 0) {
          continue; // No plan items, skip notification
        }

        // Persist plan to daily_plans table
        await persistPlan(profile.id, today, planItems, supabase);

        // Build embed fields from plan
        const fields = buildPlanFields(planItems, slugToTitle);
        const revisionCount = planItems.filter((i) => i.type === "revision").length;
        const newCount = planItems.filter((i) => i.type === "new").length;
        const totalMinutes = planItems.reduce((sum, i) => sum + i.estimated_minutes, 0);
        const currentPattern = CATEGORY_ORDER[profile.current_pattern_index] ?? "Arrays & Hashing";

        await sendDiscordEmbed(
          `☀️ Morning Briefing for ${userName} — ${planItems.length} problems (${revisionCount} revisions + ${newCount} new) · ~${totalMinutes}min`,
          [
            { name: "📍 Current Pattern", value: currentPattern },
            ...fields,
          ],
          COLOR_CYAN,
        );

        notificationsSent++;
      } catch (err) {
        // Fall back to revision-only notification
        console.error(`Plan generation failed for ${profile.id}:`, err);
        const sent = await sendRevisionOnlyNotification(profile.id, userName, supabase, slugToTitle);
        if (sent) notificationsSent++;
      }
    } else {
      // Non-onboarded users: fall back to revision-only
      const sent = await sendRevisionOnlyNotification(profile.id, userName, supabase, slugToTitle);
      if (sent) notificationsSent++;
    }
  }

  return NextResponse.json({
    message: "Morning briefing sent",
    notifications_sent: notificationsSent,
  });
}

/**
 * Load existing plan for today or generate a new one.
 */
async function generateOrLoadPlan(
  userId: string,
  today: string,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<PlanItem[]> {
  // Check for existing plan
  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("plan_data")
    .eq("user_id", userId)
    .eq("plan_date", today)
    .single();

  if (existingPlan?.plan_data) {
    return existingPlan.plan_data as PlanItem[];
  }

  // Generate new plan
  return generateDailyPlan(userId, supabase);
}

/**
 * Persist plan to daily_plans table (upsert).
 */
async function persistPlan(
  userId: string,
  today: string,
  planItems: PlanItem[],
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  await supabase
    .from("daily_plans")
    .upsert(
      {
        user_id: userId,
        plan_date: today,
        plan_data: planItems,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,plan_date" },
    );
}

/**
 * Build Discord embed fields from plan items.
 */
function buildPlanFields(
  planItems: PlanItem[],
  slugToTitle: Map<string, string>,
): Array<{ name: string; value: string }> {
  const fields: Array<{ name: string; value: string }> = [];

  const revisions = planItems.filter((i) => i.type === "revision");
  const newProblems = planItems.filter((i) => i.type === "new");

  if (revisions.length > 0) {
    const revisionLines = revisions.map((r) => {
      const title = slugToTitle.get(r.problem_id) || r.problem_id;
      const diffBadge = r.difficulty === "Easy" ? "🟢" : r.difficulty === "Medium" ? "🟡" : "🔴";
      return `${diffBadge} ${title} · ${r.estimated_minutes}min`;
    });

    fields.push({
      name: `🔄 Revisions (${revisions.length})`,
      value: revisionLines.join("\n"),
    });
  }

  if (newProblems.length > 0) {
    const newLines = newProblems.map((p) => {
      const title = slugToTitle.get(p.problem_id) || p.problem_id;
      const diffBadge = p.difficulty === "Easy" ? "🟢" : p.difficulty === "Medium" ? "🟡" : "🔴";
      return `${diffBadge} ${title} [${p.category}] · ${p.estimated_minutes}min`;
    });

    fields.push({
      name: `🆕 New Problems (${newProblems.length})`,
      value: newLines.join("\n"),
    });
  }

  return fields;
}

/**
 * Fallback: send revision-only notification (original behavior).
 */
async function sendRevisionOnlyNotification(
  userId: string,
  userName: string,
  supabase: ReturnType<typeof createAdminClient>,
  slugToTitle: Map<string, string>,
): Promise<boolean> {
  const today = new Date().toISOString();

  const { data: dueRevisions } = await supabase
    .from("user_progress")
    .select("problem_id, performance_score")
    .eq("user_id", userId)
    .not("next_revision_date", "is", null)
    .lte("next_revision_date", today);

  if (!dueRevisions || dueRevisions.length === 0) {
    return false;
  }

  const hard: string[] = [];
  const medium: string[] = [];
  const easy: string[] = [];

  for (const rev of dueRevisions) {
    const title = slugToTitle.get(rev.problem_id) || rev.problem_id;
    if (rev.performance_score <= 2) {
      hard.push(title);
    } else if (rev.performance_score === 3) {
      medium.push(title);
    } else {
      easy.push(title);
    }
  }

  const fields: Array<{ name: string; value: string }> = [];

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

  if (fields.length === 0) return false;

  await sendDiscordEmbed(
    `☀️ Morning Briefing for ${userName} — ${dueRevisions.length} revision${dueRevisions.length === 1 ? "" : "s"} due`,
    fields,
    COLOR_CYAN,
  );

  return true;
}
