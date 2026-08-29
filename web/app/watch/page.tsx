"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { X, CloudRain, AlertTriangle, Wind } from "lucide-react";
import { mockMunicipalities } from "@/lib/mock-data";
import { ALERT_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

const WatchMap = dynamic(() => import("@/components/ui/WatchMap"), { ssr: false });

export default function WatchPage() {
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);

  const selectedMun = mockMunicipalities.find(m => m.slug === selectedMunicipalityId);
  const alertInfo = selectedMun ? ALERT_CONFIG[selectedMun.nivel_alerta] : null;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* Fullscreen Map */}
      <WatchMap 
        onSelectMunicipality={(id) => {
          setSelectedMunicipalityId(id);
          setShowReportModal(false);
        }} 
      />

      {/* Side Panel for Municipality Details */}
      <div 
        className={cn(
          "absolute top-0 right-0 h-full w-full sm:w-[400px] max-w-[100vw] bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-l border-[var(--color-border)] shadow-2xl transition-transform duration-300 ease-in-out z-[400] flex flex-col",
          selectedMunicipalityId ? "translate-x-0" : "translate-x-full"
        )}
      >
        {selectedMun && alertInfo && (
          <>
            <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedMun.nome}</h2>
                <div 
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md mt-2 text-sm font-semibold"
                  style={{
                    backgroundColor: alertInfo.bg,
                    color: alertInfo.color,
                    border: `1px solid ${alertInfo.border}`
                  }}
                >
                  <span className="text-base">{alertInfo.emoji}</span> {alertInfo.label}
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedMunicipalityId(null);
                  setShowReportModal(false);
                }}
                className="p-2 rounded-full hover:bg-[var(--color-bg-surface-alt)] transition-colors text-[var(--color-text-secondary)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Rain Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Precipitação (24h)
                </h3>
                <div className="glass-card p-4 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                    <CloudRain size={24} />
                  </div>
                  <div>
                    <div className="text-3xl font-mono font-bold text-[var(--color-text-primary)]">
                      {selectedMun.precipitacao_24h.toFixed(1)} <span className="text-base text-[var(--color-text-muted)]">mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Informações de Risco
                </h3>
                <div className="space-y-3">
                  <div className="glass-card p-4 text-sm text-[var(--color-text-secondary)] flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} style={{ color: alertInfo.color }} />
                    <p>
                      Baseado na previsão para as próximas 24 horas, há indicação de continuidade do cenário atual. Recomendamos atenção aos comunicados da Defesa Civil.
                    </p>
                  </div>
                  
                  <div className="glass-card p-4 flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Probabilidade de Alagamento</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {selectedMun.nivel_alerta === 'emergencia' ? 'Alta' : selectedMun.nivel_alerta === 'alerta' ? 'Média/Alta' : selectedMun.nivel_alerta === 'atencao' ? 'Baixa/Média' : 'Baixa'}
                    </span>
                  </div>
                  
                  <div className="glass-card p-4 flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Ventos Constantes</span>
                    <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                      <Wind size={16} /> 24 km/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Ação */}
              <button 
                onClick={() => setShowReportModal(true)}
                className="w-full py-3 px-4 rounded-xl font-medium text-white shadow-lg transition-transform hover:-translate-y-0.5 flex justify-center items-center"
                style={{ backgroundColor: alertInfo.color }}
              >
                Ver Relatório Detalhado
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal Relatório Detalhado */}
      {showReportModal && selectedMun && alertInfo && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-bg-primary)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[var(--color-border)]">
            <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-surface)]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">📄</span> Relatório Especial: {selectedMun.nome}
              </h2>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-surface-alt)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div 
                className="p-4 rounded-xl text-sm border font-medium"
                style={{ backgroundColor: alertInfo.bg, borderColor: alertInfo.border, color: alertInfo.color }}
              >
                Status atual: {alertInfo.label.toUpperCase()}. O monitoramento indica tendência de {selectedMun.tendencia} nas próximas horas.
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase mb-1">População Afetada (Estimada)</p>
                  <p className="text-2xl font-bold font-mono">
                    {Math.floor(selectedMun.populacao * (selectedMun.nivel_alerta === 'emergencia' ? 0.3 : 0.05)).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase mb-1">Estações de Monitoramento</p>
                  <p className="text-2xl font-bold font-mono">{selectedMun.estacoes.length}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase mb-1">Pico de Chuva (1h)</p>
                  <p className="text-2xl font-bold font-mono">{selectedMun.precipitacao_1h.toFixed(1)} <span className="text-sm">mm</span></p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase mb-1">Nível Crítico</p>
                  <p className="text-2xl font-bold font-mono">{selectedMun.precipitacao_24h > 50 ? 'Atingido' : 'Normal'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-[var(--color-text-primary)]">Recomendações Técnicas</h3>
                <ul className="list-disc pl-5 text-sm text-[var(--color-text-secondary)] space-y-1">
                  <li>Acionar equipes de prontidão da Defesa Civil Municipal.</li>
                  <li>Monitorar os {selectedMun.estacoes.length} pluviômetros da região constantemente.</li>
                  <li>Preparar abrigos caso a precipitação exceda 100mm/24h.</li>
                  <li>Emitir SMS de alerta para residentes em áreas de encosta.</li>
                </ul>
              </div>
            </div>
            
            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] flex justify-end gap-3">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-alt)] transition-colors"
              >
                Fechar
              </button>
              <button className="px-4 py-2 rounded-lg font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors shadow-md">
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
