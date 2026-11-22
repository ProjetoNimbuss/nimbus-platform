// ============================================================
// RMR Alertas — Utility Functions
// ============================================================

import { ALERT_PRIORITY, MONTH_ABBR, DAY_ABBR } from "./constants";
import type { AlertLevel } from "./types";

/** Get the highest alert level from a list */
export function getMaxAlertLevel(levels: AlertLevel[]): AlertLevel {
  return levels.reduce((max, level) =>
    ALERT_PRIORITY[level] > ALERT_PRIORITY[max] ? level : max,
    "normal" as AlertLevel
  );
}

/** Format a number with locale-aware separators */
export function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format mm value with unit */
export function formatMM(mm: number | null, decimals = 1): string {
  if (mm === null || mm === undefined) return "—";
  return `${formatNumber(mm, decimals)} mm`;
}

/** Format percentage */
export function formatPct(pct: number | null, decimals = 1): string {
  if (pct === null || pct === undefined) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${formatNumber(pct, decimals)}%`;
}

/** Get current calendar date in America/Recife (UTC-3) consistently across server & client */
export function getRecifeDateParts(date: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === "year")?.value ?? 2026),
    month: Number(parts.find((p) => p.type === "month")?.value ?? 1),
    day: Number(parts.find((p) => p.type === "day")?.value ?? 1),
  };
}

/** Parse YYYY-MM-DD (or ISO date) as a pure calendar date without timezone shift */
function parseCalendarDate(dateStr: string): { year: number; month: number; day: number; utcMs: number; dayOfWeek: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return { year, month, day, utcMs: utcDate.getTime(), dayOfWeek: utcDate.getUTCDay() };
  }
  const { year, month, day } = getRecifeDateParts(new Date(dateStr));
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return { year, month, day, utcMs: utcDate.getTime(), dayOfWeek: utcDate.getUTCDay() };
}

/** Format a date string to PT-BR short format */
export function formatDate(dateStr: string): string {
  const { year, month, day } = parseCalendarDate(dateStr);
  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
}

/** Format a date to relative day (Hoje, Amanhã, day name) */
export function formatRelativeDay(dateStr: string): string {
  const target = parseCalendarDate(dateStr);
  const todayParts = getRecifeDateParts();
  const todayUtcMs = Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day);
  const diffDays = Math.round((target.utcMs - todayUtcMs) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  if (diffDays === -1) return "Ontem";
  if (diffDays > 1 && diffDays < 7) return DAY_ABBR[target.dayOfWeek];
  return formatDate(dateStr);
}

/** Format time from ISO string */
export function formatTime(datetimeStr: string): string {
  const d = new Date(datetimeStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/** Format month number (1-12) to PT-BR abbreviation */
export function formatMonth(month: number): string {
  return MONTH_ABBR[month - 1] || `M${month}`;
}

/** Get time elapsed since a timestamp */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d atrás`;
}

/** Slugify a municipality name */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Clamp a number between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Generate a CSS class string for alert level */
export function alertClass(level: AlertLevel): string {
  const map: Record<AlertLevel, string> = {
    normal: "alert-normal",
    atencao: "alert-atencao",
    alerta: "alert-alerta",
    emergencia: "alert-emergencia",
  };
  return map[level];
}

/** cn - simple classname merger */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
