"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { CHART_COLORS, MONTH_ABBR } from "@/lib/constants";

interface SeasonalComparisonChartProps {
  data: Array<{
    mes: number;
    atual: number | null;
    media5: number;
  }>;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-content">
      <p className="font-medium text-xs text-[var(--color-text-secondary)] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-xs text-[var(--color-text-muted)]">{p.name}:</span>
          <span className="font-bold font-[family-name:var(--font-mono)] text-sm">
            {p.value !== null ? `${p.value.toFixed(1)} mm` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SeasonalComparisonChart({ data, height = 300 }: SeasonalComparisonChartProps) {
  const chartData = data.map((d) => ({
    label: MONTH_ABBR[d.mes - 1],
    "Ano Atual": d.atual,
    "Média 5 Anos": d.media5,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="Média 5 Anos"
          fill={CHART_COLORS.muted}
          fillOpacity={0.4}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="Ano Atual"
          fill={CHART_COLORS.primary}
          fillOpacity={0.85}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
