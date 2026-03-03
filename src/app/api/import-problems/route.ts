import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ImportResult {
  imported: number;
  updated: number;
  errors: string[];
}

function extractSlugFromUrl(url: string): string | null {
  // Extract slug from URLs like https://leetcode.com/problems/two-sum/
  const match = url.match(/\/problems\/([a-z0-9-]+)/);
  return match ? match[1] : null;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV fields
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    for (let k = 0; k < headers.length; k++) {
      row[headers[k]] = values[k] || "";
    }
    rows.push(row);
  }

  return rows;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const sheetName = (formData.get("sheet_name") as string)?.trim();

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!sheetName) {
    return NextResponse.json({ error: "No sheet_name provided" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV file is empty or has no data rows" }, { status: 400 });
  }

  const result: ImportResult = { imported: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // 1-indexed, +1 for header

    // Determine slug
    let slug = row.slug?.trim();
    if (!slug && row.leetcode_url) {
      slug = extractSlugFromUrl(row.leetcode_url) ?? "";
    }
    if (!slug) {
      result.errors.push(`Row ${lineNum}: missing slug and leetcode_url`);
      continue;
    }

    const title = row.title?.trim();
    const difficulty = row.difficulty?.trim();

    if (!title) {
      result.errors.push(`Row ${lineNum} (${slug}): missing title`);
      continue;
    }
    if (!difficulty || !["Easy", "Medium", "Hard"].includes(difficulty)) {
      result.errors.push(`Row ${lineNum} (${slug}): invalid difficulty "${difficulty}"`);
      continue;
    }

    const topics = row.topics
      ? row.topics.split(";").map((t: string) => t.trim()).filter(Boolean)
      : [];
    const category = row.category?.trim() || "";
    const leetcodeUrl = row.leetcode_url?.trim() || "";

    // Check if problem exists
    const { data: existing } = await supabase
      .from("problems")
      .select("id, sheets")
      .eq("slug", slug)
      .single();

    if (existing) {
      // Append sheet name if not already present
      const currentSheets: string[] = existing.sheets || [];
      if (!currentSheets.includes(sheetName)) {
        const { error } = await supabase
          .from("problems")
          .update({
            sheets: [...currentSheets, sheetName],
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          result.errors.push(`Row ${lineNum} (${slug}): update failed — ${error.message}`);
        } else {
          result.updated++;
        }
      } else {
        result.updated++; // Already has this sheet
      }
    } else {
      // Insert new problem
      const { error } = await supabase.from("problems").insert({
        title,
        slug,
        difficulty,
        category,
        sheets: [sheetName],
        topics,
        leetcode_url: leetcodeUrl,
      });

      if (error) {
        result.errors.push(`Row ${lineNum} (${slug}): insert failed — ${error.message}`);
      } else {
        result.imported++;
      }
    }
  }

  return NextResponse.json(result);
}
