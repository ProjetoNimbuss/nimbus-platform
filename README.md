# 🌧️ RMR Alertas

> Sistema de monitoramento climático e alertas de risco para os 9 municípios da Região Metropolitana do Recife.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![DuckDB](https://img.shields.io/badge/DuckDB-OLAP-yellow)
![Airflow](https://img.shields.io/badge/Airflow-orquestração-017CEE)

---

## O que é o RMR Alertas?

O **RMR Alertas** é um sistema que monitora o risco de chuvas fortes e alagamentos na Região Metropolitana do Recife — município por município, em tempo real.

Em vez de depender de boletins genéricos, o sistema **cruza dados históricos com monitoramento em tempo real**, classifica automaticamente o nível de risco de cada município e disponibiliza essa informação de forma simples numa interface pública.

---

## 🚨 Níveis de Alerta

| Nível       | Cor | Descrição                              |
| ----------- | --- | -------------------------------------- |
| Normal      | 🟢  | Sem risco identificado                 |
| Atenção     | 🟡  | Chuva prevista, monitoramento ativo    |
| Alerta      | 🟠  | Risco elevado de alagamento            |
| Emergência  | 🔴  | Evento extremo em curso                |

---

## O que já funciona

- Coleta de **dados históricos de chuva da APAC** (desde 1961) e **dados em tempo real da rede CEMADEN** (a cada 15 minutos);
- Organização e validação automática dos dados todos os dias;
- Cálculo de indicadores: totais anuais por estação, ranking de eventos extremos e comparativo sazonal por município;
- Avaliação da **confiabilidade de cada estação** de medição;
- **Interface pública** (Next.js) exibindo os níveis de alerta por município.

---

## Como os dados fluem

Os dados passam por três camadas antes de chegar ao usuário:

1. **Bronze — dados brutos.** Coletados exatamente como chegam da fonte: histórico via scraping (Selenium) e tempo real via API (CEMADEN), salvos em arquivos Parquet.
2. **Silver — dados limpos e organizados.** Estações deduplicadas e unificadas, enriquecidas com dados geográficos do IBGE; primeiros indicadores calculados (médias móveis, alertas diários).
3. **Gold — dados prontos para consumo.** Indicadores finais — totais anuais, ranking de eventos extremos, comparativo sazonal e perfil de confiabilidade por estação — que alimentam os alertas, a API e os dashboards.

```
Fontes (APAC · CEMADEN · IBGE)
        │
        ▼
Pipeline de dados  ──  coleta, organiza e valida
(Bronze → Silver → Gold)
        │
        ▼
API FastAPI  ──  disponibiliza os dados processados
        │
        ▼
Interface pública  ──  exibe o nível de alerta por município
```

Esse processo roda em dois ritmos em paralelo:

- **Rotina diária** — reprocessa o histórico e reconstrói as camadas Silver e Gold;
- **Rotina a cada 15 minutos** — atualiza os dados em tempo real da CEMADEN.

Ambas são orquestradas pelo **Airflow**, com testes de qualidade (`dbt test`) a cada execução, garantindo que nenhum dado quebrado chegue ao usuário.

---

## 🏗️ Arquitetura e Stack

### 1. Pipeline de Dados

**Stack:** Apache Airflow (Astro CLI) · DuckDB · dbt · Selenium · Requests · Parquet

#### Fluxo — Dados Históricos (APAC)

```
Airflow DAG  (diária)
│
├─ 1. limpa_parquet      → Remove Parquets do ano corrente
├─ 2. scraping           → Salva Parquet por ano/mesorregião
├─ 3. validacao          → Verifica integridade dos arquivos
├─ 4. ingestao_duckdb    → Carga atômica na tabela bronze.monitoramento_pluviometrico
├─ 5. dbt_run_silver     → Reconstrói silver.mapeamento_estacoes e silver.monitoramento_pluviometrico
├─ 6. dbt_test_silver    → Valida qualidade da camada Silver
├─ 7. dbt_run_gold       → Reconstrói gold.agregados_anuais, ranking_eventos_extremos e comparativo_sazonal
└─ 8. dbt_test_gold      → Valida qualidade da camada Gold
```

#### Fluxo — Dados Real-time (CEMADEN)

```
Airflow DAG  (15 em 15 min)
│
├─ 1. extrair_salvar_raw → Salva Parquet com partição Hive (ano/mes/dia)
└─ 2. atualizar_view     → Atualiza VIEW bronze.apac_15min_bronze (Zero Copy)
```

#### Camadas de dados (Medallion)

| Camada | Localização | Formato | Descrição |
| --- | --- | --- | --- |
| **Bronze (Hist.)** | `bronze.monitoramento_pluviometrico` | DuckDB Table | Dados históricos carregados fisicamente. |
| **Bronze (15min)** | `bronze.apac_15min_bronze` | DuckDB View | View dinâmica sobre os arquivos Parquet da Raw. |
| **Silver** | `silver.mapeamento_estacoes` | DuckDB Table | Cadastro unificado das estações (CEMADEN + IBGE), com lat/lon. |
| **Silver** | `silver.monitoramento_pluviometrico` | DuckDB Table | OBT enriquecida com alertas e médias móveis. |
| **Gold** | `gold.agregados_anuais` | DuckDB Table | Total anual, média histórica, desvio e classificação (Seco/Normal/Chuvoso). |
| **Gold** | `gold.ranking_eventos_extremos` | DuckDB Table | Eventos diários classificados por percentil e severidade. |
| **Gold** | `gold.comparativo_sazonal` | DuckDB View | Comparativo mensal: ano corrente vs média dos últimos 5 anos. |
| **Gold** | `gold.qualidade_estacoes` | DuckDB Table | Score de confiança, % preenchimento e categoria por estação. |

### 2. API (`rmr-api`)

Expõe os dados das tabelas Gold para o frontend e consumidores externos.

**Stack:** Python 3.11+ · FastAPI · DuckDB · Uvicorn

| Endpoint | Descrição | Status |
| --- | --- | --- |
| `GET /api/v1/alertas` | Nível de alerta atual por município | ✅ Ativo |
| `GET /api/v1/grid` | Grade de 48 células com índice de risco | 🔜 Planejado |
| `GET /api/v1/rivers/levels` | Cotas dos rios monitorados | 🔜 Planejado |
| `GET /api/v1/tides/current` | Tábua de marés do Porto do Recife | 🔜 Planejado |

### 3. Frontend (`rmr-web`)

Interface pública com os níveis de alerta por município.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · SWR

---

## 🗺️ Fontes de Dados

| Fonte | Dados | Etapa | Status |
| --- | --- | --- | --- |
| APAC | Histórico pluviométrico (1961→hoje) + tempo real (15min) | 1 | ✅ Em uso |
| CEMADEN | Dados de monitoramento em tempo real | 1 | ✅ Em uso |
| IBGE | Metadados geográficos dos municípios | 1 | ✅ Em uso |
| Open-Meteo Forecast API | Previsão horária de precipitação (7 dias) | 1 | 🔜 Planejada |
| MDT / PE 3D | Altimetria 1m de resolução | 2 | 🔜 Planejada |
| MapBiomas | Uso do solo (impermeabilidade por célula) | 2 | 🔜 Planejada |
| IBGE Setores Censitários | População exposta por célula | 2 | 🔜 Planejada |

---

## 🗂️ Estrutura do Repositório

```
rmr-alertas/
├── rmr-web/                       # Frontend — Next.js (interface pública)
├── rmr-api/                       # Backend — FastAPI
│   └── main.py                    # Endpoints da API
├── dags/
│   ├── pipeline_pepluvi.py        # DAG diária (carga + dbt Silver/Gold)
│   └── pipeline_15min_apac.py     # DAG real-time (15 min)
├── include/
│   ├── config/
│   │   └── settings.py            # Constantes de caminho e URL
│   ├── data/                      # Não versionado (.gitignore)
│   │   ├── raw/                   # Parquets brutos por mesorregião/ano
│   │   └── pepluvi.duckdb         # Banco OLAP local (bronze · silver · gold)
│   └── pipeline/
│       ├── extract/
│       │   ├── scraping_apac.py   # Scraper Selenium → salva Parquet
│       │   ├── dados_15min_apac.py # API CEMADEN → salva Parquet Hive
│       │   ├── ingest_muni_ibge.py # API IBGE → DuckDB
│       │   └── valid_data.py      # Validação dos arquivos
│       └── load/
│           └── ingest_duckdb.py   # ETL Parquet → DuckDB bronze
├── transform/                     # Modelagem dbt (Silver → Gold)
│   ├── dbt_project.yml
│   ├── macros/
│   │   ├── clean_string.sql       # Normalização de strings
│   │   └── percentile_rank.sql    # Encapsula PERCENT_RANK()
│   └── models/
│       ├── bronze/                # Sources e staging IBGE
│       ├── silver/                # Deduplicação, enriquecimento e alertas
│       └── gold/                  # Indicadores finais e qualidade
├── docs/
│   └── runbook.md                 # Guia operacional e resolução de problemas
├── Makefile                       # Atalhos de execução
├── Dockerfile                     # Imagem customizada (Chrome para Selenium)
├── pyproject.toml                 # Dependências e linting (Ruff)
├── requirements.txt
└── .env.example
```

---

## 📄 Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Tokens de coleta
CEMADEN_TOKEN=

# API
API_PORT=8000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Etapa 2+
METABASE_SECRET_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
POSTGRES_URL=
```

---

## 📅 Roadmap

### ✅ Etapa 1 — Pipeline Meteorológico + Interface Base

- [x] Definição de arquitetura
- [x] Pipeline APAC (histórico + real-time a cada 15 min)
- [x] Pipeline CEMADEN
- [x] Camada Silver (dbt)
- [/] Camada Gold (dbt) — em construção
- [x] Interface pública Next.js (níveis de alerta por município)

### 🔄 Etapa 2 — Risco Geoespacial (planejada)

- [ ] API FastAPI com endpoints de grid e alertas
- [ ] Ingestão MDT/PE3D, MapBiomas, IBGE Setores Censitários
- [ ] Joins geoespaciais na camada Silver (DuckDB Spatial)
- [ ] Índice de risco composto por célula (camada Gold)
- [ ] Dashboard para gestão
- [ ] Interface pública: índice de risco + população exposta

### 🔮 Etapa 3 — Nowcasting (futura)

- [ ] Previsão de evolução do risco nos próximos 30 minutos
- [ ] Integração com radar meteorológico e satélite (GOES-16)
- [ ] Modelo de machine learning para classificação de risco
- [ ] Notificações em tempo real

---

## 👥 Time

| Papel | Responsabilidade |
| --- | --- |
| Vinicius Houdini | Engenheiro de Software — API FastAPI, arquitetura, integração |
| Igor Tiburcio | Engenheiro de Dados — Pipeline Airflow, DuckDB, dbt, modelos |

---

## 📚 Referências

- [APAC — Monitoramento Pluviométrico](http://old.apac.pe.gov.br/meteorologia/monitoramento-pluvio.php)
- [DuckDB — Parquet & Hive Partitioning](https://duckdb.org/docs/data/parquet/hive_partitioning)
- [Apache Airflow](https://airflow.apache.org/docs/)
- [dbt — Data Build Tool](https://docs.getdbt.com/)
- [Astronomer (Astro CLI)](https://www.astronomer.io/docs/astro/cli/overview)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/docs)

---

> Desenvolvido para apoiar a gestão e população da Região Metropolitana do Recife.
> Vinicius Houdini · Igor Tiburcio · 2026