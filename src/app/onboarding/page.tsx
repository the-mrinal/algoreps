"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function OnboardingPage() {
  const router = useRouter();
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

  async function handleNext() {
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

      // TODO: Navigate to step 2 (pattern confidence) when US-033 is implemented
      // For now, this completes step 1 and the wizard will be extended
      router.push("/onboarding?step=2");
    } catch {
      setError("Failed to save preferences");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

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
            Let&apos;s set up your personalized study plan
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-1 rounded-full bg-neon-cyan" />
          <div className="w-8 h-1 rounded-full bg-[var(--surface-border)]" />
          <div className="w-8 h-1 rounded-full bg-[var(--surface-border)]" />
        </div>

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
          onClick={handleNext}
          disabled={saving}
          className="w-full rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2.5 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? "Saving..." : "Next →"}
        </button>
      </div>
    </div>
  );
}
