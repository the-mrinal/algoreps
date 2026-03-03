"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
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
  payload?: { payload: { category: string; avgScore: number; attempts: number; bestScore: number; recentScore: number } }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-md px-3 py-2 text-sm text-foreground shadow-lg">
      <p className="font-medium mb-1">{d.category}</p>
      <p className="text-neon-cyan">Avg: {d.avgScore.toFixed(1)}/5</p>
      <p className="text-gray-400 text-xs mt-0.5">
        {d.attempts} attempt{d.attempts !== 1 ? "s" : ""}
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

  // Sort alphabetically for consistent radar positioning
  const sorted = [...data].sort((a, b) => a.category.localeCompare(b.category));

  // Compute a "strength" metric (capped at 5) based on attempts to show as a second layer
  const chartData = sorted.map((d) => ({
    ...d,
    // Normalize attempts to a 0-5 scale for overlay (log scale, cap at 5)
    attemptScore: Math.min(5, Math.round(Math.log2(d.attempts + 1) * 10) / 10 * 1.5),
  }));

  return (
    <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--surface-border)] mt-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Topic Mastery
      </h2>
      <div style={{ width: "100%", height: Math.max(400, 50 * data.length) }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid
              stroke="rgba(255,255,255,0.1)"
              gridType="circle"
            />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: "rgb(156,163,175)" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 5]}
              tickCount={6}
              tick={{ fontSize: 10, fill: "rgb(107,114,128)" }}
              axisLine={false}
            />
            <Radar
              name="Avg Score"
              dataKey="avgScore"
              stroke="#00fff2"
              fill="#00fff2"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ r: 3, fill: "#00fff2", strokeWidth: 0 }}
            />
            <Radar
              name="Practice Volume"
              dataKey="attemptScore"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.15}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={{ r: 2, fill: "#a855f7", strokeWidth: 0 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "rgb(156,163,175)" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
