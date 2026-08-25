"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

interface TimeSeriesLineProps {
  data: Array<{
    label: string;
    value: number;
    avg?: number;
  }>;
  height?: number;
  color?: string;
  showAverage?: boolean;
  unit?: string;
  gradientId?: string;
}

export default function TimeSeriesLine({
  data,
  height = 300,
  color = CHART_COLORS.primary,
  showAverage = false,
  unit = "mm",
  gradientId = "tsGradient",
}: TimeSeriesLineProps) {
  const avgValue = showAverage
    ? data.reduce((sum, d) => sum + d.value, 0) / data.length
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="tooltip-content">
        <p className="font-medium text-xs text-[var(--color-text-secondary)] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-bold font-[family-name:var(--font-mono)] text-sm" style={{ color: p.color }}>
            {p.value.toFixed(1)} {unit}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Tooltip content={<CustomTooltip />} />
        {showAverage && (
          <ReferenceLine
            y={avgValue}
            stroke="var(--color-text-muted)"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: color, fill: "var(--color-bg-surface)" }}
        />
        {data[0]?.avg !== undefined && (
          <Area
            type="monotone"
            dataKey="avg"
            stroke={CHART_COLORS.muted}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="none"
            dot={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
