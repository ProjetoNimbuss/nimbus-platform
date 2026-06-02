import AlertBanner from "@/components/ui/AlertBanner";
import KPICard from "@/components/ui/KPICard";
import MunicipalityCard from "@/components/ui/MunicipalityCard";
import ForecastTimeline from "@/components/ui/ForecastTimeline";
import { mockMunicipalities, mockOverview, mockForecast } from "@/lib/mock-data";
import { formatMM, getMaxAlertLevel } from "@/lib/utils";

export default function DashboardPage() {
  const overview = mockOverview;
  const municipalities = mockMunicipalities;
  const recifeForecast = mockForecast.find(f => f.municipio === "recife");

  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)]">
      {/* Alert Banner */}
      {overview.mensagem_alerta && (
        <AlertBanner
          level={overview.nivel_maximo}
          message={overview.mensagem_alerta}
          href="/mapa"
        />
      )}

      <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
              Visão Geral — RMR
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Situação atual dos 9 municípios monitorados
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              Próximas 24h (Recife)
            </p>
            {recifeForecast && (
              <ForecastTimeline days={[recifeForecast]} />
            )}
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            label="Nível Máximo de Alerta"
            value={overview.nivel_maximo.toUpperCase()}
            accentColor="var(--color-alert-alerta)"
            className="alert-card"
            style={{
              ["--alert-bg" as string]: "var(--color-alert-alerta-bg)",
              ["--alert-border" as string]: "var(--color-alert-alerta-border)",
            }}
          />
          <KPICard
            label="Municípios em Alerta/Emerg."
            value={String(overview.total_municipios_alerta)}
            unit="/ 9"
            deltaType="negative"
            delta="↑ 2 desde ontem"
          />
          <KPICard
            label="Precipitação Média 24h"
            value={formatMM(overview.precipitacao_media_24h)}
            deltaType="positive"
            delta="+12.4 mm (7 dias)"
          />
          <KPICard
            label="Estações Ativas"
            value={String(overview.estacoes_ativas)}
            unit="online"
            deltaType="neutral"
            delta="98.5% cobertura"
          />
        </div>

        {/* Municipalities Grid */}
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Status por Município
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {municipalities.map((mun, i) => (
            <MunicipalityCard key={mun.slug} municipality={mun} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}