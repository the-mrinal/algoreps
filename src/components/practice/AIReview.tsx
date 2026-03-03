"use client";

import type { AIReviewResponse } from "@/types";

interface AIReviewProps {
  review: AIReviewResponse | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  isSaving: boolean;
  saveSuccess: { nextRevisionDate: string } | null;
  onSave: () => void;
}

function ScoreIndicator({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`h-3 w-6 rounded-sm ${
            i < score
              ? score <= 2
                ? "bg-red-500"
                : score <= 3
                  ? "bg-yellow-500"
                  : "bg-green-500"
              : "bg-gray-600"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-300">
        {score}/5
      </span>
    </div>
  );
}

function ReviewSection({
  title,
  content,
  icon,
}: {
  title: string;
  content: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <h4 className="text-xs font-semibold text-gray-200">{title}</h4>
      </div>
      <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

export default function AIReview({
  review,
  isAnalyzing,
  analyzeError,
  isSaving,
  saveSuccess,
  onSave,
}: AIReviewProps) {
  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-gray-400">
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Analyzing your code with AI...
      </div>
    );
  }

  if (analyzeError) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-red-800 bg-red-900/30 p-3">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-xs font-medium text-red-400">
              Analysis Failed
            </span>
          </div>
          <p className="mt-1 text-xs text-red-300">{analyzeError}</p>
        </div>
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="p-3 space-y-3">
      {/* Complexity & Score Header */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Time:</span>
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs font-mono text-blue-300">
              {review.time_complexity}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Space:</span>
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs font-mono text-blue-300">
              {review.space_complexity}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1 text-xs text-gray-400">Performance Score</div>
          <ScoreIndicator score={review.performance_score} />
        </div>
      </div>

      {/* Review Sections */}
      <div className="grid grid-cols-2 gap-2">
        <ReviewSection
          title="Code Quality"
          content={review.review.code_quality}
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <ReviewSection
          title="Edge Cases"
          content={review.review.edge_cases}
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
        <ReviewSection
          title="Alternative Approaches"
          content={review.review.alternative_approaches}
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />
        <ReviewSection
          title="Interview Readiness"
          content={review.review.interview_readiness}
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
      </div>

      {/* Save Button / Success Message */}
      {saveSuccess ? (
        <div className="rounded-lg border border-green-800 bg-green-900/30 p-3">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-xs font-medium text-green-400">
              Submission saved!
            </span>
          </div>
          <p className="mt-1 text-xs text-green-300">
            Next revision scheduled for{" "}
            <span className="font-medium">
              {new Date(saveSuccess.nextRevisionDate).toLocaleDateString(
                "en-US",
                { weekday: "short", month: "short", day: "numeric" }
              )}
            </span>
          </p>
        </div>
      ) : (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save &amp; Schedule Revision
            </>
          )}
        </button>
      )}
    </div>
  );
}
