"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Problem, AIReviewResponse } from "@/types";
import AIReview from "./AIReview";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-gray-900 rounded-t-lg">
      <div className="text-sm text-gray-400">Loading editor...</div>
    </div>
  ),
});

interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  success: boolean;
}

export default function EditorPane({
  problem,
}: {
  problem: Problem | null;
}) {
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // AI Review state
  const [aiReview, setAiReview] = useState<AIReviewResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<{
    nextRevisionDate: string;
  } | null>(null);

  // Pre-populate code when problem changes
  useEffect(() => {
    if (problem) {
      const snippet =
        problem.code_snippets["javascript"] ||
        problem.code_snippets["python3"] ||
        "";
      setCode(snippet);
      setResult(null);
      setInput("");
      setAiReview(null);
      setIsAnalyzing(false);
      setAnalyzeError(null);
      setSaveSuccess(null);
    }
  }, [problem]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, input }),
      });
      const data: ExecutionResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        stdout: "",
        stderr: "Failed to connect to execution server.",
        executionTime: 0,
        success: false,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleAnalyze = async () => {
    if (!problem) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAiReview(null);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          problemTitle: problem.title,
          problemDescription: problem.description,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error || `Analysis failed (${res.status})`
        );
      }

      const review: AIReviewResponse = await res.json();
      setAiReview(review);
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!problem || !aiReview) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: problem.slug,
          code,
          performance_score: aiReview.performance_score,
          time_complexity: aiReview.time_complexity,
          space_complexity: aiReview.space_complexity,
          ai_review: aiReview,
          is_self_reported: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Save failed (${res.status})`);
      }

      const data = await res.json();
      setSaveSuccess({
        nextRevisionDate: data.next_revision_date,
      });
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "Failed to save submission"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">Select a problem to start coding</p>
      </div>
    );
  }

  const borderColor = result
    ? result.success
      ? "border-green-500"
      : "border-red-500"
    : "border-gray-200 dark:border-gray-700";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
          }}
        />
      </div>

      {/* Input + Controls */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-900 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-400">
            Input (stdin)
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? (
                <>
                  <svg
                    className="h-3 w-3 animate-spin"
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
                  Running...
                </>
              ) : (
                <>
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                  </svg>
                  Run Code
                </>
              )}
            </button>
            {result && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <svg
                      className="h-3 w-3 animate-spin"
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Analyze &amp; Score
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter custom input here..."
          rows={2}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Output Panel */}
      {(result || isRunning) && (
        <div
          className={`flex-shrink-0 border-t-2 ${borderColor} bg-gray-900 p-3 max-h-48 overflow-y-auto`}
        >
          {isRunning ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg
                className="h-4 w-4 animate-spin"
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
              Executing code...
            </div>
          ) : result ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${result.success ? "text-green-400" : "text-red-400"}`}
                >
                  {result.success ? "Success" : "Error"}
                </span>
                <span className="text-xs text-gray-500">
                  {result.executionTime}ms
                </span>
              </div>
              {result.stdout && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Output</div>
                  <pre className="rounded bg-gray-800 p-2 text-sm text-gray-200 font-mono whitespace-pre-wrap">
                    {result.stdout}
                  </pre>
                </div>
              )}
              {result.stderr && (
                <div>
                  <div className="text-xs text-red-400 mb-1">Stderr</div>
                  <pre className="rounded bg-gray-800 p-2 text-sm text-red-300 font-mono whitespace-pre-wrap">
                    {result.stderr}
                  </pre>
                </div>
              )}
              {!result.stdout && !result.stderr && (
                <div className="text-xs text-gray-500">No output</div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* AI Review Panel */}
      {(aiReview || isAnalyzing || analyzeError) && (
        <div className="flex-shrink-0 border-t border-gray-700 bg-gray-900 max-h-80 overflow-y-auto">
          <AIReview
            review={aiReview}
            isAnalyzing={isAnalyzing}
            analyzeError={analyzeError}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            onSave={handleSave}
          />
        </div>
      )}
    </div>
  );
}
