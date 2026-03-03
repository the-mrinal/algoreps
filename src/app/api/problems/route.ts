import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function extractSlugFromUrl(url: string): string | null {
  const match = url.match(/\/problems\/([a-z0-9-]+)/);
  return match ? match[1] : null;
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

  const { slug: rawSlug, leetcode_url, title: rawTitle, difficulty, category, topics } = body as {
    slug?: string;
    leetcode_url?: string;
    title?: string;
    difficulty?: string;
    category?: string;
    topics?: string[];
  };

  // Determine slug
  let slug = rawSlug?.trim();
  if (!slug && leetcode_url && typeof leetcode_url === "string") {
    slug = extractSlugFromUrl(leetcode_url) ?? undefined;
  }
  if (!slug) {
    return NextResponse.json(
      { error: "slug or leetcode_url is required" },
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
      leetcode_url:
        typeof leetcode_url === "string" && leetcode_url.trim()
          ? leetcode_url.trim()
          : `https://leetcode.com/problems/${slug}/`,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
