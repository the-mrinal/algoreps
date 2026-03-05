"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import type { Problem } from "@/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-gray-900 rounded-lg">
      <div className="text-sm text-gray-400">Loading editor...</div>
    </div>
  ),
});

type ProficiencyLevel = "beginner" | "rusty" | "intermediate" | "advanced";

const PROFICIENCY_OPTIONS: {
  value: ProficiencyLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to DSA or never practiced",
  },
  {
    value: "rusty",
    label: "Rusty",
    description: "Knew DSA but haven't practiced in months",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Can solve most Easy and some Medium",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Comfortable with Medium, working on Hard",
  },
];

const PROBLEM_SET_OPTIONS = [
  { value: "neetcode-150", label: "NeetCode 150" },
  { value: "blind-75", label: "Blind 75" },
  { value: "both", label: "Both" },
];

const PATTERN_ORDER: { name: string; description: string }[] = [
  { name: "Arrays & Hashing", description: "Manipulating arrays using hash maps for O(1) lookups" },
  { name: "Two Pointers", description: "Using two indices to traverse arrays efficiently" },
  { name: "Sliding Window", description: "Fixed or variable-size window over sequential data" },
  { name: "Stack", description: "LIFO operations for nested/balanced problems" },
  { name: "Binary Search", description: "Divide and conquer on sorted data" },
  { name: "Linked List", description: "Pointer manipulation for node-based structures" },
  { name: "Trees", description: "Recursive traversal and tree properties" },
  { name: "Tries", description: "Prefix trees for string operations" },
  { name: "Heap / Priority Queue", description: "Efficient min/max extraction" },
  { name: "Backtracking", description: "Explore all possibilities with pruning" },
  { name: "Graphs", description: "BFS/DFS traversal and connectivity" },
  { name: "Advanced Graphs", description: "Shortest paths, MST, Union Find" },
  { name: "1-D Dynamic Programming", description: "Optimal substructure in sequences" },
  { name: "2-D Dynamic Programming", description: "Grid and dual-sequence optimization" },
  { name: "Greedy", description: "Locally optimal choices for global optimum" },
  { name: "Intervals", description: "Merging and scheduling overlapping ranges" },
  { name: "Math & Geometry", description: "Number theory and geometric reasoning" },
  { name: "Bit Manipulation", description: "Binary operations for efficient computation" },
];

const CONFIDENCE_LABELS = [
  "Never seen",
  "Vaguely remember",
  "Can solve Easy",
  "Can solve Medium",
  "Confident with Hard",
];

interface DiagnosticProblem {
  pattern_name: string;
  problem: Problem;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  success: boolean;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const currentStep = stepParam === "3" ? 3 : stepParam === "2" ? 2 : 1;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [questionsPerDay, setQuestionsPerDay] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(1.5);
  const [proficiencyLevel, setProficiencyLevel] =
    useState<ProficiencyLevel | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [problemSet, setProblemSet] = useState("neetcode-150");

  // Step 2 state
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [problemCounts, setProblemCounts] = useState<Record<string, number>>({});

  // Step 3 state
  const [diagnosticProblems, setDiagnosticProblems] = useState<DiagnosticProblem[]>([]);
  const [diagnosticIndex, setDiagnosticIndex] = useState(0);
  const [diagnosticLoading, setDiagnosticLoading] = useState(true);
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<ExecutionResult | null>(null);
  const [showScorePanel, setShowScorePanel] = useState(false);
  const [diagnosticSaving, setDiagnosticSaving] = useState(false);

  // Check if already completed onboarding
  useEffect(() => {
    async function checkOnboarding() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    }

    checkOnboarding();
  }, [router]);

  // Load problem counts per category when step 2 is shown
  useEffect(() => {
    if (currentStep !== 2) return;

    async function loadProblemCounts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("problems")
        .select("category");

      if (!data) return;

      const counts: Record<string, number> = {};
      for (const row of data) {
        const cat = row.category as string;
        counts[cat] = (counts[cat] || 0) + 1;
      }
      setProblemCounts(counts);
    }

    loadProblemCounts();
  }, [currentStep]);

  const initCodeForProblem = useCallback((problem: Problem) => {
    const raw = problem.code_snippets["python3"] || "";
    let snippet = raw;
    if (raw) {
      const methodMatch = raw.match(/def (\w+)\(self/);
      const methodName = methodMatch ? methodMatch[1] : "solve";
      snippet = `from typing import List, Optional\nfrom collections import defaultdict, deque\n\n${raw}\n\n# TODO: call your solution\n# print(Solution().${methodName}())`;
    }
    setCode(snippet);
    setRunResult(null);
    setShowScorePanel(false);
  }, []);

  // Load diagnostic problems when step 3 is shown
  useEffect(() => {
    if (currentStep !== 3) return;

    async function loadDiagnosticProblems() {
      setDiagnosticLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch weak patterns from user_pattern_confidence (rated 1-3)
      const { data: confidenceData } = await supabase
        .from("user_pattern_confidence")
        .select("pattern_name, confidence_rating")
        .eq("user_id", user.id)
        .lte("confidence_rating", 3);

      if (!confidenceData || confidenceData.length === 0) {
        // No weak patterns — complete onboarding
        setDiagnosticLoading(false);
        return;
      }

      // Order weak patterns by PATTERN_ORDER
      const patternOrderMap = new Map(PATTERN_ORDER.map((p, i) => [p.name, i]));
      const weakPatternNames = confidenceData
        .map((c) => c.pattern_name)
        .sort((a, b) => (patternOrderMap.get(a) ?? 99) - (patternOrderMap.get(b) ?? 99));

      // For each weak pattern, fetch the first Easy problem by pattern_order
      const problems: DiagnosticProblem[] = [];
      for (const patternName of weakPatternNames) {
        const { data: problemData } = await supabase
          .from("problems")
          .select("*")
          .eq("category", patternName)
          .eq("difficulty", "Easy")
          .not("pattern_order", "is", null)
          .order("pattern_order", { ascending: true })
          .limit(1)
          .single();

        if (problemData) {
          const p: Problem = {
            id: problemData.leetcode_id?.toString() ?? problemData.id,
            title: problemData.title,
            slug: problemData.slug,
            difficulty: problemData.difficulty,
            category: problemData.category,
            is_neetcode150: problemData.is_neetcode150 ?? false,
            is_blind75: problemData.is_blind75 ?? false,
            sheets: problemData.sheets ?? [],
            topics: problemData.topics ?? [],
            description: problemData.description ?? "",
            examples: problemData.examples ?? [],
            constraints: problemData.constraints ?? [],
            hints: problemData.hints ?? [],
            code_snippets: problemData.code_snippets ?? {},
            neetcode_video_id: problemData.neetcode_video_id ?? null,
            neetcode_url: problemData.neetcode_url ?? "",
            leetcode_url: problemData.leetcode_url ?? "",
            pattern_order: problemData.pattern_order ?? null,
          };
          problems.push({ pattern_name: patternName, problem: p });
        }
      }

      setDiagnosticProblems(problems);
      setDiagnosticIndex(0);
      if (problems.length > 0) {
        initCodeForProblem(problems[0].problem);
      }
      setDiagnosticLoading(false);
    }

    loadDiagnosticProblems();
  }, [currentStep, initCodeForProblem]);

  async function handleNextStep1() {
    if (!proficiencyLevel) {
      setError("Please select your proficiency level");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/onboarding/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions_per_day: questionsPerDay,
          hours_per_day: hoursPerDay,
          proficiency_level: proficiencyLevel,
          interview_date: interviewDate || null,
          problem_set: problemSet,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save preferences");
        setSaving(false);
        return;
      }

      setSaving(false);
      router.push("/onboarding?step=2");
    } catch {
      setError("Failed to save preferences");
      setSaving(false);
    }
  }

  async function handleNextStep2() {
    const ratedCount = Object.keys(ratings).length;
    if (ratedCount < 18) {
      setError(`Please rate all 18 patterns (${ratedCount}/18 rated)`);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const ratingsPayload = PATTERN_ORDER.map((p) => ({
        pattern_name: p.name,
        confidence_rating: ratings[p.name],
      }));

      const res = await fetch("/api/onboarding/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings: ratingsPayload }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save ratings");
        setSaving(false);
        return;
      }

      // Check if there are weak patterns (rated 1-3) for diagnostic step
      const weakPatterns = PATTERN_ORDER.filter((p) => ratings[p.name] <= 3);

      if (weakPatterns.length > 0) {
        setSaving(false);
        router.push("/onboarding?step=3");
      } else {
        // No weak patterns — complete onboarding
        const prefRes = await fetch("/api/onboarding/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboarding_completed: true }),
        });

        if (!prefRes.ok) {
          setError("Failed to complete onboarding");
          setSaving(false);
          return;
        }

        setSaving(false);
        router.push("/dashboard");
      }
    } catch {
      setError("Failed to save ratings");
      setSaving(false);
    }
  }

  async function handleRunCode() {
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, input: "", language: "python3" }),
      });
      const data: ExecutionResult = await res.json();
      setRunResult(data);
    } catch {
      setRunResult({
        stdout: "",
        stderr: "Failed to connect to execution server.",
        executionTime: 0,
        success: false,
      });
    } finally {
      setIsRunning(false);
    }
  }

  async function handleDiagnosticScore(score: number) {
    const current = diagnosticProblems[diagnosticIndex];
    if (!current) return;

    setDiagnosticSaving(true);
    setError(null);

    try {
      // Update user_pattern_confidence with diagnostic data
      await fetch("/api/onboarding/diagnostic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern_name: current.pattern_name,
          diagnostic_problem_id: current.problem.slug,
          diagnostic_score: score,
        }),
      });

      // Create a submission entry so the problem enters SRS
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: current.problem.slug,
          performance_score: score,
          code,
          is_self_reported: false,
        }),
      });

      advanceToNext();
    } catch {
      setError("Failed to save diagnostic result");
    } finally {
      setDiagnosticSaving(false);
    }
  }

  async function handleSkipProblem() {
    const current = diagnosticProblems[diagnosticIndex];
    if (!current) return;

    setShowScorePanel(true);
  }

  function advanceToNext() {
    const nextIndex = diagnosticIndex + 1;
    if (nextIndex >= diagnosticProblems.length) {
      // All done — show finish state
      setDiagnosticIndex(nextIndex);
    } else {
      setDiagnosticIndex(nextIndex);
      initCodeForProblem(diagnosticProblems[nextIndex].problem);
    }
  }

  async function handleFinishOnboarding() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: true }),
      });

      if (!res.ok) {
        setError("Failed to complete onboarding");
        setSaving(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Failed to complete onboarding");
      setSaving(false);
    }
  }

  function setPatternRating(patternName: string, rating: number) {
    setRatings((prev) => ({ ...prev, [patternName]: rating }));
    setError(null);
  }

  function getRatingBadgeColor(rating: number): string {
    if (rating <= 2) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (rating === 3) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-400 border-green-500/30";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  const allRated = Object.keys(ratings).length === 18;
  const currentDiagnostic = diagnosticProblems[diagnosticIndex];
  const isLastDiagnostic = diagnosticIndex >= diagnosticProblems.length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
      <div className={`w-full ${currentStep === 3 ? "max-w-4xl" : "max-w-lg"} space-y-6`}>
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-foreground">Algo</span>
            <span className="text-neon-cyan text-glow-cyan">Reps</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {currentStep === 1
              ? "Let\u2019s set up your personalized study plan"
              : currentStep === 2
                ? "Rate your confidence in each pattern"
                : "Quick assessment of your weak patterns"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-1 rounded-full ${currentStep >= 1 ? "bg-neon-cyan" : "bg-[var(--surface-border)]"}`} />
          <div className={`w-8 h-1 rounded-full ${currentStep >= 2 ? "bg-neon-cyan" : "bg-[var(--surface-border)]"}`} />
          <div className={`w-8 h-1 rounded-full ${currentStep >= 3 ? "bg-neon-cyan" : "bg-[var(--surface-border)]"}`} />
        </div>

        {currentStep === 1 && (
          <>
            {/* Step 1: Your Goals */}
            <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Your Goals</h2>

              {/* Questions per day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Questions per day:{" "}
                  <span className="text-neon-cyan">{questionsPerDay}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={questionsPerDay}
                  onChange={(e) => setQuestionsPerDay(Number(e.target.value))}
                  className="w-full accent-[#00e5ff]"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Hours per day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hours per day:{" "}
                  <span className="text-neon-cyan">{hoursPerDay}</span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={4}
                  step={0.5}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full accent-[#00e5ff]"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0.5h</span>
                  <span>4h</span>
                </div>
              </div>

              {/* Proficiency level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proficiency level{" "}
                  <span className="text-red-400 text-xs">(required)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROFICIENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setProficiencyLevel(opt.value);
                        setError(null);
                      }}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        proficiencyLevel === opt.value
                          ? "border-neon-cyan/50 bg-neon-cyan/10 shadow-glow-cyan"
                          : "border-[var(--surface-border)] bg-[var(--background)] hover:border-neon-cyan/30"
                      }`}
                    >
                      <div
                        className={`text-sm font-medium ${
                          proficiencyLevel === opt.value
                            ? "text-neon-cyan"
                            : "text-foreground"
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {opt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview date */}
              <div>
                <label
                  htmlFor="interview-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  When is your interview? (optional)
                </label>
                <input
                  id="interview-date"
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="block w-full rounded-md border border-[var(--surface-border)] bg-[var(--background)] px-3 py-2 text-sm text-foreground focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/50"
                />
              </div>

              {/* Problem set */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Problem set
                </label>
                <div className="flex gap-3">
                  {PROBLEM_SET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProblemSet(opt.value)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                        problemSet === opt.value
                          ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan"
                          : "border-[var(--surface-border)] bg-[var(--background)] text-foreground hover:border-neon-cyan/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-center text-sm text-red-400">{error}</p>
            )}

            {/* Next button */}
            <button
              onClick={handleNextStep1}
              disabled={saving}
              className="w-full rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2.5 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? "Saving..." : "Next \u2192"}
            </button>
          </>
        )}

        {currentStep === 2 && (
          <>
            {/* Step 2: Pattern Assessment */}
            <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Pattern Assessment</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Object.keys(ratings).length}/18 rated
                </span>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {PATTERN_ORDER.map((pattern, idx) => {
                  const rating = ratings[pattern.name];
                  const count = problemCounts[pattern.name] || 0;

                  return (
                    <div
                      key={pattern.name}
                      className={`p-3 rounded-lg border transition-all ${
                        rating
                          ? "border-[var(--surface-border)] bg-[var(--background)]"
                          : "border-[var(--surface-border)] bg-[var(--surface)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {pattern.name}
                            </span>
                            {rating && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded border ${getRatingBadgeColor(rating)}`}
                              >
                                {rating}/5
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-7">
                            {pattern.description}
                            {count > 0 && (
                              <span className="ml-1 text-gray-600 dark:text-gray-500">
                                ({count} problems)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Rating buttons */}
                      <div className="flex gap-1.5 ml-7">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setPatternRating(pattern.name, score)}
                            title={CONFIDENCE_LABELS[score - 1]}
                            className={`w-8 h-8 rounded text-xs font-medium transition-all ${
                              rating === score
                                ? score <= 2
                                  ? "bg-red-500/30 text-red-300 border border-red-500/50"
                                  : score === 3
                                    ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                                    : "bg-green-500/30 text-green-300 border border-green-500/50"
                                : "bg-[var(--surface)] border border-[var(--surface-border)] text-gray-400 hover:border-neon-cyan/30 hover:text-foreground"
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-[var(--surface-border)]">
                <span><span className="text-red-400">1</span> Never seen</span>
                <span><span className="text-red-400">2</span> Vaguely remember</span>
                <span><span className="text-yellow-400">3</span> Can solve Easy</span>
                <span><span className="text-green-400">4</span> Can solve Medium</span>
                <span><span className="text-green-400">5</span> Confident with Hard</span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-center text-sm text-red-400">{error}</p>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/onboarding")}
                className="flex-1 rounded-md border border-[var(--surface-border)] px-4 py-2.5 text-sm font-medium text-foreground hover:bg-[var(--surface)] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleNextStep2}
                disabled={saving || !allRated}
                className="flex-1 rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2.5 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? "Saving..." : "Next \u2192"}
              </button>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            {diagnosticLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400 text-sm">Loading diagnostic problems...</div>
              </div>
            ) : isLastDiagnostic || diagnosticProblems.length === 0 ? (
              /* All diagnostic problems completed */
              <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg p-8 text-center space-y-4">
                <div className="text-4xl">🎯</div>
                <h2 className="text-lg font-semibold text-foreground">Assessment Complete!</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {diagnosticProblems.length > 0
                    ? `You completed ${diagnosticProblems.length} diagnostic problem${diagnosticProblems.length !== 1 ? "s" : ""}. Your personalized study plan is ready.`
                    : "No diagnostic problems needed. Your personalized study plan is ready."}
                </p>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <button
                  onClick={handleFinishOnboarding}
                  disabled={saving}
                  className="rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-6 py-2.5 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? "Finishing..." : "Start Studying →"}
                </button>
              </div>
            ) : currentDiagnostic ? (
              /* Current diagnostic problem */
              <div className="space-y-4">
                {/* Progress indicator */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Quick Assessment</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Problem {diagnosticIndex + 1} of {diagnosticProblems.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-[var(--surface-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-cyan rounded-full transition-all"
                    style={{ width: `${((diagnosticIndex) / diagnosticProblems.length) * 100}%` }}
                  />
                </div>

                {/* Pattern context */}
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
                    {currentDiagnostic.pattern_name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30">
                    {currentDiagnostic.problem.difficulty}
                  </span>
                </div>

                {/* Problem info */}
                <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg p-4 space-y-3 max-h-[30vh] overflow-y-auto">
                  <h3 className="text-sm font-semibold text-foreground">{currentDiagnostic.problem.title}</h3>

                  {currentDiagnostic.problem.description && (
                    <div
                      className="text-xs text-gray-400 leading-relaxed prose prose-invert prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentDiagnostic.problem.description }}
                    />
                  )}

                  {currentDiagnostic.problem.examples.length > 0 && (
                    <div className="space-y-2">
                      {currentDiagnostic.problem.examples.map((ex) => (
                        <div key={ex.example_num} className="bg-[var(--background)] rounded p-2 text-xs font-mono text-gray-300">
                          <div className="text-gray-500 mb-1">Example {ex.example_num}:</div>
                          <pre className="whitespace-pre-wrap">{ex.example_text}</pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentDiagnostic.problem.constraints.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Constraints:</div>
                      <ul className="text-xs text-gray-400 list-disc list-inside space-y-0.5">
                        {currentDiagnostic.problem.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Monaco Editor */}
                <div className="border border-[var(--surface-border)] rounded-lg overflow-hidden">
                  <div className="bg-gray-900 px-3 py-1.5 border-b border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Python 3</span>
                  </div>
                  <MonacoEditor
                    height="200px"
                    language="python"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      wordWrap: "on",
                    }}
                  />
                </div>

                {/* Run button and output */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRunning ? (
                      <>
                        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Running...
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                        Run Code
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSkipProblem}
                    disabled={diagnosticSaving || showScorePanel}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-foreground hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Skip Problem
                  </button>

                  {!showScorePanel && (
                    <button
                      onClick={() => setShowScorePanel(true)}
                      disabled={diagnosticSaving}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Rate & Continue →
                    </button>
                  )}
                </div>

                {/* Run output */}
                {runResult && (
                  <div className={`rounded-lg border p-3 ${runResult.success ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${runResult.success ? "text-green-400" : "text-red-400"}`}>
                        {runResult.success ? "Success" : "Error"}
                      </span>
                      <span className="text-xs text-gray-500">{runResult.executionTime}ms</span>
                    </div>
                    {runResult.stdout && (
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap mt-1">{runResult.stdout}</pre>
                    )}
                    {runResult.stderr && (
                      <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap mt-1">{runResult.stderr}</pre>
                    )}
                    {!runResult.stdout && !runResult.stderr && (
                      <div className="text-xs text-gray-500">No output</div>
                    )}
                  </div>
                )}

                {/* Score panel */}
                {showScorePanel && (
                  <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg p-4 space-y-3">
                    <p className="text-sm text-gray-400">How well did you handle this problem?</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleDiagnosticScore(score)}
                          disabled={diagnosticSaving}
                          className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 ${
                            score <= 2
                              ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : score === 3
                                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                                : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Struggled</span>
                      <span>Nailed it</span>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <p className="text-center text-sm text-red-400">{error}</p>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
