"use client";
import { useState, useEffect } from "react";
import { Filter, Calendar, MapPin } from "lucide-react";
import VigilCharts from "@/components/charts/VigilCharts";
import KPICard from "@/components/ui/KPICard";
import { mockMunicipalities } from "@/lib/mock-data";
const generateMockData = (municipio: string, days: number) => {
  const data = [];
  const today = new Date();
  const basePrecip = (municipio.length * 3) % 15;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const precip = Math.floor(Math.random() * 60) + (i % 3 === 0 ? basePrecip + 20 : 0);
    data.push({
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      precipitacao: precip,
    });
  }
  return data;
};
export default function VigilPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedMun, setSelectedMun] = useState("recife");
  const [period, setPeriod] = useState(7); 
  useEffect(() => {
    setMounted(true);
  }, []);
  const chartData = generateMockData(selectedMun, period);
  const totalPrecip = chartData.reduce((acc, curr) => acc + curr.precipitacao, 0);
  const avgPrecip = totalPrecip / period;
  if (!mounted) {
    return <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">Carregando dados...</div>;
  }
  return (
    <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
            Nimbus Vigil
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            Análise histórica e séries temporais
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass-card flex items-center px-3 py-2 gap-2 text-sm">
            <MapPin size={16} className="text-[var(--color-text-muted)]" />
            <select 
              className="bg-transparent border-none outline-none text-[var(--color-text-primary)] cursor-pointer appearance-none pr-4"
              value={selectedMun}
              onChange={(e) => setSelectedMun(e.target.value)}
            >
              {mockMunicipalities.map(m => (
                <option key={m.slug} value={m.slug} className="bg-[var(--color-bg-primary)]">
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="glass-card flex items-center px-3 py-2 gap-2 text-sm">
            <Calendar size={16} className="text-[var(--color-text-muted)]" />
            <select 
              className="bg-transparent border-none outline-none text-[var(--color-text-primary)] cursor-pointer appearance-none pr-4"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
            >
              <option value={7} className="bg-[var(--color-bg-primary)]">Últimos 7 dias</option>
              <option value={15} className="bg-[var(--color-bg-primary)]">Últimos 15 dias</option>
              <option value={30} className="bg-[var(--color-bg-primary)]">Últimos 30 dias</option>
            </select>
          </div>
          <button className="glass-card p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <KPICard
          label="Total Acumulado (Período)"
          value={totalPrecip.toFixed(1)}
          unit="mm"
          deltaType="neutral"
          delta="Dados baseados no período selecionado"
        />
        <KPICard
          label="Média Diária"
          value={avgPrecip.toFixed(1)}
          unit="mm/dia"
          deltaType="positive"
          delta="↑ 15% comparado ao mês anterior"
        />
      </div>
      <VigilCharts data={chartData} />
    </div>
  );
}
