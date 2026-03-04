"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

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

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const currentStep = stepParam === "2" ? 2 : 1;

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
        // Navigate to step 3 (diagnostic solve) — implemented in US-034
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

        router.push("/dashboard");
      }
    } catch {
      setError("Failed to save ratings");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-foreground">Algo</span>
            <span className="text-neon-cyan text-glow-cyan">Reps</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {currentStep === 1
              ? "Let\u2019s set up your personalized study plan"
              : "Rate your confidence in each pattern"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-1 rounded-full ${currentStep >= 1 ? "bg-neon-cyan" : "bg-[var(--surface-border)]"}`} />
          <div className={`w-8 h-1 rounded-full ${currentStep >= 2 ? "bg-neon-cyan" : "bg-[var(--surface-border)]"}`} />
          <div className="w-8 h-1 rounded-full bg-[var(--surface-border)]" />
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
                \u2190 Back
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
