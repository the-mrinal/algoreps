"use client";

import { useState, useEffect } from "react";
import type { Problem } from "@/types";
import type { AttemptState } from "./ProblemBrowser";

const difficultyColors: Record<string, string> = {
  Easy: "bg-neon-green/20 text-neon-green",
  Medium: "bg-yellow-500/20 text-yellow-400",
  Hard: "bg-red-500/20 text-red-400",
};

interface SubmissionRecord {
  id: string;
  performance_score: number;
  created_at: string;
  time_taken_mins: number | null;
  time_taken_seconds: number | null;
  run_count: number | null;
  successful_run_number: number | null;
  manually_solved: boolean | null;
  time_complexity: string | null;
  space_complexity: string | null;
  is_self_reported: boolean;
}

const scoreLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Struggled", color: "text-red-400" },
  2: { label: "Suboptimal", color: "text-orange-400" },
  3: { label: "Acceptable", color: "text-yellow-400" },
  4: { label: "Clean", color: "text-neon-green" },
  5: { label: "Optimal", color: "text-neon-cyan" },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ProblemPane({
  problem,
  attemptState,
  onStartTimer,
  onTick,
}: {
  problem: Problem | null;
  attemptState: AttemptState;
  onStartTimer: () => void;
  onTick: () => void;
}) {
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Timer tick effect
  useEffect(() => {
    if (!attemptState.timerStarted) return;
    const interval = setInterval(onTick, 1000);
    return () => clearInterval(interval);
  }, [attemptState.timerStarted, onTick]);

  useEffect(() => {
    if (!problem) {
      setSubmissions([]);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);

    fetch(`/api/submissions?problem_id=${encodeURIComponent(problem.slug)}&limit=50`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SubmissionRecord[]) => {
        if (!cancelled) setSubmissions(data);
      })
      .catch(() => {
        if (!cancelled) setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [problem]);

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm">Select a problem to begin</p>
        </div>
      </div>
    );
  }

  const toggleHint = (index: number) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Timer display */}
      {attemptState.timerStarted && (
        <div className="flex items-center gap-2 rounded-md bg-neon-cyan/10 border border-neon-cyan/20 px-3 py-2">
          <svg className="h-4 w-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-mono font-bold text-neon-cyan">
            {formatTime(attemptState.timerSeconds)}
          </span>
        </div>
      )}

      {/* Title and badges */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {problem.title}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[problem.difficulty]}`}
          >
            {problem.difficulty}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan font-medium">
            {problem.category}
          </span>
          {problem.topics.map((topic) => (
            <span
              key={topic}
              className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500 dark:text-gray-400 border border-[var(--surface-border)]"
            >
              {topic}
            </span>
          ))}
          {problem.sheets?.map((sheet) => (
            <span
              key={sheet}
              className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple font-medium"
            >
              {sheet}
            </span>
          ))}
        </div>
      </div>

      {/* Start Timer button — shown when timer hasn't started */}
      {!attemptState.timerStarted && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-gray-500">Click below to reveal the problem and start the timer.</p>
          <button
            onClick={onStartTimer}
            className="inline-flex items-center gap-2 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 px-5 py-2.5 text-sm font-semibold text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            Start Timer
          </button>
        </div>
      )}

      {/* Problem content — only shown when timer is running */}
      {attemptState.timerStarted && (
        <>
          {/* Description */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {problem.description}
            </div>
          </div>

          {/* Examples */}
          {problem.examples.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Examples
              </h3>
              {problem.examples.map((example) => (
                <div
                  key={example.example_num}
                  className="rounded-md border border-[var(--surface-border)] bg-[var(--background)] p-3"
                >
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Example {example.example_num}
                  </div>
                  <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">
                    {example.example_text}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Constraints */}
          {problem.constraints.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Constraints
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {problem.constraints.map((constraint, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-600 dark:text-gray-300 font-mono"
                  >
                    {constraint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hints (collapsible) */}
          {problem.hints.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Hints
              </h3>
              <div className="space-y-2">
                {problem.hints.map((hint, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-[var(--surface-border)]"
                  >
                    <button
                      onClick={() => toggleHint(i)}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white/5 flex items-center justify-between"
                    >
                      <span>Hint {i + 1}</span>
                      <svg
                        className={`h-4 w-4 transition-transform ${revealedHints.has(i) ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {revealedHints.has(i) && (
                      <div
                        className="px-3 pb-3 text-sm text-gray-500 dark:text-gray-400"
                        dangerouslySetInnerHTML={{ __html: hint }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* External links */}
      <div className="flex gap-3 pt-2 border-t border-[var(--surface-border)]">
        <a
          href={problem.leetcode_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-400 hover:text-orange-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on LeetCode
        </a>
        {problem.neetcode_video_id && (
          <a
            href={`https://www.youtube.com/watch?v=${problem.neetcode_video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Watch NeetCode Video
          </a>
        )}
      </div>

      {/* Submission History */}
      <div className="border-t border-[var(--surface-border)] pt-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Submission History
          {submissions.length > 0 && (
            <span className="text-xs font-normal text-gray-500">
              ({submissions.length} attempt{submissions.length !== 1 ? "s" : ""})
            </span>
          )}
        </h3>

        {loadingHistory ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading history...
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">
            No attempts yet. Solve this problem to track your progress.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Summary stats */}
            <div className="flex gap-3 text-xs">
              <div className="rounded-md bg-white/5 border border-[var(--surface-border)] px-3 py-2 flex-1 text-center">
                <div className="text-lg font-bold text-foreground">{submissions.length}</div>
                <div className="text-gray-500">Attempts</div>
              </div>
              <div className="rounded-md bg-white/5 border border-[var(--surface-border)] px-3 py-2 flex-1 text-center">
                <div className={`text-lg font-bold ${scoreLabels[Math.max(...submissions.map((s) => s.performance_score))]?.color ?? "text-foreground"}`}>
                  {Math.max(...submissions.map((s) => s.performance_score))}/5
                </div>
                <div className="text-gray-500">Best Score</div>
              </div>
              <div className="rounded-md bg-white/5 border border-[var(--surface-border)] px-3 py-2 flex-1 text-center">
                <div className={`text-lg font-bold ${scoreLabels[submissions[0].performance_score]?.color ?? "text-foreground"}`}>
                  {submissions[0].performance_score}/5
                </div>
                <div className="text-gray-500">Latest</div>
              </div>
            </div>

            {/* Individual attempts */}
            <div className="space-y-1.5">
              {submissions.map((sub, idx) => {
                const date = new Date(sub.created_at);
                const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;
                const score = scoreLabels[sub.performance_score];

                // Format time: prefer time_taken_seconds, fall back to time_taken_mins
                const timeDisplay = sub.time_taken_seconds != null
                  ? formatTime(sub.time_taken_seconds)
                  : sub.time_taken_mins
                    ? `${sub.time_taken_mins}min`
                    : null;

                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-md border border-[var(--surface-border)] bg-white/[0.02] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 w-6 text-right">#{submissions.length - idx}</span>
                      <span className="text-gray-400">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-gray-600">({timeLabel})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {timeDisplay && (
                        <span className="text-gray-500 font-mono">{timeDisplay}</span>
                      )}
                      {sub.run_count != null && sub.run_count > 0 && (
                        <span className="text-gray-500" title={sub.successful_run_number ? `Solved on run #${sub.successful_run_number}` : "No successful run"}>
                          {sub.run_count} run{sub.run_count !== 1 ? "s" : ""}
                          {sub.successful_run_number && (
                            <span className="text-neon-green ml-0.5">(#{sub.successful_run_number})</span>
                          )}
                        </span>
                      )}
                      {sub.manually_solved && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400">
                          Manual
                        </span>
                      )}
                      {sub.time_complexity && (
                        <span className="text-gray-500 font-mono">{sub.time_complexity}</span>
                      )}
                      <span className={`font-medium ${score?.color ?? "text-gray-400"}`}>
                        {sub.performance_score}/5
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${sub.is_self_reported ? "bg-neon-purple/20 text-neon-purple" : "bg-neon-cyan/20 text-neon-cyan"}`}>
                        {sub.is_self_reported ? "Trust" : "Practice"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
