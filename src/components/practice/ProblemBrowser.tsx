"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Problem } from "@/types";
import ProblemPane from "./ProblemPane";
import EditorPane from "./EditorPane";

const difficultyColors: Record<string, string> = {
  Easy: "bg-neon-green/20 text-neon-green",
  Medium: "bg-yellow-500/20 text-yellow-400",
  Hard: "bg-red-500/20 text-red-400",
};

export default function ProblemBrowser({
  problems,
  categories,
  sheets,
}: {
  problems: Problem[];
  categories: string[];
  sheets: string[];
}) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [showCategories, setShowCategories] = useState(true);
  const [showProblemList, setShowProblemList] = useState(true);
  const [showProblemPane, setShowProblemPane] = useState(true);

  useEffect(() => {
    const problemSlug = searchParams.get("problem");
    if (problemSlug) {
      const problem = problems.find((p) => p.slug === problemSlug);
      if (problem) {
        setSelectedProblem(problem);
      }
    }
  }, [searchParams, problems]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of problems) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [problems]);

  const filteredProblems = useMemo(() => {
    let result = problems;
    if (selectedSheet) {
      result = result.filter((p) => p.sheets?.includes(selectedSheet));
    }
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(query));
    }
    return result;
  }, [problems, selectedSheet, selectedCategory, searchQuery]);

  return (
    <div className="flex h-full gap-2">
      {/* Category Sidebar */}
      {showCategories ? (
        <div className="w-48 flex-shrink-0 overflow-y-auto rounded-lg border border-[var(--surface-border)] bg-[var(--surface)]">
          <div className="p-3 border-b border-[var(--surface-border)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Categories
            </h3>
            <button
              onClick={() => setShowCategories(false)}
              className="text-gray-500 hover:text-foreground transition-colors"
              title="Collapse categories"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          </div>
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                selectedCategory === null
                  ? "bg-neon-cyan/10 text-neon-cyan font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <span className="flex justify-between items-center">
                <span>All Problems</span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {problems.length}
                </span>
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  selectedCategory === cat
                    ? "bg-neon-cyan/10 text-neon-cyan font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <span className="flex justify-between items-center">
                  <span className="truncate">{cat}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                    {categoryCounts[cat] || 0}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCategories(true)}
          className="w-8 flex-shrink-0 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors"
          title="Expand categories"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="text-[10px] text-gray-500 [writing-mode:vertical-lr]">Categories</span>
        </button>
      )}

      {/* Problem List */}
      {showProblemList ? (
        <div className="w-64 flex-shrink-0 flex flex-col overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface)]">
          {/* Sheet Filter */}
          {sheets.length > 0 && (
            <div className="p-2 border-b border-[var(--surface-border)]">
              <select
                value={selectedSheet || ""}
                onChange={(e) => setSelectedSheet(e.target.value || null)}
                className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan/50"
              >
                <option value="">All Sheets</option>
                {sheets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="p-2 border-b border-[var(--surface-border)]">
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-cyan/50"
            />
          </div>

          {/* Header */}
          <div className="px-3 py-1.5 border-b border-[var(--surface-border)] flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {filteredProblems.length} problem
              {filteredProblems.length !== 1 ? "s" : ""}
              {selectedCategory ? ` in ${selectedCategory}` : ""}
            </span>
            <button
              onClick={() => setShowProblemList(false)}
              className="text-gray-500 hover:text-foreground transition-colors"
              title="Collapse problem list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredProblems.map((problem) => (
              <button
                key={problem.id}
                onClick={() => setSelectedProblem(problem)}
                className={`w-full text-left px-3 py-2 border-b border-[var(--surface-border)] transition-colors ${
                  selectedProblem?.id === problem.id
                    ? "bg-neon-cyan/5"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground flex-1 truncate">
                    {problem.title}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${difficultyColors[problem.difficulty]}`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-500">
                  {problem.category}
                </div>
              </button>
            ))}
            {filteredProblems.length === 0 && (
              <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                No problems found.
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowProblemList(true)}
          className="w-8 flex-shrink-0 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors"
          title="Expand problem list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="text-[10px] text-gray-500 [writing-mode:vertical-lr]">Problems</span>
        </button>
      )}

      {/* Problem Description Pane */}
      {showProblemPane ? (
        <div className="flex-1 min-w-0 overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] flex flex-col">
          <div className="px-3 py-1.5 border-b border-[var(--surface-border)] flex items-center justify-end flex-shrink-0">
            <button
              onClick={() => setShowProblemPane(false)}
              className="text-gray-500 hover:text-foreground transition-colors"
              title="Collapse problem description"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ProblemPane problem={selectedProblem} />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowProblemPane(true)}
          className="w-8 flex-shrink-0 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors"
          title="Expand problem description"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="text-[10px] text-gray-500 [writing-mode:vertical-lr]">Description</span>
        </button>
      )}

      {/* Editor + Output Pane */}
      <div className="flex-1 min-w-0 overflow-hidden rounded-lg border border-[var(--surface-border)] bg-gray-900">
        <EditorPane problem={selectedProblem} />
      </div>
    </div>
  );
}
