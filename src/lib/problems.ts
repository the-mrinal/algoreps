import type { Problem } from "@/types";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getClient(client?: SupabaseClient): Promise<SupabaseClient> {
  if (client) return client;
  return await createClient();
}

function mapRow(row: Record<string, unknown>): Problem {
  return {
    id: row.leetcode_id as string,
    title: row.title as string,
    slug: row.slug as string,
    difficulty: row.difficulty as Problem["difficulty"],
    category: row.category as string,
    is_neetcode150: ((row.sheets as string[]) || []).includes("neetcode-150"),
    is_blind75: ((row.sheets as string[]) || []).includes("blind-75"),
    sheets: (row.sheets as string[]) || [],
    topics: (row.topics as string[]) || [],
    description: (row.description as string) || "",
    examples: (row.examples as Problem["examples"]) || [],
    constraints: (row.constraints as string[]) || [],
    hints: (row.hints as string[]) || [],
    code_snippets: (row.code_snippets as Record<string, string>) || {},
    neetcode_video_id: (row.neetcode_video_id as string) || null,
    neetcode_url: (row.neetcode_url as string) || "",
    leetcode_url: (row.leetcode_url as string) || "",
    pattern_order: (row.pattern_order as number) ?? null,
  };
}

export async function getAllProblems(client?: SupabaseClient): Promise<Problem[]> {
  const supabase = await getClient(client);
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .order("leetcode_id");

  if (error) throw new Error(`Failed to fetch problems: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function getProblemBySlug(
  slug: string,
  client?: SupabaseClient
): Promise<Problem | undefined> {
  const supabase = await getClient(client);
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return undefined;
  return mapRow(data);
}

export async function getProblemsByCategory(
  category: string,
  client?: SupabaseClient
): Promise<Problem[]> {
  const supabase = await getClient(client);
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("category", category);

  if (error) throw new Error(`Failed to fetch problems: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function getProblemsByDifficulty(
  difficulty: "Easy" | "Medium" | "Hard",
  client?: SupabaseClient
): Promise<Problem[]> {
  const supabase = await getClient(client);
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("difficulty", difficulty);

  if (error) throw new Error(`Failed to fetch problems: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function getCategories(client?: SupabaseClient): Promise<string[]> {
  const supabase = await getClient(client);
  const { data, error } = await supabase
    .from("problems")
    .select("category")
    .order("category");

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  const categories = new Set((data || []).map((r: { category: string }) => r.category));
  return Array.from(categories).sort();
}

export async function getSheets(client?: SupabaseClient): Promise<string[]> {
  const supabase = await getClient(client);
  const { data, error } = await supabase
    .from("problems")
    .select("sheets");

  if (error) throw new Error(`Failed to fetch sheets: ${error.message}`);
  const sheets = new Set<string>();
  for (const row of data || []) {
    for (const s of (row.sheets as string[]) || []) {
      sheets.add(s);
    }
  }
  return Array.from(sheets).sort();
}

export async function getProblemsBySheet(
  sheet: string,
  client?: SupabaseClient
): Promise<Problem[]> {
  const supabase = await getClient(client);
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .contains("sheets", [sheet]);

  if (error) throw new Error(`Failed to fetch problems: ${error.message}`);
  return (data || []).map(mapRow);
}
