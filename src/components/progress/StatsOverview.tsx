"use client";

export interface StatsData {
  totalUniqueProblems: number;
  currentStreak: number;
  totalSubmissions: number;
  averageScore: number;
  problemsDueToday: number;
  problemsDueThisWeek: number;
}

interface StatsOverviewProps {
  stats: StatsData;
}

const STAT_CARDS = [
  { key: "totalUniqueProblems" as const, label: "Problems Solved", color: "text-neon-cyan" },
  { key: "currentStreak" as const, label: "Current Streak", color: "text-orange-400" },
  { key: "totalSubmissions" as const, label: "Total Submissions", color: "text-neon-green" },
  { key: "averageScore" as const, label: "Avg Score", color: "text-yellow-400" },
  { key: "problemsDueToday" as const, label: "Due Today", color: "text-red-400" },
  { key: "problemsDueThisWeek" as const, label: "Due This Week", color: "text-neon-purple" },
];

function formatValue(key: keyof StatsData, value: number): string {
  if (key === "currentStreak") {
    return `${value} day${value !== 1 ? "s" : ""}`;
  }
  if (key === "averageScore") {
    return value > 0 ? value.toFixed(1) : "N/A";
  }
  return String(value);
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {STAT_CARDS.map((card) => (
        <div
          key={card.key}
          className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--surface-border)]"
        >
          <div className={`text-2xl font-bold ${card.color}`}>
            {formatValue(card.key, stats[card.key])}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
