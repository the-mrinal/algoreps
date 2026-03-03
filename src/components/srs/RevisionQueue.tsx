"use client";

import { useState } from "react";
import RevisionCard, { type RevisionCardData } from "./RevisionCard";

export type DueRevision = RevisionCardData;

interface RevisionQueueProps {
  dueRevisions: DueRevision[];
}

function RevisionSection({
  label,
  color,
  revisions,
  onRescored,
}: {
  label: string;
  color: "red" | "yellow" | "green";
  revisions: DueRevision[];
  onRescored: (id: string) => void;
}) {
  if (revisions.length === 0) return null;

  const borderColors = {
    red: "border-l-red-500",
    yellow: "border-l-yellow-500",
    green: "border-l-green-500",
  };

  const headerColors = {
    red: "text-red-700 dark:text-red-400",
    yellow: "text-yellow-700 dark:text-yellow-400",
    green: "text-green-700 dark:text-green-400",
  };

  return (
    <div className={`border-l-4 ${borderColors[color]} pl-4`}>
      <h3 className={`text-sm font-semibold ${headerColors[color]} mb-2`}>
        {label} ({revisions.length})
      </h3>
      <div className="space-y-3">
        {revisions.map((rev) => (
          <RevisionCard
            key={rev.id}
            revision={rev}
            onRescored={onRescored}
          />
        ))}
      </div>
    </div>
  );
}

export default function RevisionQueue({ dueRevisions }: RevisionQueueProps) {
  const [rescoredIds, setRescoredIds] = useState<Set<string>>(new Set());

  const handleRescored = (id: string) => {
    setRescoredIds((prev) => new Set(prev).add(id));
  };

  const pendingCount = dueRevisions.length - rescoredIds.size;

  const hard = dueRevisions.filter((r) => r.performance_score <= 2);
  const medium = dueRevisions.filter((r) => r.performance_score === 3);
  const easy = dueRevisions.filter((r) => r.performance_score >= 4);

  if (dueRevisions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">&#10003;</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          You&apos;re all caught up!
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          No revisions due right now. Head to{" "}
          <a
            href="/dashboard/practice"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Practice
          </a>{" "}
          to solve new problems.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          {pendingCount > 0 ? (
            <>
              {pendingCount} revision{pendingCount !== 1 ? "s" : ""} due
              {rescoredIds.size > 0 && (
                <span className="text-sm font-normal ml-2 text-blue-700 dark:text-blue-300">
                  ({rescoredIds.size} reviewed this session)
                </span>
              )}
            </>
          ) : (
            <>All {dueRevisions.length} revisions reviewed!</>
          )}
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
          {pendingCount > 0
            ? "Review these problems to strengthen your retention."
            : "Great work! Refresh the page to see your updated queue."}
        </p>
      </div>

      <div className="space-y-6">
        <RevisionSection
          label="Hard"
          color="red"
          revisions={hard}
          onRescored={handleRescored}
        />
        <RevisionSection
          label="Medium"
          color="yellow"
          revisions={medium}
          onRescored={handleRescored}
        />
        <RevisionSection
          label="Easy"
          color="green"
          revisions={easy}
          onRescored={handleRescored}
        />
      </div>
    </div>
  );
}
