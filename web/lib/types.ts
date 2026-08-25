// ============================================================
// RMR Alertas — TypeScript Types
// Based on dbt Gold/Silver layer schemas
// ============================================================

// ---- Alert Levels ----
export type AlertLevel = "normal" | "atencao" | "alerta" | "emergencia";
export type AlertaChuva = "Normal" | "Perigo Potencial" | "Perigo" | "Grande Perigo";
export type PeriodoClima = "Chuvoso" | "Seco" | "Desconhecido";
export type ClassificacaoAno = "Ano Seco" | "Ano Normal" | "Ano Chuvoso";
export type CategoriaQualidade = "alta" | "media" | "baixa";
export type Severidade =
  | "Evento Histórico (top 1%)"
  | "Muito Extremo (top 5%)"
  | "Extremo (top 10%)"
  | "Severo (top 25%)"
  | "Significativo";
export type StatusSazonal =
  | "Sem dados"
  | "Acima do máximo histórico"
  | "Abaixo do mínimo histórico"
  | "Acima da média"
  | "Abaixo da média"
  | "Dentro da normalidade";
export type Mesorregiao =
  | "Metropolitana de Recife"
  | "Zona da Mata"
  | "Agreste"
  | "Sertão do São Francisco"
  | "Sertão";

// ---- Municipality ----
export interface Municipality {
  slug: string;
  nome: string;
  nivel_alerta: AlertLevel;
  precipitacao_24h: number;
  precipitacao_1h: number;
  tendencia: "subindo" | "estavel" | "descendo";
  latitude: number;
  longitude: number;
  estacoes: string[];
  populacao: number;
}

// ---- Station (Silver: mapeamento_estacoes) ----
export interface Station {
  codigo_estacao: string;
  nome_estacao: string;
  municipio: string;
  mesorregiao: Mesorregiao;
  latitude: number;
  longitude: number;
  score_confianca: number;
  categoria_qualidade: CategoriaQualidade;
  total_registros: number;
  registros_validos: number;
  registros_nulos: number;
  estacao_confiavel: boolean;
}

// ---- Monitoring Data (Silver: monitoramento_pluviometrico) ----
export interface MonitoringRecord {
  codigo_estacao: string;
  nome_estacao: string;
  data: string; // ISO date
  ano: number;
  mes: number;
  dia: number;
  municipio: string;
  mesorregiao: Mesorregiao;
  precipitacao_mm: number | null;
  periodo_clima: PeriodoClima;
  alerta_chuva: AlertaChuva;
}

// ---- Annual Aggregates (Gold: agregados_anuais) ----
export interface AnnualAggregate {
  codigo_estacao: string;
  nome_estacao: string;
  municipio: string;
  mesorregiao: Mesorregiao;
  latitude: number;
  longitude: number;
  ano: number;
  total_anual_mm: number;
  dias_com_chuva: number;
  dias_sem_chuva: number;
  max_diario_mm: number;
  media_mensal_mm: number;
  media_historica_anual_mm: number;
  stddev_historico_mm: number;
  desvio_historico_mm: number;
  desvio_historico_pct: number;
  percentil_anual: number;
  classificacao_ano: ClassificacaoAno;
}

// ---- Extreme Events (Gold: ranking_eventos_extremos) ----
export interface ExtremeEvent {
  codigo_estacao: string;
  nome_estacao: string;
  municipio: string;
  mesorregiao: Mesorregiao;
  data: string;
  ano: number;
  mes: number;
  dia: number;
  precipitacao_mm: number;
  alerta_chuva: AlertaChuva;
  periodo_clima: PeriodoClima;
  percentil_estacao: number;
  percentil_mesorregiao: number;
  rank_estacao: number;
  severidade: Severidade;
}

// ---- Seasonal Comparison (Gold: comparativo_sazonal) ----
export interface SeasonalComparison {
  ano_referencia: number;
  mes: number;
  mesorregiao: Mesorregiao;
  precipitacao_ano_atual_mm: number | null;
  dias_ano_atual: number | null;
  media_5anos_mm: number;
  stddev_5anos_mm: number;
  min_5anos_mm: number;
  max_5anos_mm: number;
  anos_contabilizados: number;
  desvio_vs_media_5anos_mm: number | null;
  desvio_vs_media_5anos_pct: number | null;
  status_sazonal: StatusSazonal;
}

// ---- Forecast (Mock) ----
export interface ForecastHour {
  datetime: string; // ISO datetime
  precipitacao_mm: number;
  probabilidade_chuva: number; // 0-100
  temperatura_c: number;
  umidade_pct: number;
  vento_kmh: number;
  municipio: string;
}

export interface ForecastDay {
  data: string;
  municipio: string;
  precipitacao_total_mm: number;
  precipitacao_max_hora_mm: number;
  probabilidade_chuva_max: number;
  nivel_alerta: AlertLevel;
  horas: ForecastHour[];
}

// ---- Flood Points (Mock) ----
export interface FloodPoint {
  id: number;
  nome: string;
  descricao: string;
  latitude: number;
  longitude: number;
  risco: AlertLevel;
  historico_eventos: number;
  ultimo_evento: string;
  municipio: string;
}

// ---- Overview (API response) ----
export interface RegionalOverview {
  nivel_maximo: AlertLevel;
  total_municipios_alerta: number;
  precipitacao_media_24h: number;
  estacoes_ativas: number;
  ultima_atualizacao: string;
  mensagem_alerta: string | null;
}

// ---- Interface Mode ----
export type InterfaceMode = "padrao" | "tecnico";
