"use client";

import { motion } from "framer-motion";
import KPICard from "@/components/ui/KPICard";
import { mockStations, mockOverview } from "@/lib/mock-data";
import { formatMM } from "@/lib/utils";
import AlertBanner from "@/components/ui/AlertBanner";

export default function TecnicoDashboardPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-[calc(100vh-130px)] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          Painel Técnico Integrado
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Visão sistêmica da rede de monitoramento pluviométrico.
        </p>
      </div>

      {mockOverview.mensagem_alerta && (
        <AlertBanner
          level={mockOverview.nivel_maximo}
          message={mockOverview.mensagem_alerta}
        />
      )}

      {/* Global KPIs */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-4"
      >
        <KPICard
          label="Estações Ativas"
          value={String(mockOverview.estacoes_ativas)}
          unit={`/ ${mockStations.length}`}
          deltaType="positive"
          delta="98.5% uptime"
        />
        <KPICard
          label="Estações em Manutenção"
          value="2"
          unit="estações"
          deltaType="negative"
          delta="Problema de conectividade"
        />
        <KPICard
          label="Taxa de Amostragem"
          value="10"
          unit="minutos"
          deltaType="neutral"
          delta="Tempo real"
        />
        <KPICard
          label="Registros Processados"
          value="1.2M"
          unit="últimos 30d"
          deltaType="neutral"
          delta="Zero perdas"
        />
      </motion.div>

      {/* Stations Table */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Diagnóstico de Estações</h2>
          <span className="text-xs font-semibold px-2 py-1 bg-[var(--color-bg-surface-hover)] rounded-md text-[var(--color-text-secondary)] uppercase tracking-wider">Top 10 por Risco</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-left">
            <thead>
              <tr>
                <th>Estação</th>
                <th>Município</th>
                <th>Qualidade do Dado</th>
                <th>Confiabilidade</th>
                <th>Registros (Mês)</th>
              </tr>
            </thead>
            <tbody>
              {mockStations.slice(0, 10).map((station) => (
                <tr key={station.codigo_estacao}>
                  <td className="font-medium text-[var(--color-text-primary)]">
                    {station.codigo_estacao} <span className="text-[var(--color-text-muted)] text-xs ml-1">({station.nome_estacao})</span>
                  </td>
                  <td>{station.municipio}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                      station.categoria_qualidade === 'alta' ? 'bg-[#18794E] text-white dark:bg-green-900/50 dark:text-green-300' :
                      station.categoria_qualidade === 'media' ? 'bg-[#E5A800] text-white dark:bg-yellow-900/50 dark:text-yellow-300' :
                      'bg-[#EF4444] text-white dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {station.categoria_qualidade.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--color-bg-surface-hover)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--color-accent)]" 
                          style={{ width: `${station.score_confianca * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono">{Math.round(station.score_confianca * 100)}%</span>
                    </div>
                  </td>
                  <td className="font-mono">{station.total_registros.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
