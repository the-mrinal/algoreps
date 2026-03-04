import { createClient } from "@/lib/supabase/server";
import { parseUrl, slugToTitle } from "@/lib/url-parser";
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

  const { slug: rawSlug, leetcode_url, problem_url, title: rawTitle, difficulty, category, topics } = body as {
    slug?: string;
    leetcode_url?: string;
    problem_url?: string;
    title?: string;
    difficulty?: string;
    category?: string;
    topics?: string[];
  };

  // Accept problem_url or leetcode_url (backwards compat)
  const url = (problem_url || leetcode_url || "").trim();

  // Determine slug
  let slug = rawSlug?.trim();
  if (!slug && url) {
    const parsed = parseUrl(url);
    slug = parsed?.slug ?? undefined;
  }
  if (!slug) {
    return NextResponse.json(
      { error: "slug or problem URL is required" },
      { status: 400 }
    );
  }

  // Validate difficulty
  if (!difficulty || !["Easy", "Medium", "Hard"].includes(difficulty)) {
    return NextResponse.json(
      { error: 'difficulty is required and must be "Easy", "Medium", or "Hard"' },
      { status: 400 }
    );
  }

  // Determine title
  const title = rawTitle?.trim() || slugToTitle(slug);

  // Idempotent: return existing problem if slug already exists
  const { data: existing } = await supabase
    .from("problems")
    .select("*")
    .eq("slug", slug)
    .single();

  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  // Determine the URL to store — use original URL if provided,
  // only generate a LeetCode fallback when no URL is given
  const storedUrl = url || `https://leetcode.com/problems/${slug}/`;

  // Insert new problem
  const { data, error } = await supabase
    .from("problems")
    .insert({
      title,
      slug,
      difficulty,
      category: category?.trim() || "",
      sheets: ["user-added"],
      topics: Array.isArray(topics) ? topics : [],
      leetcode_url: storedUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
