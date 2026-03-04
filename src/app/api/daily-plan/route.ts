import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { PlanItem } from "@/types";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { plan_date, action, problem_id } = body as {
    plan_date?: string;
    action?: string;
    problem_id?: string;
  };

  if (!plan_date || !action || !problem_id) {
    return NextResponse.json(
      { error: "plan_date, action, and problem_id are required" },
      { status: 400 },
    );
  }

  if (action !== "swap" && action !== "skip") {
    return NextResponse.json(
      { error: "action must be 'swap' or 'skip'" },
      { status: 400 },
    );
  }

  // Load the daily plan for this user and date
  const { data: plan, error: planError } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_date", plan_date)
    .single();

  if (planError || !plan) {
    return NextResponse.json(
      { error: "Daily plan not found" },
      { status: 404 },
    );
  }

  const planData = plan.plan_data as PlanItem[];
  const itemIndex = planData.findIndex((item) => item.problem_id === problem_id);

  if (itemIndex === -1) {
    return NextResponse.json(
      { error: "Problem not found in today's plan" },
      { status: 404 },
    );
  }

  const item = planData[itemIndex];

  if (action === "skip") {
    // Update the item's status to 'skipped'
    planData[itemIndex] = { ...item, status: "skipped" };
  } else {
    // Swap action: find a replacement problem
    const existingProblemIds = new Set(planData.map((i) => i.problem_id));

    let replacement: PlanItem | null = null;

    if (item.type === "revision") {
      // Find next due revision not already in today's plan
      const today = new Date().toISOString().split("T")[0];
      const { data: revisionCandidates } = await supabase
        .from("user_progress")
        .select("problem_id, performance_score")
        .eq("user_id", user.id)
        .lte("next_revision_date", today)
        .order("performance_score", { ascending: true });

      const candidate = (revisionCandidates || []).find(
        (r: { problem_id: string }) => !existingProblemIds.has(r.problem_id),
      );

      if (candidate) {
        // Get problem metadata
        const { data: probData } = await supabase
          .from("problems")
          .select("slug, difficulty, category")
          .eq("slug", candidate.problem_id)
          .single();

        if (probData) {
          const ESTIMATED_MINUTES: Record<string, number> = {
            Easy: 15,
            Medium: 25,
            Hard: 40,
          };
          replacement = {
            problem_id: probData.slug,
            type: "revision",
            status: "pending",
            difficulty: probData.difficulty,
            category: probData.category,
            estimated_minutes: ESTIMATED_MINUTES[probData.difficulty] ?? 25,
          };
        }
      }
    } else {
      // New problem swap: find next problem by pattern_order not solved or in plan, same difficulty preferred
      const { data: solvedRows } = await supabase
        .from("user_progress")
        .select("problem_id")
        .eq("user_id", user.id);
      const solvedSet = new Set(
        (solvedRows || []).map((r: { problem_id: string }) => r.problem_id),
      );

      const { data: candidates } = await supabase
        .from("problems")
        .select("slug, difficulty, category, pattern_order")
        .not("pattern_order", "is", null)
        .order("pattern_order", { ascending: true });

      const available = (candidates || []).filter(
        (p: { slug: string }) =>
          !existingProblemIds.has(p.slug) && !solvedSet.has(p.slug),
      );

      // Prefer same difficulty
      const sameDifficulty = available.find(
        (p: { difficulty: string }) => p.difficulty === item.difficulty,
      );
      const chosen = sameDifficulty || available[0];

      if (chosen) {
        const ESTIMATED_MINUTES: Record<string, number> = {
          Easy: 15,
          Medium: 25,
          Hard: 40,
        };
        replacement = {
          problem_id: chosen.slug,
          type: "new",
          status: "pending",
          difficulty: chosen.difficulty,
          category: chosen.category,
          estimated_minutes: ESTIMATED_MINUTES[chosen.difficulty] ?? 25,
        };
      }
    }

    if (!replacement) {
      return NextResponse.json(
        { error: "No alternative problems available" },
        { status: 400 },
      );
    }

    planData[itemIndex] = replacement;
  }

  // Save updated plan
  const { error: updateError } = await supabase
    .from("daily_plans")
    .update({
      plan_data: planData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", plan.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ plan_data: planData }, { status: 200 });
}
