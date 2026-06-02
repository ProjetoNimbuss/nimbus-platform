"use client";

import type { ForecastDay } from "@/lib/types";
import { ALERT_CONFIG } from "@/lib/constants";
import { formatRelativeDay, formatMM } from "@/lib/utils";

interface ForecastTimelineProps {
  days: ForecastDay[];
}

export default function ForecastTimeline({ days }: ForecastTimelineProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {days.map((day, i) => {
        const config = ALERT_CONFIG[day.nivel_alerta];
        return (
          <div
            key={day.data}
            className="flex-shrink-0 w-[110px] rounded-xl p-3 border text-center transition-all hover:scale-105 cursor-default"
            style={{
              backgroundColor: config.bg,
              borderColor: config.border,
            }}
          >
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
              {formatRelativeDay(day.data)}
            </p>
            <div className="text-2xl mb-1">
              {day.nivel_alerta === "emergencia" ? "⛈️" :
               day.nivel_alerta === "alerta" ? "🌧️" :
               day.nivel_alerta === "atencao" ? "🌦️" : "☀️"}
            </div>
            <p
              className="text-lg font-bold font-[family-name:var(--font-mono)]"
              style={{ color: config.color }}
            >
              {formatMM(day.precipitacao_total_mm, 0)}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              max {formatMM(day.precipitacao_max_hora_mm)}/h
            </p>
            <div className="mt-2">
              <div className="progress-bar" style={{ height: 4 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${day.probabilidade_chuva_max}%`,
                    backgroundColor: config.color,
                  }}
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                {day.probabilidade_chuva_max}% chance
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
