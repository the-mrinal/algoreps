"use client";

import { useState } from "react";

interface PatternCompleteModalProps {
  patternName: string;
  nextPatternName: string | null;
  problemsSolved: number;
  averageScore: number;
  currentPatternIndex: number;
  isLastPattern: boolean;
  onDismiss: () => void;
}

export default function PatternCompleteModal({
  patternName,
  nextPatternName,
  problemsSolved,
  averageScore,
  currentPatternIndex,
  isLastPattern,
  onDismiss,
}: PatternCompleteModalProps) {
  const [loading, setLoading] = useState(false);

  const handleAdvance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_pattern_index: currentPatternIndex + 1,
        }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-gray-900 border border-neon-green/30 rounded-xl p-8 max-w-md w-full mx-4 shadow-glow-green">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">&#127942;</div>
          <h2 className="text-2xl font-bold text-neon-green mb-1">
            {isLastPattern ? "All Patterns Complete!" : "Pattern Complete!"}
          </h2>
          <p className="text-lg text-foreground">{patternName}</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-cyan">{problemsSolved}</div>
            <div className="text-xs text-gray-500">Problems Solved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-purple">
              {averageScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Avg Score</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isLastPattern ? (
            <button
              onClick={onDismiss}
              className="w-full py-3 px-4 rounded-lg border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan font-medium hover:bg-neon-cyan/20 transition-colors"
            >
              Focus on Weak Areas
            </button>
          ) : (
            <>
              <button
                onClick={handleAdvance}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-neon-green/20 border border-neon-green/50 text-neon-green font-medium hover:bg-neon-green/30 transition-colors disabled:opacity-50"
              >
                {loading
                  ? "Advancing..."
                  : `Move to Next Pattern: ${nextPatternName}`}
              </button>
              <button
                onClick={onDismiss}
                className="w-full py-3 px-4 rounded-lg border border-gray-700 text-gray-400 font-medium hover:bg-gray-800 transition-colors"
              >
                Stay & Reinforce {patternName}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
