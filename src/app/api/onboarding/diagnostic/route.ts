import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_PATTERNS = [
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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ratings: { pattern_name: string; confidence_rating: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.ratings) || body.ratings.length !== 18) {
    return NextResponse.json(
      { error: "Must provide exactly 18 pattern ratings" },
      { status: 400 }
    );
  }

  // Validate each rating
  for (const r of body.ratings) {
    if (!VALID_PATTERNS.includes(r.pattern_name)) {
      return NextResponse.json(
        { error: `Invalid pattern: ${r.pattern_name}` },
        { status: 400 }
      );
    }
    if (
      !Number.isInteger(r.confidence_rating) ||
      r.confidence_rating < 1 ||
      r.confidence_rating > 5
    ) {
      return NextResponse.json(
        { error: `Invalid rating for ${r.pattern_name}: must be 1-5` },
        { status: 400 }
      );
    }
  }

  // Upsert all 18 rows
  const rows = body.ratings.map((r) => ({
    user_id: user.id,
    pattern_name: r.pattern_name,
    confidence_rating: r.confidence_rating,
  }));

  const { error } = await supabase
    .from("user_pattern_confidence")
    .upsert(rows, { onConflict: "user_id,pattern_name" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    pattern_name: string;
    diagnostic_problem_id?: string;
    diagnostic_score?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!VALID_PATTERNS.includes(body.pattern_name)) {
    return NextResponse.json(
      { error: `Invalid pattern: ${body.pattern_name}` },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.diagnostic_problem_id !== undefined) {
    updateData.diagnostic_problem_id = body.diagnostic_problem_id;
  }
  if (body.diagnostic_score !== undefined) {
    if (
      !Number.isInteger(body.diagnostic_score) ||
      body.diagnostic_score < 1 ||
      body.diagnostic_score > 5
    ) {
      return NextResponse.json(
        { error: "diagnostic_score must be 1-5" },
        { status: 400 }
      );
    }
    updateData.diagnostic_score = body.diagnostic_score;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("user_pattern_confidence")
    .update(updateData)
    .eq("user_id", user.id)
    .eq("pattern_name", body.pattern_name);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
