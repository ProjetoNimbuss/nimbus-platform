// ============================================================
// RMR Alertas — Mock Data
// Realistic data for the 9 municipalities of RMR
// ============================================================

import type {
  Municipality, Station, MonitoringRecord, AnnualAggregate,
  ExtremeEvent, SeasonalComparison, ForecastDay, ForecastHour,
  FloodPoint, RegionalOverview,
} from "./types";

// ---- Helper: generate dates ----
function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isoDateTime(year: number, month: number, day: number, hour: number): string {
  return `${dateStr(year, month, day)}T${String(hour).padStart(2, "0")}:00:00`;
}

// ---- Regional Overview ----
export const mockOverview: RegionalOverview = {
  nivel_maximo: "alerta",
  total_municipios_alerta: 3,
  precipitacao_media_24h: 28.4,
  estacoes_ativas: 18,
  ultima_atualizacao: new Date().toISOString(),
  mensagem_alerta: "Chuvas moderadas a fortes previstas para os próximos 2 dias na RMR. Evite áreas de alagamento conhecidas.",
};

// ---- 9 Municipalities ----
export const mockMunicipalities: Municipality[] = [
  {
    slug: "recife", nome: "Recife", nivel_alerta: "alerta",
    precipitacao_24h: 45.2, precipitacao_1h: 8.3, tendencia: "subindo",
    latitude: -8.0476, longitude: -34.8770, populacao: 1661681,
    estacoes: ["PE-042", "PE-108", "PE-201", "PE-305"],
  },
  {
    slug: "olinda", nome: "Olinda", nivel_alerta: "atencao",
    precipitacao_24h: 28.6, precipitacao_1h: 4.1, tendencia: "estavel",
    latitude: -7.9907, longitude: -34.8416, populacao: 393115,
    estacoes: ["PE-045", "PE-112"],
  },
  {
    slug: "jaboatao-dos-guararapes", nome: "Jaboatão dos Guararapes", nivel_alerta: "emergencia",
    precipitacao_24h: 72.8, precipitacao_1h: 15.6, tendencia: "subindo",
    latitude: -8.1130, longitude: -35.0156, populacao: 706867,
    estacoes: ["PE-050", "PE-115"],
  },
  {
    slug: "paulista", nome: "Paulista", nivel_alerta: "atencao",
    precipitacao_24h: 22.1, precipitacao_1h: 3.2, tendencia: "descendo",
    latitude: -7.9368, longitude: -34.8736, populacao: 334376,
    estacoes: ["PE-055"],
  },
  {
    slug: "cabo-de-santo-agostinho", nome: "Cabo de Santo Agostinho", nivel_alerta: "alerta",
    precipitacao_24h: 51.3, precipitacao_1h: 11.2, tendencia: "subindo",
    latitude: -8.2836, longitude: -35.0286, populacao: 207048,
    estacoes: ["PE-060", "PE-118"],
  },
  {
    slug: "camaragibe", nome: "Camaragibe", nivel_alerta: "normal",
    precipitacao_24h: 8.4, precipitacao_1h: 1.1, tendencia: "descendo",
    latitude: -8.0205, longitude: -34.9874, populacao: 158899,
    estacoes: ["PE-065"],
  },
  {
    slug: "sao-lourenco-da-mata", nome: "São Lourenço da Mata", nivel_alerta: "normal",
    precipitacao_24h: 5.7, precipitacao_1h: 0.4, tendencia: "estavel",
    latitude: -8.0016, longitude: -35.0390, populacao: 115699,
    estacoes: ["PE-070"],
  },
  {
    slug: "igarassu", nome: "Igarassu", nivel_alerta: "atencao",
    precipitacao_24h: 19.8, precipitacao_1h: 2.8, tendencia: "estavel",
    latitude: -7.8342, longitude: -34.9076, populacao: 117019,
    estacoes: ["PE-075"],
  },
  {
    slug: "abreu-e-lima", nome: "Abreu e Lima", nivel_alerta: "normal",
    precipitacao_24h: 6.2, precipitacao_1h: 0.7, tendencia: "descendo",
    latitude: -7.9059, longitude: -34.8985, populacao: 100802,
    estacoes: ["PE-080"],
  },
];

// ---- Stations ----
export const mockStations: Station[] = [
  { codigo_estacao: "PE-042", nome_estacao: "Alto da Sé", municipio: "Olinda", mesorregiao: "Metropolitana de Recife", latitude: -7.9963, longitude: -34.8556, score_confianca: 0.94, categoria_qualidade: "alta", total_registros: 21900, registros_validos: 20586, registros_nulos: 1314, estacao_confiavel: true },
  { codigo_estacao: "PE-108", nome_estacao: "Várzea", municipio: "Recife", mesorregiao: "Metropolitana de Recife", latitude: -8.0444, longitude: -34.9505, score_confianca: 0.88, categoria_qualidade: "alta", total_registros: 18250, registros_validos: 16060, registros_nulos: 2190, estacao_confiavel: true },
  { codigo_estacao: "PE-201", nome_estacao: "Boa Viagem", municipio: "Recife", mesorregiao: "Metropolitana de Recife", latitude: -8.1175, longitude: -34.9013, score_confianca: 0.91, categoria_qualidade: "alta", total_registros: 15330, registros_validos: 13950, registros_nulos: 1380, estacao_confiavel: true },
  { codigo_estacao: "PE-305", nome_estacao: "Casa Amarela", municipio: "Recife", mesorregiao: "Metropolitana de Recife", latitude: -8.0183, longitude: -34.9163, score_confianca: 0.85, categoria_qualidade: "alta", total_registros: 14600, registros_validos: 12410, registros_nulos: 2190, estacao_confiavel: true },
  { codigo_estacao: "PE-045", nome_estacao: "Bairro Novo", municipio: "Olinda", mesorregiao: "Metropolitana de Recife", latitude: -7.9891, longitude: -34.8370, score_confianca: 0.79, categoria_qualidade: "media", total_registros: 12775, registros_validos: 10092, registros_nulos: 2683, estacao_confiavel: true },
  { codigo_estacao: "PE-112", nome_estacao: "Rio Doce", municipio: "Olinda", mesorregiao: "Metropolitana de Recife", latitude: -7.9674, longitude: -34.8429, score_confianca: 0.72, categoria_qualidade: "media", total_registros: 10950, registros_validos: 7884, registros_nulos: 3066, estacao_confiavel: true },
  { codigo_estacao: "PE-050", nome_estacao: "Prazeres", municipio: "Jaboatão dos Guararapes", mesorregiao: "Metropolitana de Recife", latitude: -8.1553, longitude: -34.9463, score_confianca: 0.90, categoria_qualidade: "alta", total_registros: 19710, registros_validos: 17739, registros_nulos: 1971, estacao_confiavel: true },
  { codigo_estacao: "PE-115", nome_estacao: "Cavaleiro", municipio: "Jaboatão dos Guararapes", mesorregiao: "Metropolitana de Recife", latitude: -8.0888, longitude: -35.0144, score_confianca: 0.66, categoria_qualidade: "media", total_registros: 8760, registros_validos: 5782, registros_nulos: 2978, estacao_confiavel: false },
  { codigo_estacao: "PE-055", nome_estacao: "Maranguape I", municipio: "Paulista", mesorregiao: "Metropolitana de Recife", latitude: -7.9350, longitude: -34.8616, score_confianca: 0.82, categoria_qualidade: "alta", total_registros: 16425, registros_validos: 13468, registros_nulos: 2957, estacao_confiavel: true },
  { codigo_estacao: "PE-060", nome_estacao: "Centro (Cabo)", municipio: "Cabo de Santo Agostinho", mesorregiao: "Metropolitana de Recife", latitude: -8.2880, longitude: -35.0250, score_confianca: 0.87, categoria_qualidade: "alta", total_registros: 17520, registros_validos: 15242, registros_nulos: 2278, estacao_confiavel: true },
  { codigo_estacao: "PE-118", nome_estacao: "Suape", municipio: "Cabo de Santo Agostinho", mesorregiao: "Metropolitana de Recife", latitude: -8.3534, longitude: -34.9701, score_confianca: 0.75, categoria_qualidade: "media", total_registros: 10220, registros_validos: 7665, registros_nulos: 2555, estacao_confiavel: true },
  { codigo_estacao: "PE-065", nome_estacao: "Aldeia", municipio: "Camaragibe", mesorregiao: "Metropolitana de Recife", latitude: -7.9655, longitude: -35.0544, score_confianca: 0.83, categoria_qualidade: "alta", total_registros: 14235, registros_validos: 11814, registros_nulos: 2421, estacao_confiavel: true },
  { codigo_estacao: "PE-070", nome_estacao: "Centro (SLM)", municipio: "São Lourenço da Mata", mesorregiao: "Metropolitana de Recife", latitude: -8.0040, longitude: -35.0410, score_confianca: 0.58, categoria_qualidade: "baixa", total_registros: 7300, registros_validos: 4234, registros_nulos: 3066, estacao_confiavel: false },
  { codigo_estacao: "PE-075", nome_estacao: "Cruz de Rebouças", municipio: "Igarassu", mesorregiao: "Metropolitana de Recife", latitude: -7.8330, longitude: -34.9060, score_confianca: 0.77, categoria_qualidade: "media", total_registros: 11680, registros_validos: 8993, registros_nulos: 2687, estacao_confiavel: true },
  { codigo_estacao: "PE-080", nome_estacao: "Timbó", municipio: "Abreu e Lima", mesorregiao: "Metropolitana de Recife", latitude: -7.9100, longitude: -34.8950, score_confianca: 0.71, categoria_qualidade: "media", total_registros: 9855, registros_validos: 6997, registros_nulos: 2858, estacao_confiavel: true },
];

// ---- Monitoring Records (last 30 days) ----
function generateMonitoringData(): MonitoringRecord[] {
  const records: MonitoringRecord[] = [];
  const now = new Date();
  const alertLevels: Array<{ level: string; threshold: number }> = [
    { level: "Grande Perigo", threshold: 50 },
    { level: "Perigo", threshold: 25 },
    { level: "Perigo Potencial", threshold: 10 },
    { level: "Normal", threshold: 0 },
  ];

  for (const station of mockStations) {
    for (let d = 0; d < 30; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const baseRain = d < 3 ? 20 + Math.random() * 60 : Math.random() * 30;
      const rain = Math.random() > 0.3 ? Math.round(baseRain * 10) / 10 : 0;

      let alerta: "Normal" | "Perigo Potencial" | "Perigo" | "Grande Perigo" = "Normal";
      for (const a of alertLevels) {
        if (rain >= a.threshold) {
          alerta = a.level as typeof alerta;
          break;
        }
      }

      records.push({
        codigo_estacao: station.codigo_estacao,
        nome_estacao: station.nome_estacao,
        data: dateStr(date.getFullYear(), date.getMonth() + 1, date.getDate()),
        ano: date.getFullYear(),
        mes: date.getMonth() + 1,
        dia: date.getDate(),
        municipio: station.municipio,
        mesorregiao: station.mesorregiao,
        precipitacao_mm: rain > 0 ? rain : null,
        periodo_clima: (date.getMonth() + 1) >= 3 && (date.getMonth() + 1) <= 8 ? "Chuvoso" : "Seco",
        alerta_chuva: alerta,
      });
    }
  }
  return records;
}
export const mockMonitoring: MonitoringRecord[] = generateMonitoringData();

// ---- Annual Aggregates ----
function generateAnnualAggregates(): AnnualAggregate[] {
  const aggregates: AnnualAggregate[] = [];
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

  for (const station of mockStations.slice(0, 10)) {
    const baseRain = 1400 + Math.random() * 600;
    for (const year of years) {
      const variation = (Math.random() - 0.5) * 600;
      const total = Math.round(baseRain + variation);
      const historicMean = Math.round(baseRain);
      const stddev = Math.round(150 + Math.random() * 100);
      const deviation = total - historicMean;
      const deviationPct = Math.round((deviation / historicMean) * 1000) / 10;
      const classification =
        total < historicMean - stddev ? "Ano Seco" as const :
        total > historicMean + stddev ? "Ano Chuvoso" as const : "Ano Normal" as const;

      aggregates.push({
        codigo_estacao: station.codigo_estacao,
        nome_estacao: station.nome_estacao,
        municipio: station.municipio,
        mesorregiao: station.mesorregiao,
        latitude: station.latitude,
        longitude: station.longitude,
        ano: year,
        total_anual_mm: total,
        dias_com_chuva: 100 + Math.floor(Math.random() * 80),
        dias_sem_chuva: 365 - (100 + Math.floor(Math.random() * 80)),
        max_diario_mm: Math.round(60 + Math.random() * 100),
        media_mensal_mm: Math.round(total / 12 * 100) / 100,
        media_historica_anual_mm: historicMean,
        stddev_historico_mm: stddev,
        desvio_historico_mm: deviation,
        desvio_historico_pct: deviationPct,
        percentil_anual: Math.round(Math.random() * 100 * 10) / 10,
        classificacao_ano: classification,
      });
    }
  }
  return aggregates;
}
export const mockAnnualAggregates: AnnualAggregate[] = generateAnnualAggregates();

// ---- Extreme Events (Top 50) ----
function generateExtremeEvents(): ExtremeEvent[] {
  const events: ExtremeEvent[] = [];
  const severities: Array<{ sev: ExtremeEvent["severidade"]; min: number; max: number; pctMin: number }> = [
    { sev: "Evento Histórico (top 1%)", min: 120, max: 200, pctMin: 99 },
    { sev: "Muito Extremo (top 5%)", min: 80, max: 120, pctMin: 95 },
    { sev: "Extremo (top 10%)", min: 60, max: 80, pctMin: 90 },
    { sev: "Severo (top 25%)", min: 40, max: 60, pctMin: 75 },
    { sev: "Significativo", min: 20, max: 40, pctMin: 50 },
  ];

  let id = 0;
  for (const sv of severities) {
    const count = sv.sev === "Evento Histórico (top 1%)" ? 5 : sv.sev === "Muito Extremo (top 5%)" ? 8 : 12;
    for (let i = 0; i < count; i++) {
      const station = mockStations[Math.floor(Math.random() * mockStations.length)];
      const year = 2020 + Math.floor(Math.random() * 6);
      const month = 3 + Math.floor(Math.random() * 6); // rainy season
      const day = 1 + Math.floor(Math.random() * 28);
      const rain = Math.round((sv.min + Math.random() * (sv.max - sv.min)) * 10) / 10;

      events.push({
        codigo_estacao: station.codigo_estacao,
        nome_estacao: station.nome_estacao,
        municipio: station.municipio,
        mesorregiao: station.mesorregiao,
        data: dateStr(year, month, day),
        ano: year,
        mes: month,
        dia: day,
        precipitacao_mm: rain,
        alerta_chuva: rain >= 50 ? "Grande Perigo" : rain >= 25 ? "Perigo" : "Perigo Potencial",
        periodo_clima: "Chuvoso",
        percentil_estacao: Math.round((sv.pctMin + Math.random() * (100 - sv.pctMin)) * 100) / 100,
        percentil_mesorregiao: Math.round((sv.pctMin - 5 + Math.random() * (105 - sv.pctMin)) * 100) / 100,
        rank_estacao: id + 1,
        severidade: sv.sev,
      });
      id++;
    }
  }
  return events.sort((a, b) => b.precipitacao_mm - a.precipitacao_mm);
}
export const mockExtremeEvents: ExtremeEvent[] = generateExtremeEvents();

// ---- Seasonal Comparison ----
function generateSeasonalComparison(): SeasonalComparison[] {
  const data: SeasonalComparison[] = [];
  const mesorregioes: SeasonalComparison["mesorregiao"][] = [
    "Metropolitana de Recife", "Zona da Mata", "Agreste",
    "Sertão do São Francisco", "Sertão"
  ];
  const currentMonth = new Date().getMonth() + 1;

  for (const meso of mesorregioes) {
    for (let mes = 1; mes <= 12; mes++) {
      const baseRain = mes >= 3 && mes <= 8 ? 150 + Math.random() * 200 : 30 + Math.random() * 60;
      const media5 = Math.round(baseRain * 10) / 10;
      const stddev = Math.round(baseRain * 0.3 * 10) / 10;
      const min5 = Math.round((baseRain * 0.5) * 10) / 10;
      const max5 = Math.round((baseRain * 1.6) * 10) / 10;
      const atual = mes <= currentMonth ? Math.round((baseRain + (Math.random() - 0.4) * baseRain * 0.8) * 10) / 10 : null;
      const desvioMm = atual !== null ? Math.round((atual - media5) * 10) / 10 : null;
      const desvioPct = atual !== null && media5 > 0 ? Math.round((desvioMm! / media5) * 1000) / 10 : null;

      let status: SeasonalComparison["status_sazonal"] = "Sem dados";
      if (atual !== null) {
        if (atual > max5) status = "Acima do máximo histórico";
        else if (atual < min5) status = "Abaixo do mínimo histórico";
        else if (atual > media5 + stddev) status = "Acima da média";
        else if (atual < media5 - stddev) status = "Abaixo da média";
        else status = "Dentro da normalidade";
      }

      data.push({
        ano_referencia: 2026,
        mes,
        mesorregiao: meso,
        precipitacao_ano_atual_mm: atual,
        dias_ano_atual: atual !== null ? Math.floor(15 + Math.random() * 10) : null,
        media_5anos_mm: media5,
        stddev_5anos_mm: stddev,
        min_5anos_mm: min5,
        max_5anos_mm: max5,
        anos_contabilizados: 5,
        desvio_vs_media_5anos_mm: desvioMm,
        desvio_vs_media_5anos_pct: desvioPct,
        status_sazonal: status,
      });
    }
  }
  return data;
}
export const mockSeasonalComparison: SeasonalComparison[] = generateSeasonalComparison();

// ---- Forecast (7 days) ----
function generateForecast(): ForecastDay[] {
  const days: ForecastDay[] = [];
  const now = new Date();

  for (const mun of mockMunicipalities.slice(0, 3)) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const dayRain = d < 2 ? 30 + Math.random() * 50 : d < 4 ? 10 + Math.random() * 30 : Math.random() * 15;

      const horas: ForecastHour[] = [];
      let maxHourRain = 0;
      let totalRain = 0;

      for (let h = 0; h < 24; h++) {
        const hourRain = h >= 14 && h <= 20
          ? Math.round(dayRain / 6 * (0.5 + Math.random()) * 10) / 10
          : Math.round(Math.random() * 3 * 10) / 10;
        totalRain += hourRain;
        maxHourRain = Math.max(maxHourRain, hourRain);

        horas.push({
          datetime: isoDateTime(date.getFullYear(), date.getMonth() + 1, date.getDate(), h),
          precipitacao_mm: hourRain,
          probabilidade_chuva: Math.min(100, Math.round(hourRain * 8 + Math.random() * 20)),
          temperatura_c: Math.round((24 + Math.sin(h / 24 * Math.PI) * 6) * 10) / 10,
          umidade_pct: Math.round(65 + Math.random() * 30),
          vento_kmh: Math.round(5 + Math.random() * 20),
          municipio: mun.slug,
        });
      }

      const totalRounded = Math.round(totalRain * 10) / 10;
      const nivel = totalRounded >= 60 ? "emergencia" as const
        : totalRounded >= 30 ? "alerta" as const
        : totalRounded >= 15 ? "atencao" as const
        : "normal" as const;

      days.push({
        data: dateStr(date.getFullYear(), date.getMonth() + 1, date.getDate()),
        municipio: mun.slug,
        precipitacao_total_mm: totalRounded,
        precipitacao_max_hora_mm: Math.round(maxHourRain * 10) / 10,
        probabilidade_chuva_max: Math.min(100, Math.round(maxHourRain * 10)),
        nivel_alerta: nivel,
        horas,
      });
    }
  }
  return days;
}
export const mockForecast: ForecastDay[] = generateForecast();

// ---- Flood Points ----
export const mockFloodPoints: FloodPoint[] = [
  { id: 1, nome: "Av. Agamenon Magalhães / Derby", descricao: "Trecho histórico de alagamento junto ao Rio Capibaribe", latitude: -8.0550, longitude: -34.8940, risco: "emergencia", historico_eventos: 47, ultimo_evento: "2026-06-05", municipio: "Recife" },
  { id: 2, nome: "Cais de Santa Rita", descricao: "Área baixa próxima ao porto, afetada por marés altas", latitude: -8.0607, longitude: -34.8715, risco: "alerta", historico_eventos: 32, ultimo_evento: "2026-06-04", municipio: "Recife" },
  { id: 3, nome: "Estrada de Belém / Fundão", descricao: "Bacia do Beberibe — inundação recorrente", latitude: -8.0175, longitude: -34.8881, risco: "alerta", historico_eventos: 38, ultimo_evento: "2026-06-05", municipio: "Recife" },
  { id: 4, nome: "BR-101 / Prazeres", descricao: "Trecho da BR-101 com drenagem insuficiente", latitude: -8.1522, longitude: -34.9398, risco: "emergencia", historico_eventos: 55, ultimo_evento: "2026-06-06", municipio: "Jaboatão dos Guararapes" },
  { id: 5, nome: "Rio Jaboatão / Cavaleiro", descricao: "Margem do Rio Jaboatão, área residencial vulnerável", latitude: -8.0940, longitude: -35.0120, risco: "alerta", historico_eventos: 42, ultimo_evento: "2026-06-05", municipio: "Jaboatão dos Guararapes" },
  { id: 6, nome: "Bairro Novo (Olinda)", descricao: "Planície costeira com drenagem precária", latitude: -7.9881, longitude: -34.8350, risco: "atencao", historico_eventos: 19, ultimo_evento: "2026-05-28", municipio: "Olinda" },
  { id: 7, nome: "Casa Caiada (Olinda)", descricao: "Orla de Olinda, susceptível a ressacas e chuvas", latitude: -7.9757, longitude: -34.8382, risco: "atencao", historico_eventos: 15, ultimo_evento: "2026-05-20", municipio: "Olinda" },
  { id: 8, nome: "Centro do Cabo", descricao: "Centro comercial com galerias pluviais subdimensionadas", latitude: -8.2850, longitude: -35.0240, risco: "alerta", historico_eventos: 28, ultimo_evento: "2026-06-03", municipio: "Cabo de Santo Agostinho" },
  { id: 9, nome: "Av. Getúlio Vargas / Paulista", descricao: "Via principal com alagamento por obstrução de bocas de lobo", latitude: -7.9400, longitude: -34.8700, risco: "atencao", historico_eventos: 12, ultimo_evento: "2026-05-15", municipio: "Paulista" },
  { id: 10, nome: "PE-15 / Abreu e Lima", descricao: "Rodovia com pontos baixos sem drenagem adequada", latitude: -7.9100, longitude: -34.9020, risco: "normal", historico_eventos: 8, ultimo_evento: "2026-04-22", municipio: "Abreu e Lima" },
  { id: 11, nome: "Viaduto da Caxangá", descricao: "Passagem subterrânea que alaga com chuvas intensas", latitude: -8.0377, longitude: -34.9402, risco: "alerta", historico_eventos: 61, ultimo_evento: "2026-06-06", municipio: "Recife" },
  { id: 12, nome: "Av. Recife (Ibura)", descricao: "Avenida de vale com drenagem insuficiente", latitude: -8.1120, longitude: -34.9430, risco: "atencao", historico_eventos: 23, ultimo_evento: "2026-05-30", municipio: "Recife" },
];

// ---- Helper: get municipality data ----
export function getMunicipalityBySlug(slug: string): Municipality | undefined {
  return mockMunicipalities.find((m) => m.slug === slug);
}

export function getStationsByMunicipality(municipio: string): Station[] {
  return mockStations.filter((s) => s.municipio === municipio);
}

export function getMonitoringByStation(codigoEstacao: string, days = 30): MonitoringRecord[] {
  return mockMonitoring
    .filter((m) => m.codigo_estacao === codigoEstacao)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, days);
}

export function getStationById(id: string): Station | undefined {
  return mockStations.find((s) => s.codigo_estacao === id);
}

export function getForecastByMunicipality(slug: string): ForecastDay[] {
  return mockForecast.filter((f) => f.municipio === slug);
}

export function getFloodPointsByMunicipality(municipio: string): FloodPoint[] {
  return mockFloodPoints.filter((f) => f.municipio === municipio);
}
