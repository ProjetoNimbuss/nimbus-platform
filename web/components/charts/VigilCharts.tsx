"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
interface ChartDataPoint {
  date: string;
  precipitacao: number;
}
interface VigilChartsProps {
  data: ChartDataPoint[];
  period?: number;
}
export default function VigilCharts({ data, period = 7 }: VigilChartsProps) {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Precipitação (Últimos {period} dias)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}mm`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="tooltip-content p-3">
                        <p className="font-semibold mb-1">{label}</p>
                        <p className="text-sm">Precipitação: <span className="font-mono text-[var(--color-accent)]">{dataPoint.precipitacao} mm</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="precipitacao" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
