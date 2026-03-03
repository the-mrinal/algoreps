"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Problem } from "@/types";
import ProblemPane from "./ProblemPane";
import EditorPane from "./EditorPane";

const difficultyColors: Record<string, string> = {
  Easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
      <div className="w-48 flex-shrink-0 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Categories
          </h3>
        </div>
        <div className="p-1.5 space-y-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              selectedCategory === null
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <span className="flex justify-between items-center">
              <span>All Problems</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
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
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <span className="flex justify-between items-center">
                <span className="truncate">{cat}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  {categoryCounts[cat] || 0}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Problem List */}
      <div className="w-64 flex-shrink-0 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Sheet Filter */}
        {sheets.length > 0 && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <select
              value={selectedSheet || ""}
              onChange={(e) => setSelectedSheet(e.target.value || null)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Header */}
        <div className="px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
          {filteredProblems.length} problem
          {filteredProblems.length !== 1 ? "s" : ""}
          {selectedCategory ? ` in ${selectedCategory}` : ""}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredProblems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => setSelectedProblem(problem)}
              className={`w-full text-left px-3 py-2 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                selectedProblem?.id === problem.id
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-900 dark:text-white flex-1 truncate">
                  {problem.title}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${difficultyColors[problem.difficulty]}`}
                >
                  {problem.difficulty}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
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

      {/* Problem Description Pane */}
      <div className="flex-1 min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <ProblemPane problem={selectedProblem} />
      </div>

      {/* Editor + Output Pane */}
      <div className="flex-1 min-w-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-900">
        <EditorPane problem={selectedProblem} />
      </div>
    </div>
  );
}
