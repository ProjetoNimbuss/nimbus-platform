import type { AlertLevel } from "@/lib/types";
import { ALERT_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AlertBadgeProps {
  level: AlertLevel;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  pulse?: boolean;
  className?: string;
}

export default function AlertBadge({
  level,
  size = "md",
  showIcon = true,
  pulse = false,
  className,
}: AlertBadgeProps) {
  const config = ALERT_CONFIG[level];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full whitespace-nowrap",
        sizeClasses[size],
        pulse && level === "emergencia" && "animate-emergency-pulse",
        className
      )}
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {showIcon && (
        <span className="text-[0.9em]">{config.emoji}</span>
      )}
      {config.label}
    </span>
  );
}
