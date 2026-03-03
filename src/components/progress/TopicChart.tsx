"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface TopicData {
  category: string;
  avgScore: number;
  attempts: number;
}

interface TopicChartProps {
  data: TopicData[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TopicData }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-md px-3 py-2 text-sm text-foreground">
      <p className="font-medium">{d.category}</p>
      <p>
        Avg Score: {d.avgScore.toFixed(1)} ({d.attempts} attempt
        {d.attempts !== 1 ? "s" : ""})
      </p>
    </div>
  );
}

export default function TopicChart({ data }: TopicChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface-border)] mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Topic Mastery
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No data yet — start practicing to see your mastery chart
        </p>
      </div>
    );
  }

  // Sort by average score ascending (weakest at top)
  const sorted = [...data].sort((a, b) => a.avgScore - b.avgScore);

  return (
    <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface-border)] mt-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Topic Mastery
      </h2>
      <div style={{ width: "100%", height: sorted.length * 40 + 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
          >
            <XAxis type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
            <YAxis
              type="category"
              dataKey="category"
              width={160}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
              {sorted.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={entry.avgScore < 3 ? "#ef4444" : "#00fff2"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
