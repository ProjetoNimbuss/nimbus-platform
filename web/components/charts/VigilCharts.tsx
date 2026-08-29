"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { ALERT_CONFIG } from "@/lib/constants";

interface ChartDataPoint {
  date: string;
  precipitacao: number;
  nivelRisco: "normal" | "atencao" | "alerta" | "emergencia";
  nivelRio: number;
}

interface VigilChartsProps {
  data: ChartDataPoint[];
}

export default function VigilCharts({ data }: VigilChartsProps) {
  return (
    <div className="space-y-6">
      {/* Precipitação (Bar Chart) */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Precipitação e Níveis de Risco (Últimos 7 dias)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748B' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748B' }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}mm`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload as ChartDataPoint;
                    const alertInfo = ALERT_CONFIG[dataPoint.nivelRisco];
                    return (
                      <div className="tooltip-content p-3">
                        <p className="font-semibold mb-1">{label}</p>
                        <p className="text-sm">Precipitação: <span className="font-mono">{dataPoint.precipitacao} mm</span></p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: alertInfo.color }}>
                          <span>{alertInfo.icon}</span> {alertInfo.label.toUpperCase()}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="precipitacao" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ALERT_CONFIG[entry.nivelRisco].color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nível dos Rios (Line Chart) */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Nível dos Rios Monitorados (m)
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748B' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748B' }} 
                axisLine={false}
                tickLine={false}
                domain={[0, 'dataMax + 1']}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="tooltip-content p-3">
                        <p className="font-semibold mb-1">{label}</p>
                        <p className="text-sm">Nível: <span className="font-mono text-[var(--color-accent)]">{payload[0].value} m</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="nivelRio" 
                stroke="var(--color-accent)" 
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-bg-primary)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "var(--color-accent)", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
