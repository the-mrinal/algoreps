import { createClient } from "@/lib/supabase/server";
import { calculateNextRevisionDate } from "@/lib/srs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

  const { problem_id, performance_score } = body as {
    problem_id?: string;
    performance_score?: number;
  };

  if (!problem_id || typeof problem_id !== "string") {
    return NextResponse.json(
      { error: "problem_id is required" },
      { status: 400 }
    );
  }

  if (
    performance_score == null ||
    typeof performance_score !== "number" ||
    performance_score < 1 ||
    performance_score > 5 ||
    !Number.isInteger(performance_score)
  ) {
    return NextResponse.json(
      { error: "performance_score must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  // Look up the latest previous submission for this user+problem to get current interval_step
  const { data: previousSubmission } = await supabase
    .from("user_progress")
    .select("interval_step")
    .eq("user_id", user.id)
    .eq("problem_id", problem_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const currentIntervalStep = previousSubmission?.interval_step ?? 0;
  const { next_revision_date, interval_step } = calculateNextRevisionDate(
    performance_score,
    currentIntervalStep,
  );

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    problem_id,
    performance_score,
    next_revision_date: next_revision_date.toISOString(),
    interval_step,
  };

  // Optional fields
  const optionalFields = [
    "code",
    "is_self_reported",
    "source_url",
    "topics",
    "approach",
    "remarks",
    "time_taken_mins",
    "time_taken_seconds",
    "run_count",
    "successful_run_number",
    "manually_solved",
    "time_complexity",
    "space_complexity",
    "ai_review",
  ] as const;

  for (const field of optionalFields) {
    if (body[field] !== undefined) {
      insertData[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("user_progress")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1),
    100
  );
  const offset = Math.max(
    parseInt(searchParams.get("offset") || "0", 10) || 0,
    0
  );
  const problemId = searchParams.get("problem_id");
  const isSelfReported = searchParams.get("is_self_reported");

  let query = supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (problemId) {
    query = query.eq("problem_id", problemId);
  }

  if (isSelfReported !== null) {
    if (isSelfReported === "true") {
      query = query.eq("is_self_reported", true);
    } else if (isSelfReported === "false") {
      query = query.eq("is_self_reported", false);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

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

  const { id, performance_score } = body as {
    id?: string;
    performance_score?: number;
  };

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  if (
    performance_score == null ||
    typeof performance_score !== "number" ||
    performance_score < 1 ||
    performance_score > 5 ||
    !Number.isInteger(performance_score)
  ) {
    return NextResponse.json(
      { error: "performance_score must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  // Read the submission's current interval_step
  const { data: existingSubmission } = await supabase
    .from("user_progress")
    .select("interval_step")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const currentIntervalStep = existingSubmission?.interval_step ?? 0;
  const { next_revision_date, interval_step } = calculateNextRevisionDate(
    performance_score,
    currentIntervalStep,
  );

  const { data, error } = await supabase
    .from("user_progress")
    .update({
      performance_score,
      next_revision_date: next_revision_date.toISOString(),
      interval_step,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
