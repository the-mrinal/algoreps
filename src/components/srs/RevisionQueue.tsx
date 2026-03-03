"use client";

export interface DueRevision {
  id: string;
  problem_id: string;
  performance_score: number;
  created_at: string;
  problem_title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface RevisionQueueProps {
  dueRevisions: DueRevision[];
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

function RevisionItem({ revision }: { revision: DueRevision }) {
  const days = daysSince(revision.created_at);

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {revision.problem_title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {revision.category}
        </p>
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        <ScoreBadge score={revision.performance_score} />
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`}
        </span>
      </div>
    </div>
  );
}

function RevisionSection({
  label,
  color,
  revisions,
}: {
  label: string;
  color: "red" | "yellow" | "green";
  revisions: DueRevision[];
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
      <div className="space-y-2">
        {revisions.map((rev) => (
          <RevisionItem key={rev.id} revision={rev} />
        ))}
      </div>
    </div>
  );
}

export default function RevisionQueue({ dueRevisions }: RevisionQueueProps) {
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
          {dueRevisions.length} revision{dueRevisions.length !== 1 ? "s" : ""} due
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
          Review these problems to strengthen your retention.
        </p>
      </div>

      <div className="space-y-6">
        <RevisionSection label="Hard" color="red" revisions={hard} />
        <RevisionSection label="Medium" color="yellow" revisions={medium} />
        <RevisionSection label="Easy" color="green" revisions={easy} />
      </div>
    </div>
  );
}
