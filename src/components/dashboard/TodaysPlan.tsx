"use client";

import { useState } from "react";
import type { PlanItem } from "@/types";

interface PlanItemWithTitle extends PlanItem {
  title: string;
}

interface TodaysPlanProps {
  planItems: PlanItemWithTitle[];
  dayNumber: number;
  dateLabel: string;
  currentPattern: string;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Easy: "bg-green-500/20 text-green-400 border-green-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Hard: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border ${colors[difficulty] ?? colors.Medium}`}
    >
      {difficulty}
    </span>
  );
}

function PlanItemCard({
  item,
  checked,
  onToggle,
}: {
  item: PlanItemWithTitle;
  checked: boolean;
  onToggle: () => void;
}) {
  const isCompleted = item.status === "completed" || checked;
  const isSkipped = item.status === "skipped";

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isSkipped
          ? "border-gray-700 bg-gray-800/30 opacity-50"
          : isCompleted
            ? "border-neon-green/30 bg-neon-green/5"
            : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
      }`}
    >
      <button
        onClick={onToggle}
        disabled={isSkipped}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isCompleted
            ? "border-neon-green bg-neon-green/20 text-neon-green"
            : "border-gray-500 hover:border-neon-cyan"
        }`}
      >
        {isCompleted && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={`/dashboard/practice?problem=${item.problem_id}`}
            className={`text-sm font-medium hover:text-neon-cyan transition-colors truncate ${
              isCompleted || isSkipped
                ? "line-through text-gray-500"
                : "text-foreground"
            }`}
          >
            {item.title}
          </a>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{item.category}</span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-500">{item.estimated_minutes}m</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <DifficultyBadge difficulty={item.difficulty} />
        {isSkipped && (
          <span className="text-xs text-gray-500">Skipped</span>
        )}
      </div>
    </div>
  );
}

export default function TodaysPlan({
  planItems,
  dayNumber,
  dateLabel,
  currentPattern,
}: TodaysPlanProps) {
  // Track local check state for optimistic toggling (server-side status takes precedence)
  const [localChecked, setLocalChecked] = useState<Set<string>>(new Set());

  const revisionItems = planItems.filter((item) => item.type === "revision");
  const newItems = planItems.filter((item) => item.type === "new");

  const nonSkipped = planItems.filter((item) => item.status !== "skipped");
  const completedCount = nonSkipped.filter(
    (item) => item.status === "completed" || localChecked.has(item.problem_id)
  ).length;
  const totalNonSkipped = nonSkipped.length;
  const completionPct = totalNonSkipped > 0 ? Math.round((completedCount / totalNonSkipped) * 100) : 0;
  const allDone = totalNonSkipped > 0 && completedCount === totalNonSkipped;

  const estimatedRemaining = nonSkipped
    .filter((item) => item.status !== "completed" && !localChecked.has(item.problem_id))
    .reduce((sum, item) => sum + item.estimated_minutes, 0);

  const handleToggle = (problemId: string) => {
    setLocalChecked((prev) => {
      const next = new Set(prev);
      if (next.has(problemId)) {
        next.delete(problemId);
      } else {
        next.add(problemId);
      }
      return next;
    });
  };

  // Group revisions by score category for colored borders
  const getRevisionColor = (item: PlanItemWithTitle) => {
    // We don't have score in PlanItem, so we use the order (hardest first from generateDailyPlan)
    const idx = revisionItems.indexOf(item);
    const ratio = revisionItems.length > 1 ? idx / (revisionItems.length - 1) : 0;
    if (ratio < 0.33) return "border-l-red-500";
    if (ratio < 0.66) return "border-l-yellow-500";
    return "border-l-neon-green";
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">Today&apos;s Plan</h1>
          <span className="text-sm text-neon-cyan font-medium">Day {dayNumber}</span>
        </div>
        <p className="text-sm text-gray-500">{dateLabel}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
          <span>{completedCount}/{totalNonSkipped} completed</span>
          <span>·</span>
          <span>{estimatedRemaining}m remaining</span>
          <span>·</span>
          <span className="text-neon-purple">{currentPattern}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-800 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-neon-cyan rounded-full transition-all duration-500"
          style={{ width: `${completionPct}%` }}
        />
      </div>

      {/* Celebration */}
      {allDone && (
        <div className="text-center py-8 mb-8 rounded-lg border border-neon-green/30 bg-neon-green/5">
          <div className="text-4xl mb-3">&#10003;</div>
          <h2 className="text-xl font-semibold text-neon-green mb-2">All done for today!</h2>
          <p className="text-gray-400 text-sm">
            Great work. Come back tomorrow for your next plan.
          </p>
        </div>
      )}

      {/* Revisions section */}
      {revisionItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Revisions
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({revisionItems.length})
            </span>
          </h2>
          <div className="space-y-2">
            {revisionItems.map((item) => (
              <div key={item.problem_id} className={`border-l-4 ${getRevisionColor(item)} pl-3`}>
                <PlanItemCard
                  item={item}
                  checked={localChecked.has(item.problem_id)}
                  onToggle={() => handleToggle(item.problem_id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Problems section */}
      {newItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            New Problems
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({newItems.length})
            </span>
          </h2>
          <div className="space-y-2">
            {newItems.map((item) => (
              <PlanItemCard
                key={item.problem_id}
                item={item}
                checked={localChecked.has(item.problem_id)}
                onToggle={() => handleToggle(item.problem_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {planItems.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">No problems for today</h2>
          <p className="text-gray-500">
            Head to{" "}
            <a href="/dashboard/practice" className="text-neon-cyan hover:underline">
              Practice
            </a>{" "}
            to solve problems.
          </p>
        </div>
      )}
    </div>
  );
}
