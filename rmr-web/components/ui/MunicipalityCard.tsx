"use client";
import Link from "next/link";
import type { Municipality } from "@/lib/types";
import { ALERT_CONFIG, ALERT_PRIORITY } from "@/lib/constants";
import AlertBadge from "./AlertBadge";
import { formatMM } from "@/lib/utils";
import { motion } from "framer-motion";

interface MunicipalityCardProps {
  municipality: Municipality;
  index: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
};

export default function MunicipalityCard({ municipality: m, index }: MunicipalityCardProps) {
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
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="h-full block"
    >
      <Link href={`/municipio/${m.slug}`} className="block h-full">
        <div
          className={`alert-card p-5 cursor-pointer h-full ${
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
                {trendIcon[m.tendencia]} {trendLabel[m.tendencia]}
              </span>
            </div>
            <p
              className="text-2xl font-bold font-[family-name:var(--font-mono)] mt-1"
              style={{ color: config.color }}
            >
              {formatMM(m.precipitacao_24h)}
            </p>
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
            <span className="font-medium font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">
              {formatMM(m.precipitacao_1h)}
            </span>
          </div>
        </div>
        </div>
      </Link>
    </motion.div>
  );
}
