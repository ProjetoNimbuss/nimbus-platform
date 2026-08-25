"use client";

import { motion } from "framer-motion";
import { mockAnnualAggregates } from "@/lib/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TecnicoHistoricoPage() {
  // Aggregate data for chart (average per year for simplicity)
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const chartData = years.map(year => {
    const yearData = mockAnnualAggregates.filter(a => a.ano === year);
    const avg = yearData.reduce((acc, curr) => acc + curr.total_anual_mm, 0) / (yearData.length || 1);
    return {
      name: String(year),
      precipitacao: Math.round(avg),
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-[calc(100vh-130px)] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          Histórico Pluviométrico
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Análise de agregados anuais e tendências de longo prazo na RMR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-6 uppercase tracking-wider">Evolução Média Anual (mm)</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-bg-primary)', 
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)'
                  }}
                  itemStyle={{ color: 'var(--color-accent)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="precipitacao" 
                  stroke="var(--color-accent)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--color-bg-primary)', strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 uppercase tracking-wider">Resumo do Período</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Média do Período (7 anos)</p>
              <p className="text-xl font-bold font-mono text-[var(--color-text-primary)]">1.642 mm</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Ano Mais Chuvoso</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">2022 <span className="text-sm font-normal text-[var(--color-text-muted)]">(2.105 mm)</span></p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Ano Mais Seco</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">2024 <span className="text-sm font-normal text-[var(--color-text-muted)]">(1.240 mm)</span></p>
            </div>
            <div className="pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] leading-relaxed">
                A variabilidade pluviométrica na RMR tem aumentado nos últimos anos, com períodos de secas curtas seguidos de eventos extremos de precipitação em curtos espaços de tempo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Table */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Dados Agregados por Estação (2026)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-left">
            <thead>
              <tr>
                <th>Estação</th>
                <th>Município</th>
                <th>Total Anual</th>
                <th>Dias com Chuva</th>
                <th>Máximo Diário</th>
                <th>Classificação</th>
              </tr>
            </thead>
            <tbody>
              {mockAnnualAggregates.filter(a => a.ano === 2026).slice(0, 10).map((agg, idx) => (
                <tr key={idx}>
                  <td className="font-medium text-[var(--color-text-primary)]">{agg.codigo_estacao}</td>
                  <td>{agg.municipio}</td>
                  <td className="font-mono font-semibold">{agg.total_anual_mm} mm</td>
                  <td>{agg.dias_com_chuva}</td>
                  <td className="font-mono text-[var(--color-alert-emergencia)]">{agg.max_diario_mm} mm</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      agg.classificacao_ano === 'Ano Chuvoso' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      agg.classificacao_ano === 'Ano Seco' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {agg.classificacao_ano}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
