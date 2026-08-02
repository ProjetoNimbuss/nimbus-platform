"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KPICardProps {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
  accentColor?: string;
  style?: React.CSSProperties;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function KPICard({
  label,
  value,
  unit,
  delta,
  deltaType = "neutral",
  icon,
  className,
  accentColor,
  style,
}: KPICardProps) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn("kpi-card group", className)} 
      style={style}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="kpi-label">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className="kpi-value"
              style={accentColor ? { color: accentColor } : undefined}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                {unit}
              </span>
            )}
          </div>
          {delta && (
            <p className={cn("kpi-delta", deltaType)}>
              {delta}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity"
            style={{
              backgroundColor: accentColor
                ? `${accentColor}15`
                : "var(--color-bg-surface-alt)",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
