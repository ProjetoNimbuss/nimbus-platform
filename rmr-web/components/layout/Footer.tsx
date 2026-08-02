import { timeAgo } from "@/lib/utils";

export default function Footer() {
  const lastUpdate = new Date().toISOString();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="font-medium text-[var(--color-text-secondary)]">
              Fontes: APAC · CEMADEN · IBGE
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              Atualizado {timeAgo(lastUpdate)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-[var(--color-text-secondary)]">
              RMR Alertas © 2026
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
