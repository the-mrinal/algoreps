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
      ? "bg-red-500/20 text-red-400"
      : score === 3
        ? "bg-yellow-500/20 text-yellow-400"
        : "bg-neon-green/20 text-neon-green";

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
  4: "bg-neon-cyan/80 hover:bg-neon-cyan/90",
  5: "bg-neon-green/80 hover:bg-neon-green/90",
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
      <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--surface-border)] opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-neon-green font-medium text-sm">
              &#10003; Reviewed
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {revision.problem_title}
            </span>
          </div>
          {newScore && <ScoreBadge score={newScore} />}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--surface-border)] overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {revision.problem_title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {revision.category}
              </span>
              {revision.topics.length > 0 && (
                <>
                  <span className="text-gray-600">|</span>
                  {revision.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-[var(--surface-border)]"
                    >
                      {topic}
                    </span>
                  ))}
                  {revision.topics.length > 3 && (
                    <span className="text-[10px] text-gray-500">
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
                  ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                  : "border-[var(--surface-border)] text-gray-500 hover:text-foreground hover:bg-white/5"
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
                  ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                  : "border-[var(--surface-border)] text-gray-500 hover:text-foreground hover:bg-white/5"
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
                  ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                  : "border-[var(--surface-border)] text-gray-500 hover:text-foreground hover:bg-white/5"
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
          <div className="bg-[var(--background)] rounded-md p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Approach
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {revision.approach}
            </p>
          </div>
        </div>
      )}

      {showRemarks && revision.remarks && (
        <div className="px-4 pb-3">
          <div className="bg-[var(--background)] rounded-md p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Remarks
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
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
      <div className="px-4 pb-4 border-t border-[var(--surface-border)] pt-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <a
            href={`/dashboard/practice?problem=${encodeURIComponent(revision.problem_id)}`}
            className="text-xs px-3 py-1.5 rounded-md border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
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
