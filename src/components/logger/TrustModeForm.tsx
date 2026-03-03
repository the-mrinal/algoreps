"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { Problem } from "@/types";

const COMPLEXITY_OPTIONS = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n²)",
  "O(2ⁿ)",
];

const SCORE_LABELS: Record<number, string> = {
  1: "Struggled",
  2: "Suboptimal",
  3: "Acceptable",
  4: "Clean",
  5: "Optimal",
};

export default function TrustModeForm({
  problems,
}: {
  problems: Problem[];
}) {
  // Form state
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [problemSearch, setProblemSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");

  // Custom problem state
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDifficulty, setCustomDifficulty] = useState("");
  const [customTopics, setCustomTopics] = useState("");
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [customError, setCustomError] = useState("");
  const [code, setCode] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showTopicsDropdown, setShowTopicsDropdown] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [approach, setApproach] = useState("");
  const [remarks, setRemarks] = useState("");
  const [score, setScore] = useState(3);
  const [timeTaken, setTimeTaken] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const topicsDropdownRef = useRef<HTMLDivElement>(null);

  // All unique topics from problems
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    problems.forEach((p) => p.topics.forEach((t) => topics.add(t)));
    return Array.from(topics).sort();
  }, [problems]);

  // Filtered problems for dropdown
  const filteredProblems = useMemo(() => {
    if (!problemSearch.trim()) return problems;
    const search = problemSearch.toLowerCase();
    return problems.filter((p) => p.title.toLowerCase().includes(search));
  }, [problems, problemSearch]);

  // Filtered topics for dropdown
  const filteredTopics = useMemo(() => {
    const available = allTopics.filter((t) => !selectedTopics.includes(t));
    if (!topicSearch.trim()) return available;
    const search = topicSearch.toLowerCase();
    return available.filter((t) => t.toLowerCase().includes(search));
  }, [allTopics, selectedTopics, topicSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        topicsDropdownRef.current &&
        !topicsDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTopicsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Helper: extract slug from LeetCode URL
  const extractSlugFromUrl = (url: string): string | null => {
    const match = url.match(/\/problems\/([a-z0-9-]+)/);
    return match ? match[1] : null;
  };

  // Helper: slug to title
  const slugToTitle = (slug: string): string =>
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Auto-fill title when URL is pasted
  const handleCustomUrlChange = (url: string) => {
    setCustomUrl(url);
    const slug = extractSlugFromUrl(url);
    if (slug) {
      setCustomTitle(slugToTitle(slug));
    }
  };

  // Add custom problem via API
  const handleAddCustomProblem = async () => {
    setCustomError("");

    if (!customTitle.trim() && !customUrl.trim()) {
      setCustomError("Please enter a title or LeetCode URL");
      return;
    }
    if (!customDifficulty) {
      setCustomError("Please select a difficulty");
      return;
    }

    setIsAddingProblem(true);
    try {
      const payload: Record<string, unknown> = { difficulty: customDifficulty };
      if (customUrl.trim()) {
        payload.leetcode_url = customUrl.trim();
      }
      if (customTitle.trim()) {
        payload.title = customTitle.trim();
      }
      const parsedTopics = customTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (parsedTopics.length > 0) {
        payload.topics = parsedTopics;
      }
      // Derive slug from title if no URL provided
      if (!customUrl.trim() && customTitle.trim()) {
        payload.slug = customTitle.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }

      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Failed to add problem (${res.status})`);
      }

      const data = await res.json();

      // Map DB row to Problem type with sensible defaults
      const problem: Problem = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        difficulty: data.difficulty,
        category: data.category || "",
        is_neetcode150: false,
        is_blind75: false,
        sheets: data.sheets || ["user-added"],
        topics: data.topics || [],
        description: "",
        examples: [],
        constraints: [],
        hints: [],
        code_snippets: {},
        neetcode_video_id: null,
        neetcode_url: "",
        leetcode_url: data.leetcode_url || "",
      };

      setSelectedProblem(problem);
      setProblemSearch("");
      setShowCustomPanel(false);
      setCustomUrl("");
      setCustomTitle("");
      setCustomDifficulty("");
      setCustomTopics("");
      setErrors((prev) => {
        const next = { ...prev };
        delete next.problem;
        return next;
      });
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : "Failed to add problem");
    } finally {
      setIsAddingProblem(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedProblem) {
      newErrors.problem = "Please select a problem";
    }
    // Score is always set (default 3), no validation needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitSuccess(null);
    setErrors({});

    try {
      const body: Record<string, unknown> = {
        problem_id: selectedProblem!.slug,
        performance_score: score,
        is_self_reported: true,
      };

      if (sourceUrl.trim()) body.source_url = sourceUrl.trim();
      if (code.trim()) body.code = code.trim();
      if (selectedTopics.length > 0) body.topics = selectedTopics;
      if (approach.trim()) body.approach = approach.trim();
      if (remarks.trim()) body.remarks = remarks.trim();
      if (timeTaken && parseInt(timeTaken, 10) > 0) {
        body.time_taken_mins = parseInt(timeTaken, 10);
      }
      if (timeComplexity) body.time_complexity = timeComplexity;
      if (spaceComplexity) body.space_complexity = spaceComplexity;

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Submission failed (${res.status})`);
      }

      const data = await res.json();
      const nextDate = new Date(data.next_revision_date).toLocaleDateString(
        "en-US",
        { weekday: "long", month: "long", day: "numeric" }
      );
      setSubmitSuccess(
        `Submission saved! Next revision scheduled for ${nextDate}.`
      );

      // Reset form
      setSelectedProblem(null);
      setProblemSearch("");
      setShowCustomPanel(false);
      setCustomUrl("");
      setCustomTitle("");
      setCustomDifficulty("");
      setCustomTopics("");
      setCustomError("");
      setSourceUrl("");
      setCode("");
      setSelectedTopics([]);
      setApproach("");
      setRemarks("");
      setScore(3);
      setTimeTaken("");
      setTimeComplexity("");
      setSpaceComplexity("");
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success message */}
      {submitSuccess && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <p className="text-sm text-green-400">{submitSuccess}</p>
          <a
            href="/dashboard/progress"
            className="mt-1 inline-block text-xs text-green-500 underline hover:text-green-400"
          >
            View in progress history
          </a>
        </div>
      )}

      {/* Submit error */}
      {errors.submit && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{errors.submit}</p>
        </div>
      )}

      {/* Problem Selector */}
      <div ref={dropdownRef} className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Problem <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={selectedProblem ? selectedProblem.title : problemSearch}
          onChange={(e) => {
            setProblemSearch(e.target.value);
            setSelectedProblem(null);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search problems..."
          className={`w-full rounded-md border ${errors.problem ? "border-red-500" : "border-gray-600"} bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
        />
        {errors.problem && (
          <p className="mt-1 text-xs text-red-400">{errors.problem}</p>
        )}
        {showDropdown && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-600 bg-gray-800 shadow-lg">
            {filteredProblems.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No problems found
              </div>
            ) : (
              filteredProblems.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => {
                    setSelectedProblem(p);
                    setProblemSearch("");
                    setShowDropdown(false);
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.problem;
                      return next;
                    });
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
                >
                  <span className="truncate">{p.title}</span>
                  <span
                    className={`ml-2 flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                      p.difficulty === "Easy"
                        ? "bg-green-900/50 text-green-400"
                        : p.difficulty === "Medium"
                          ? "bg-yellow-900/50 text-yellow-400"
                          : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Problem not listed? */}
      {!selectedProblem && (
        <div>
          {!showCustomPanel ? (
            <button
              type="button"
              onClick={() => setShowCustomPanel(true)}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Problem not listed?
            </button>
          ) : (
            <div className="rounded-lg border border-gray-600 bg-gray-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Add a new problem
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomPanel(false);
                    setCustomUrl("");
                    setCustomTitle("");
                    setCustomDifficulty("");
                    setCustomTopics("");
                    setCustomError("");
                  }}
                  className="text-gray-500 hover:text-gray-300 text-sm"
                >
                  &times;
                </button>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  LeetCode URL
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => handleCustomUrlChange(e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Count Vowels Permutation"
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Difficulty <span className="text-red-400">*</span>
                </label>
                <select
                  value={customDifficulty}
                  onChange={(e) => setCustomDifficulty(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select difficulty...</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Topics (comma-separated)
                </label>
                <input
                  type="text"
                  value={customTopics}
                  onChange={(e) => setCustomTopics(e.target.value)}
                  placeholder="e.g. Array, Binary Search, Bit Manipulation"
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {customError && (
                <p className="text-xs text-red-400">{customError}</p>
              )}

              <button
                type="button"
                onClick={handleAddCustomProblem}
                disabled={isAddingProblem}
                className="w-full rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAddingProblem ? "Adding..." : "Add Problem"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* LeetCode URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          LeetCode URL
        </label>
        <input
          type="text"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://leetcode.com/problems/..."
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Code Paste Area */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Code
        </label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your solution code here..."
          rows={8}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Topics Multi-Select */}
      <div ref={topicsDropdownRef} className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Topics / Tags
        </label>
        {selectedTopics.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selectedTopics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 rounded-full bg-blue-900/50 px-2.5 py-0.5 text-xs text-blue-300"
              >
                {topic}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTopics((prev) =>
                      prev.filter((t) => t !== topic)
                    )
                  }
                  className="text-blue-400 hover:text-blue-200"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={topicSearch}
          onChange={(e) => {
            setTopicSearch(e.target.value);
            setShowTopicsDropdown(true);
          }}
          onFocus={() => setShowTopicsDropdown(true)}
          placeholder="Search and select topics..."
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {showTopicsDropdown && filteredTopics.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-600 bg-gray-800 shadow-lg">
            {filteredTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  setSelectedTopics((prev) => [...prev, topic]);
                  setTopicSearch("");
                }}
                className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Approach */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Approach
        </label>
        <textarea
          value={approach}
          onChange={(e) => setApproach(e.target.value)}
          placeholder="Describe your approach to solving this problem..."
          rows={3}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Remarks
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Any notes or observations..."
          rows={2}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Self-Assessed Score */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Self-Assessed Score <span className="text-red-400">*</span>
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value, 10))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={
                  score === n ? "font-semibold text-blue-400" : ""
                }
              >
                {n}
              </span>
            ))}
          </div>
          <p className="text-center text-sm">
            <span
              className={`font-medium ${
                score <= 2
                  ? "text-red-400"
                  : score === 3
                    ? "text-yellow-400"
                    : "text-green-400"
              }`}
            >
              {score} — {SCORE_LABELS[score]}
            </span>
          </p>
        </div>
      </div>

      {/* Time Taken + Complexities Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Time Taken (mins)
          </label>
          <input
            type="number"
            min={0}
            value={timeTaken}
            onChange={(e) => setTimeTaken(e.target.value)}
            placeholder="e.g. 25"
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Time Complexity
          </label>
          <select
            value={timeComplexity}
            onChange={(e) => setTimeComplexity(e.target.value)}
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {COMPLEXITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Space Complexity
          </label>
          <select
            value={spaceComplexity}
            onChange={(e) => setSpaceComplexity(e.target.value)}
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {COMPLEXITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Submitting..." : "Log Submission"}
      </button>
    </form>
  );
}
