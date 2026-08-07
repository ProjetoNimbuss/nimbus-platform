"use client";
import Link from "next/link";
import type { Municipality } from "@/lib/types";
import { ALERT_CONFIG, ALERT_PRIORITY } from "@/lib/constants";
import AlertBadge from "./AlertBadge";
import { formatMM } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { User, Camera, Video, MessageSquare } from "lucide-react";

interface MunicipalityCardProps {
  municipality: Municipality;
  index: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
};

const MOCK_REPORTS = [
  { id: 1, user: "Morador Local", time: "10 min atrás", text: "Rua alagada no centro, impossível passar de carro.", type: "photo" as const },
  { id: 2, user: "Defesa Civil Vol.", time: "25 min atrás", text: "Chuva forte continua. Rio subiu 15cm na última hora.", type: "video" as const },
];

export default function MunicipalityCard({ 
  municipality: m, 
  index, 
  isExpanded = false, 
  onToggle 
}: MunicipalityCardProps) {
  const config = ALERT_CONFIG[m.nivel_alerta];
  const isEmergency = m.nivel_alerta === "emergencia";

  const trendIcon = {
    subindo: "↑",
    estavel: "→",
    descendo: "↓",
  };
  const trendLabel = {
    subindo: "Subindo",
    estavel: "Estável",
    descendo: "Descendo",
  };
  const trendColor = {
    subindo: "#EF4444",
    estavel: "#94A3B8",
    descendo: "#22C55E",
  };

  return (
    <motion.div
      variants={itemVariants}
      layoutId={`card-${m.slug}`}
      whileHover={!isExpanded ? { scale: 1.02, y: -2 } : {}}
      whileTap={!isExpanded ? { scale: 0.98 } : {}}
      className={`h-full block ${isExpanded ? 'lg:col-span-2 row-span-2' : ''}`}
    >
      <div 
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle?.();
          }
        }}
        className="block h-full outline-none rounded-2xl focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] transition-shadow"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`content-${m.slug}`}
        aria-label={`Ver detalhes do município de ${m.nome}`}
      >
        <div
          className={`alert-card p-5 cursor-pointer h-full flex flex-col ${
            isEmergency ? "animate-emergency-pulse ring-1" : ""
          }`}
          style={{
            ["--alert-bg" as string]: config.bg,
            ["--alert-border" as string]: config.border,
            ...(isEmergency ? { "--tw-ring-color": config.border } as React.CSSProperties : {}),
          }}
        >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)] text-[15px] leading-tight">
              {m.nome}
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              {m.estacoes.length} estações
            </p>
          </div>
          <AlertBadge level={m.nivel_alerta} size="sm" pulse={isEmergency} />
        </div>

        {/* Precipitation */}
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Precipitação 24h
              </span>
              <span
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: trendColor[m.tendencia] }}
              >
                <motion.span
                  animate={{ 
                    y: m.tendencia === 'subindo' ? [0, -3, 0] : m.tendencia === 'descendo' ? [0, 3, 0] : 0,
                    x: m.tendencia === 'estavel' ? [0, 2, 0] : 0
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  style={{ display: 'inline-block' }}
                >
                  {trendIcon[m.tendencia]}
                </motion.span>
                {trendLabel[m.tendencia]}
              </span>
            </div>
            <motion.p
              className="text-2xl font-bold font-[family-name:var(--font-mono)] mt-1"
              style={{ color: config.color }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
            >
              {formatMM(m.precipitacao_24h)}
            </motion.p>
          </div>

          {/* Mini progress bar */}
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min((m.precipitacao_24h / 100) * 100, 100)}%`,
                backgroundColor: config.color,
              }}
            />
          </div>

          {/* Last hour */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--color-text-muted)]">Última hora</span>
            <motion.span 
              className="font-medium font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {formatMM(m.precipitacao_1h)}
            </motion.span>
          </div>
        </div>
          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden border-t border-[var(--alert-border)] pt-4 mt-auto"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase">População</span>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{m.populacao.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase">Estações Ativas</span>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{m.estacoes.length}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase">Status Geral</span>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {m.nivel_alerta === 'emergencia' ? 'Áreas de risco crítico sob forte precipitação. Ações de resposta em andamento.' :
                     m.nivel_alerta === 'alerta' ? 'Precipitação intensa detectada. Monitoramento reforçado em áreas baixas.' :
                     m.nivel_alerta === 'atencao' ? 'Chuvas moderadas. Situação sob acompanhamento contínuo.' :
                     'Níveis pluviométricos dentro da normalidade para a região.'}
                  </p>
                </div>

                {/* Community Reports Mock */}
                <div className="mt-6 border-t border-[var(--color-border)] pt-4" id={`content-${m.slug}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={16} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Relatos da Comunidade</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {MOCK_REPORTS.map((report) => (
                      <div key={report.id} className="bg-[var(--color-bg-surface-alt)] p-3 rounded-xl border border-[var(--color-border)]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--color-border)] flex items-center justify-center overflow-hidden" aria-hidden="true">
                            <User size={12} className="text-[var(--color-text-secondary)]" />
                          </div>
                          <span className="text-xs font-semibold text-[var(--color-text-primary)]">{report.user}</span>
                          <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">{report.time}</span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mb-2 leading-relaxed">
                          {report.text}
                        </p>
                        {report.type && (
                          <div className="flex gap-2">
                            <div className="h-16 w-24 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] flex items-center justify-center relative overflow-hidden" aria-label={`Anexo de ${report.type}`}>
                              {report.type === 'photo' ? (
                                <Camera size={16} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                              ) : (
                                <Video size={16} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                              )}
                              <span className="absolute bottom-1 right-1 text-[8px] bg-[var(--color-bg-surface)] px-1 rounded text-[var(--color-text-muted)]">Mock</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
