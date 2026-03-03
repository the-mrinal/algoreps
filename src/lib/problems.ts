import fs from "fs";
import path from "path";
import type { Problem } from "@/types";

let cachedProblems: Problem[] | null = null;

function loadProblems(): Problem[] {
  if (cachedProblems) return cachedProblems;
  const filePath = path.join(process.cwd(), "data", "problems.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  cachedProblems = JSON.parse(raw) as Problem[];
  return cachedProblems;
}

export function getAllProblems(): Problem[] {
  return loadProblems();
}

export function getProblemBySlug(slug: string): Problem | undefined {
  return loadProblems().find((p) => p.slug === slug);
}

export function getProblemsByCategory(category: string): Problem[] {
  return loadProblems().filter((p) => p.category === category);
}

export function getProblemsByDifficulty(
  difficulty: "Easy" | "Medium" | "Hard"
): Problem[] {
  return loadProblems().filter((p) => p.difficulty === difficulty);
}

export function getCategories(): string[] {
  const categories = new Set(loadProblems().map((p) => p.category));
  return Array.from(categories).sort();
}
