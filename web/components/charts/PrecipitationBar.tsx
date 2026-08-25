"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { ALERT_CONFIG } from "@/lib/constants";
import type { AlertLevel } from "@/lib/types";

interface PrecipitationBarProps {
  data: Array<{
    label: string;
    value: number;
    alert?: AlertLevel;
  }>;
  height?: number;
  showGrid?: boolean;
}

function getBarColor(value: number): string {
  if (value >= 50) return ALERT_CONFIG.emergencia.color;
  if (value >= 25) return ALERT_CONFIG.alerta.color;
  if (value >= 10) return ALERT_CONFIG.atencao.color;
  return ALERT_CONFIG.normal.color;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-content">
      <p className="font-medium text-xs text-[var(--color-text-secondary)] mb-1">{label}</p>
      <p className="font-bold font-[family-name:var(--font-mono)] text-sm">
        {payload[0].value.toFixed(1)} mm
      </p>
    </div>
  );
};

export default function PrecipitationBar({ data, height = 240, showGrid = true }: PrecipitationBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
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
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.value)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
