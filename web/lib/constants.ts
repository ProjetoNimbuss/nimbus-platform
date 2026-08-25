// ============================================================
// RMR Alertas — Constants
// ============================================================

import type { AlertLevel, Severidade, StatusSazonal } from "./types";

// ---- Alert Colors ----
export const ALERT_CONFIG: Record<AlertLevel, {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  bgSolid: string;
  border: string;
  icon: string;
}> = {
  normal: {
    label: "Normal",
    emoji: "🟢",
    color: "hsl(152, 69%, 31%)",
    bg: "hsla(152, 69%, 31%, 0.12)",
    bgSolid: "hsl(152, 69%, 95%)",
    border: "hsla(152, 69%, 31%, 0.3)",
    icon: "✓",
  },
  atencao: {
    label: "Atenção",
    emoji: "🟡",
    color: "hsl(45, 93%, 47%)",
    bg: "hsla(45, 93%, 47%, 0.12)",
    bgSolid: "hsl(45, 93%, 95%)",
    border: "hsla(45, 93%, 47%, 0.3)",
    icon: "⚠",
  },
  alerta: {
    label: "Alerta",
    emoji: "🟠",
    color: "hsl(25, 95%, 53%)",
    bg: "hsla(25, 95%, 53%, 0.12)",
    bgSolid: "hsl(25, 95%, 95%)",
    border: "hsla(25, 95%, 53%, 0.3)",
    icon: "⚡",
  },
  emergencia: {
    label: "Emergência",
    emoji: "🔴",
    color: "hsl(0, 84%, 60%)",
    bg: "hsla(0, 84%, 60%, 0.12)",
    bgSolid: "hsl(0, 84%, 95%)",
    border: "hsla(0, 84%, 60%, 0.3)",
    icon: "🚨",
  },
};

// ---- Alert Priority (for sorting) ----
export const ALERT_PRIORITY: Record<AlertLevel, number> = {
  emergencia: 4,
  alerta: 3,
  atencao: 2,
  normal: 1,
};

// ---- Severity Colors ----
export const SEVERITY_CONFIG: Record<Severidade, {
  color: string;
  bg: string;
  label: string;
}> = {
  "Evento Histórico (top 1%)": { color: "#EF4444", bg: "rgba(239,68,68,0.12)", label: "Histórico" },
  "Muito Extremo (top 5%)": { color: "#F97316", bg: "rgba(249,115,22,0.12)", label: "Muito Extremo" },
  "Extremo (top 10%)": { color: "#EAB308", bg: "rgba(234,179,8,0.12)", label: "Extremo" },
  "Severo (top 25%)": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", label: "Severo" },
  "Significativo": { color: "#6B7280", bg: "rgba(107,114,128,0.12)", label: "Significativo" },
};

// ---- Seasonal Status Colors ----
export const SEASONAL_CONFIG: Record<StatusSazonal, {
  color: string;
  bg: string;
}> = {
  "Sem dados": { color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  "Acima do máximo histórico": { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  "Abaixo do mínimo histórico": { color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  "Acima da média": { color: "#EAB308", bg: "rgba(234,179,8,0.12)" },
  "Abaixo da média": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  "Dentro da normalidade": { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
};

// ---- Month Names (PT-BR) ----
export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const MONTH_ABBR = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// ---- Day Names (PT-BR) ----
export const DAY_NAMES = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
];
export const DAY_ABBR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ---- RMR Center coordinates ----
export const RMR_CENTER = { lat: -8.0476, lng: -34.877 };
export const RMR_ZOOM = 11;

// ---- Recharts Colors ----
export const CHART_COLORS = {
  primary: "#3B82F6",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  muted: "#475569",
  grid: "rgba(148, 163, 184, 0.1)",
  tooltip_bg: "rgba(15, 23, 42, 0.95)",
};

// ---- Navigation ----
export const NAV_STANDARD = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/previsao", label: "Previsão", icon: "cloud-rain" },
];

export const NAV_TECHNICAL = [
  { href: "/tecnico", label: "Dashboard", icon: "bar-chart" },
  { href: "/tecnico/historico", label: "Histórico", icon: "trending-up" },
  // { href: "/tecnico/extremos", label: "Extremos", icon: "zap" },
  // { href: "/tecnico/sazonal", label: "Sazonal", icon: "calendar" },
];
