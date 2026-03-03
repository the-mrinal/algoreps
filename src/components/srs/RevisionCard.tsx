"use client";

import { useState } from "react";

export interface RevisionCardData {
  id: string;
  problem_id: string;
  performance_score: number;
  created_at: string;
  problem_title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  approach: string | null;
  remarks: string | null;
  code: string | null;
}

interface RevisionCardProps {
  revision: RevisionCardData;
  onRescored: (id: string) => void;
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ScoreBadge({ score }: { score: number }) {
  const colors =
    score <= 2
      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      : score === 3
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors}`}>
      {score}/5
    </span>
  );
}

const SCORE_LABELS: Record<number, string> = {
  1: "Struggled",
  2: "Suboptimal",
  3: "Acceptable",
  4: "Clean",
  5: "Optimal",
};

const SCORE_COLORS: Record<number, string> = {
  1: "bg-red-600 hover:bg-red-700",
  2: "bg-orange-500 hover:bg-orange-600",
  3: "bg-yellow-500 hover:bg-yellow-600",
  4: "bg-blue-500 hover:bg-blue-600",
  5: "bg-green-600 hover:bg-green-700",
};

export default function RevisionCard({ revision, onRescored }: RevisionCardProps) {
  const [showApproach, setShowApproach] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [rescored, setRescored] = useState(false);
  const [newScore, setNewScore] = useState<number | null>(null);

  const days = daysSince(revision.created_at);

  async function handleRescore(score: number) {
    setRescoring(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: revision.id, performance_score: score }),
      });
      if (res.ok) {
        setNewScore(score);
        setRescored(true);
        onRescored(revision.id);
      }
    } finally {
      setRescoring(false);
    }
  }

  if (rescored) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 font-medium text-sm">
              &#10003; Reviewed
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {revision.problem_title}
            </span>
          </div>
          {newScore && <ScoreBadge score={newScore} />}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {revision.problem_title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {revision.category}
              </span>
              {revision.topics.length > 0 && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  {revision.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {topic}
                    </span>
                  ))}
                  {revision.topics.length > 3 && (
                    <span className="text-[10px] text-gray-400">
                      +{revision.topics.length - 3}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 ml-3 shrink-0">
            <ScoreBadge score={revision.performance_score} />
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`}
            </span>
          </div>
        </div>

        {/* Progressive Disclosure Buttons */}
        <div className="flex items-center gap-2 mt-3">
          {revision.approach && (
            <button
              onClick={() => setShowApproach(!showApproach)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                showApproach
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {showApproach ? "Hide" : "Reveal"} Approach
            </button>
          )}
          {revision.remarks && (
            <button
              onClick={() => setShowRemarks(!showRemarks)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                showRemarks
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {showRemarks ? "Hide" : "Reveal"} Remarks
            </button>
          )}
          {revision.code && (
            <button
              onClick={() => setShowCode(!showCode)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                showCode
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {showCode ? "Hide" : "Reveal"} Code
            </button>
          )}
        </div>
      </div>

      {/* Progressive Disclosure Content */}
      {showApproach && revision.approach && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Approach
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {revision.approach}
            </p>
          </div>
        </div>
      )}

      {showRemarks && revision.remarks && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Remarks
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {revision.remarks}
            </p>
          </div>
        </div>
      )}

      {showCode && revision.code && (
        <div className="px-4 pb-3">
          <div className="bg-gray-900 rounded-md p-3 overflow-x-auto">
            <pre className="text-xs text-gray-100 font-mono whitespace-pre">
              {revision.code}
            </pre>
          </div>
        </div>
      )}

      {/* Actions: Practice Again + Quick Re-Score */}
      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <a
            href={`/dashboard/practice?problem=${encodeURIComponent(revision.problem_id)}`}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Practice Again
          </a>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
              Re-score:
            </span>
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => handleRescore(score)}
                disabled={rescoring}
                title={SCORE_LABELS[score]}
                className={`w-7 h-7 rounded text-xs font-medium text-white transition-colors disabled:opacity-50 ${SCORE_COLORS[score]}`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
