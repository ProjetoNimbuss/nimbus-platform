"use client";

import type { AlertLevel } from "@/lib/types";
import { ALERT_CONFIG } from "@/lib/constants";
import Link from "next/link";

interface AlertBannerProps {
  level: AlertLevel;
  message: string;
  municipio?: string;
  href?: string;
}

export default function AlertBanner({ level, message, municipio, href }: AlertBannerProps) {
  if (level === "normal") return null;

  const config = ALERT_CONFIG[level];
  const isEmergency = level === "emergencia";

  const content = (
    <div
      className={`w-full px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium ${
        isEmergency ? "animate-emergency-pulse" : ""
      }`}
      style={{
        backgroundColor: config.bg,
        borderBottom: `2px solid ${config.border}`,
        color: config.color,
      }}
    >
      <span className="text-lg">{isEmergency ? "🚨" : config.emoji}</span>
      <span>
        <strong>{config.label}{municipio ? ` em ${municipio}` : ""}:</strong>{" "}
        {message}
      </span>
      {href && (
        <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
