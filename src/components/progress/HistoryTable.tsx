"use client";

import { useState, useMemo } from "react";

export interface HistoryRow {
  id: string;
  problem_id: string;
  created_at: string;
  performance_score: number;
  time_taken_mins: number | null;
  time_complexity: string | null;
  space_complexity: string | null;
  is_self_reported: boolean;
  approach: string | null;
  remarks: string | null;
  ai_review: {
    review?: {
      code_quality?: string;
      edge_cases?: string;
      alternative_approaches?: string;
      interview_readiness?: string;
    };
  } | null;
  problemTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
}

interface HistoryTableProps {
  rows: HistoryRow[];
  categories: string[];
}

type SortField =
  | "created_at"
  | "problemTitle"
  | "difficulty"
  | "performance_score"
  | "time_taken_mins"
  | "time_complexity"
  | "space_complexity";

type SortDir = "asc" | "desc";

const DIFFICULTY_ORDER: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Easy: "bg-neon-green/20 text-neon-green",
    Medium: "bg-yellow-500/20 text-yellow-400",
    Hard: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[difficulty] ?? ""}`}
    >
      {difficulty}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4
      ? "text-neon-green"
      : score === 3
        ? "text-yellow-400"
        : "text-red-400";
  return <span className={`font-semibold ${color}`}>{score}/5</span>;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (field !== sortField) {
    return <span className="text-gray-500 ml-1">&#8597;</span>;
  }
  return (
    <span className="ml-1 text-neon-cyan">{sortDir === "asc" ? "↑" : "↓"}</span>
  );
}

export default function HistoryTable({ rows, categories }: HistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let result = rows;
    if (filterCategory) {
      result = result.filter((r) => r.category === filterCategory);
    }
    if (filterDifficulty) {
      result = result.filter((r) => r.difficulty === filterDifficulty);
    }
    if (filterMinScore > 0) {
      result = result.filter((r) => r.performance_score >= filterMinScore);
    }
    return result;
  }, [rows, filterCategory, filterDifficulty, filterMinScore]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortField) {
        case "created_at":
          return (
            dir *
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime())
          );
        case "problemTitle":
          return dir * a.problemTitle.localeCompare(b.problemTitle);
        case "difficulty":
          return (
            dir *
            ((DIFFICULTY_ORDER[a.difficulty] ?? 0) -
              (DIFFICULTY_ORDER[b.difficulty] ?? 0))
          );
        case "performance_score":
          return dir * (a.performance_score - b.performance_score);
        case "time_taken_mins":
          return dir * ((a.time_taken_mins ?? 0) - (b.time_taken_mins ?? 0));
        case "time_complexity":
          return (
            dir *
            (a.time_complexity ?? "").localeCompare(b.time_complexity ?? "")
          );
        case "space_complexity":
          return (
            dir *
            (a.space_complexity ?? "").localeCompare(b.space_complexity ?? "")
          );
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: { key: SortField; label: string }[] = [
    { key: "created_at", label: "Date" },
    { key: "problemTitle", label: "Problem" },
    { key: "difficulty", label: "Difficulty" },
    { key: "performance_score", label: "Score" },
    { key: "time_taken_mins", label: "Time (min)" },
    { key: "time_complexity", label: "Time Comp." },
    { key: "space_complexity", label: "Space Comp." },
  ];

  if (rows.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface-border)] mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Submission History
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No submissions yet — start practicing to see your history
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface-border)] mt-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Submission History
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(0);
          }}
          className="bg-[var(--background)] border border-[var(--surface-border)] rounded-md px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => {
            setFilterDifficulty(e.target.value);
            setPage(0);
          }}
          className="bg-[var(--background)] border border-[var(--surface-border)] rounded-md px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={filterMinScore}
          onChange={(e) => {
            setFilterMinScore(Number(e.target.value));
            setPage(0);
          }}
          className="bg-[var(--background)] border border-[var(--surface-border)] rounded-md px-3 py-1.5 text-sm text-foreground"
        >
          <option value={0}>Min Score: Any</option>
          <option value={1}>Min Score: 1+</option>
          <option value={2}>Min Score: 2+</option>
          <option value={3}>Min Score: 3+</option>
          <option value={4}>Min Score: 4+</option>
          <option value={5}>Min Score: 5</option>
        </select>

        {(filterCategory || filterDifficulty || filterMinScore > 0) && (
          <button
            onClick={() => {
              setFilterCategory("");
              setFilterDifficulty("");
              setFilterMinScore(0);
              setPage(0);
            }}
            className="text-sm text-neon-cyan hover:text-neon-cyan/80 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-[var(--surface-border)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon
                    field={col.key}
                    sortField={sortField}
                    sortDir={sortDir}
                  />
                </th>
              ))}
              <th className="px-3 py-3 whitespace-nowrap">Track</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <RowWithExpansion
                key={row.id}
                row={row}
                isExpanded={expandedId === row.id}
                onToggle={() =>
                  setExpandedId(expandedId === row.id ? null : row.id)
                }
              />
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
          No submissions match your filters
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--surface-border)]">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm rounded-md bg-[var(--background)] text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 border border-[var(--surface-border)]"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page + 1} of {totalPages} ({sorted.length} results)
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm rounded-md bg-[var(--background)] text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 border border-[var(--surface-border)]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function RowWithExpansion({
  row,
  isExpanded,
  onToggle,
}: {
  row: HistoryRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-[var(--surface-border)] hover:bg-white/[0.02] cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-3 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
          {formatDate(row.created_at)}
        </td>
        <td className="px-3 py-3 text-foreground font-medium max-w-[200px] truncate">
          {row.problemTitle}
        </td>
        <td className="px-3 py-3">
          <DifficultyBadge difficulty={row.difficulty} />
        </td>
        <td className="px-3 py-3">
          <ScoreBadge score={row.performance_score} />
        </td>
        <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
          {row.time_taken_mins != null ? `${row.time_taken_mins}m` : "\u2014"}
        </td>
        <td className="px-3 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
          {row.time_complexity ?? "\u2014"}
        </td>
        <td className="px-3 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
          {row.space_complexity ?? "\u2014"}
        </td>
        <td className="px-3 py-3">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              row.is_self_reported
                ? "bg-neon-purple/20 text-neon-purple"
                : "bg-neon-cyan/20 text-neon-cyan"
            }`}
          >
            {row.is_self_reported ? "Trust" : "Practice"}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-[var(--surface-border)]">
          <td colSpan={8} className="px-3 py-4">
            <ExpandedDetails row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedDetails({ row }: { row: HistoryRow }) {
  const hasApproach = row.approach && row.approach.trim();
  const hasRemarks = row.remarks && row.remarks.trim();
  const hasReview = row.ai_review?.review;

  if (!hasApproach && !hasRemarks && !hasReview) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm italic">
        No additional details for this submission.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hasApproach && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
            Approach
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {row.approach}
          </p>
        </div>
      )}
      {hasRemarks && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
            Remarks
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {row.remarks}
          </p>
        </div>
      )}
      {hasReview && (
        <>
          {row.ai_review!.review!.code_quality && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Code Quality
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {row.ai_review!.review!.code_quality}
              </p>
            </div>
          )}
          {row.ai_review!.review!.edge_cases && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Edge Cases
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {row.ai_review!.review!.edge_cases}
              </p>
            </div>
          )}
          {row.ai_review!.review!.alternative_approaches && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Alternative Approaches
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {row.ai_review!.review!.alternative_approaches}
              </p>
            </div>
          )}
          {row.ai_review!.review!.interview_readiness && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Interview Readiness
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {row.ai_review!.review!.interview_readiness}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
