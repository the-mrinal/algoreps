"use client";

import { useState } from "react";
import type { Problem } from "@/types";

const difficultyColors: Record<string, string> = {
  Easy: "bg-neon-green/20 text-neon-green",
  Medium: "bg-yellow-500/20 text-yellow-400",
  Hard: "bg-red-500/20 text-red-400",
};

export default function ProblemPane({
  problem,
}: {
  problem: Problem | null;
}) {
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());

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
    </div>
  );
}
