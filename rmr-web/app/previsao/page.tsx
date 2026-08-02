"use client";

import { motion } from "framer-motion";
import { mockForecast, mockMunicipalities } from "@/lib/mock-data";
import { formatMM } from "@/lib/utils";
import ForecastTimeline from "@/components/ui/ForecastTimeline";

export default function PrevisaoPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  // Pega a previsão do Recife para mockar os 7 dias
  const forecast = mockForecast.filter(f => f.municipio === "recife");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          Previsão do Tempo (Recife)
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Acompanhe os próximos 7 dias com dados de chuva detalhados.
        </p>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-6 uppercase tracking-wider">Timeline das Próximas Horas</h2>
        {forecast[0] && (
          <ForecastTimeline days={[forecast[0]]} />
        )}
      </div>

      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Próximos Dias</h2>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4"
      >
        {forecast.map((dia, i) => (
          <motion.div 
            key={i} 
            variants={item}
            className="kpi-card flex flex-col items-center justify-center p-4 text-center group"
          >
            <span className="text-sm font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors">
              {new Date(dia.data).toLocaleDateString("pt-BR", { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <div className="my-4 text-4xl">
              {dia.precipitacao_total_mm > 30 ? "⛈️" : dia.precipitacao_total_mm > 10 ? "🌧️" : dia.precipitacao_total_mm > 0 ? "🌦️" : "☀️"}
            </div>
            <span className="text-xl font-bold font-mono text-[var(--color-accent)]">
              {formatMM(dia.precipitacao_total_mm)}
            </span>
            <span className="text-xs font-medium text-[var(--color-text-muted)] mt-1">
              Probabilidade: {dia.probabilidade_chuva_max}%
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
