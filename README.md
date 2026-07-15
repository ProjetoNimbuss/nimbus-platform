# 🌧️ PEPluvi

> Pipeline de dados pluviométricos de Pernambuco — histórico (APAC) e tempo real (CEMADEN).  
> Fonte: [APAC — Agência Pernambucana de Águas e Clima](https://www.apac.pe.gov.br)

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![DuckDB](https://img.shields.io/badge/DuckDB-OLAP-yellow)
![Airflow](https://img.shields.io/badge/Airflow-orquestração-017CEE)

---

## Sobre o projeto

O **PEPluvi** coleta dados de precipitação dos pluviômetros de Pernambuco, integrando dados históricos desde 1961 e monitoramento em tempo real (atualizado a cada 15 minutos).

O pipeline utiliza Selenium para scraping histórico e Requests para consumo de APIs, validando a integridade dos arquivos Parquet e disponibilizando-os via DuckDB em uma arquitetura de medalhão completa (Bronze → Silver → Gold).

---

## O que já funciona

| Etapa | Fluxo | Descrição |
|---|---|---|
| **Scraping Histórico** | `scraping_apac.py` | Coleta automatizada (Selenium) por mesorregião/ano. Salva em **Parquet**. |
| **API Real-time** | `pipeline_api_cemaden.py` | Coleta dados CEMADEN a cada 15 min. Salva em **Parquet (Hive)**. |
| **Ingestão IBGE** | `ingest_muni.py` | Carga de metadados geográficos dos municípios. |
| **Ingestão Bronze** | `ingest_duckdb.py` | Carga física dos dados históricos no DuckDB. |
| **View Bronze** | `bronze.data_cemaden` | **VIEW dinâmica** Zero-Copy sobre os Parquets da Raw. |
| **Silver Histórica** | `dbt run --select silver` | Deduplicação de estações, join IBGE, enriquecimento espacial e métricas sazonais. |
| **Silver Real-time** | `data_cemaden_silver` | Deduplicação e enriquecimento dimensional dos dados de 15 min do CEMADEN. |
| **Gold Histórica** | `dbt run --select gold` | KPIs anuais, ranking de eventos extremos, comparativo sazonal e perfil de qualidade. |
| **Gold Real-time** | `data_cemaden_leituras_15min` | Série temporal completa das leituras de 15 min, desnormalizada, incremental. |
| **Gold Acumulados** | `data_cemaden_acumulados` | Acumulados móveis de chuva: 15min, 1h, 3h, 6h, 12h e 24h por estação. |
| **Qualidade de Dados** | `dbt test` | Testes de integridade: unicidade, not_null, ranges, ordenação temporal e hierarquia de janelas. |
| **Orquestração** | Airflow | DAG diária (APAC) e a cada 15 min (CEMADEN), executando Bronze → Silver → Gold automaticamente. |

---

## Arquitetura do pipeline

### 1. Dados Históricos (APAC)
```
Airflow DAG (diária — 06h UTC)
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

### 2. Dados Real-time (CEMADEN)
```
Airflow DAG (a cada 15 min)
│
├─ 1. extrair_salvar_raw → Busca dados na API e salva Parquet com partição Hive (ano/mes/dia)
├─ 2. atualizar_view     → Recria VIEW bronze.data_cemaden apontando para os Parquets
├─ 3. dbt_run_cemaden    → Executa toda a linhagem (tag:cemaden): Bronze → Silver → Gold
└─ 4. dbt_test_cemaden   → Valida qualidade de toda a linhagem CEMADEN
```

---

## Camada de dados (Medallion)

### Fluxo Histórico (APAC)

| Camada | Localização | Formato | Descrição |
|---|---|---|---|
| **Raw** | `include/data/raw/*.parquet` | Parquet | Arquivos brutos por ano/mesorregião. |
| **Bronze** | `bronze.monitoramento_pluviometrico` | DuckDB Table | Dados históricos carregados fisicamente. |
| **Silver** | `silver.mapeamento_estacoes` | DuckDB Table | Dimensão de estações deduplicadas (APAC + IBGE), com lat/lon. |
| **Silver** | `silver.monitoramento_pluviometrico` | DuckDB Table | OBT enriquecida: `codigo_estacao`, `precipitacao_mm`, `mesorregiao`, alertas e médias móveis. |
| **Gold** | `gold.agregados_anuais` | DuckDB Table | Total anual, média histórica, desvio e classificação do ano (Seco/Normal/Chuvoso). |
| **Gold** | `gold.ranking_eventos_extremos` | DuckDB Table | Eventos diários classificados por percentil e severidade. |
| **Gold** | `gold.comparativo_sazonal` | DuckDB View | Comparativo mensal: ano corrente vs média dos últimos 5 anos, por mesorregião. |
| **Gold** | `gold.qualidade_estacoes` | DuckDB Table | Score de confiança, % preenchimento, % nulos e categoria por estação. |

### Fluxo Real-time (CEMADEN)

| Camada | Localização | Formato | Descrição |
|---|---|---|---|
| **Raw** | `include/data/raw/api_cemaden/` | Parquet | Particionamento Hive: `ano=Y/mes=M/dia=D/HH-MM-SS.parquet`. Event-time partitioning. |
| **Bronze** | `bronze.data_cemaden` | DuckDB View | View Zero-Copy dinâmica sobre os Parquets da Raw. |
| **Silver** | `silver.data_cemaden_silver` | DuckDB Table | Leituras deduplicadas e enriquecidas dimensionalmente (nome, município, lat/lon, IBGE). |
| **Gold** | `gold.data_cemaden_leituras_15min` | DuckDB Table | Série temporal completa desnormalizada. Incremental com lookback de 24h (late data). |
| **Gold** | `gold.data_cemaden_acumulados` | DuckDB Table | Acumulados móveis por janela (15min/1h/3h/6h/12h/24h). Incremental com lookback de 24h. |

---

## Setup

### Pré-requisitos

- Python 3.11+
- [Astro CLI](https://www.astronomer.io/docs/astro/cli/install-cli) (para Airflow local)
- Docker
- Google Chrome (para o Selenium no scraping histórico)

### Instalação

```bash
# Clone e entre no projeto
git clone https://github.com/IgorTiburcio81/PEPluvi.git
cd PEPluvi

# Setup do ambiente
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Subindo o Airflow (Astro CLI)

```bash
# Inicia os containers Docker do Airflow
astro dev start

# A UI do Airflow estará disponível em http://localhost:8080
```

---

## Como usar

### Consultando os dados (DuckDB)

```sql
-- Histórico diário de chuvas (Silver)
SELECT codigo_estacao, nome_estacao, data, precipitacao_mm, mesorregiao, alerta_chuva
FROM silver.monitoramento_pluviometrico
WHERE ano = 2024
ORDER BY precipitacao_mm DESC
LIMIT 20;

-- KPIs anuais por estação (Gold)
SELECT codigo_estacao, nome_estacao, municipio, mesorregiao, ano,
       total_anual_mm, classificacao_ano, desvio_historico_pct
FROM gold.agregados_anuais
WHERE ano = 2024
ORDER BY total_anual_mm DESC;

-- Estado atual das estações em tempo real (Gold — última leitura de cada estação)
SELECT estacao_codigo, nome_estacao, municipio, data_hora,
       chuva_15min, chuva_1h, chuva_3h, chuva_6h, chuva_12h, chuva_24h
FROM gold.data_cemaden_acumulados
QUALIFY ROW_NUMBER() OVER (PARTITION BY estacao_codigo ORDER BY data_hora DESC) = 1;

-- Série temporal das leituras de 15 min de uma estação (últimas 24h)
SELECT data_hora, chuva, nome_estacao, municipio
FROM gold.data_cemaden_leituras_15min
WHERE estacao_codigo = '261160600A'
  AND data_hora >= NOW() - INTERVAL '24 hours'
ORDER BY data_hora;

-- Comparativo sazonal do ano corrente (Gold — VIEW atualizada automaticamente)
SELECT mes, mesorregiao, precipitacao_ano_atual_mm, media_5anos_mm,
       desvio_vs_media_5anos_pct, status_sazonal
FROM gold.comparativo_sazonal
ORDER BY mesorregiao, mes;
```

### Execução manual (sem Airflow)

```bash
# 1. Coletar dados da APAC (salva Parquets em include/data/raw/)
make extract

# 2. Validar os Parquets
python include/pipeline/extract/valid_data.py

# 3. Ingerir no DuckDB (carga completa)
make load

# 3b. Ingerir apenas um ano específico (carga incremental)
python include/pipeline/load/ingest_duckdb.py 2026

# 4. Transformar (Silver → Gold — histórico)
cd transform
dbt run --select silver gold
dbt test --select silver gold

# 5. Executar o pipeline CEMADEN manualmente (Bronze → Silver → Gold)
python include/pipeline/extract/pipeline_api_cemaden.py
cd transform
dbt run --select tag:cemaden
dbt test --select tag:cemaden
```

> A carga histórica completa (1961 → hoje, todas as mesorregiões) leva várias horas. O scraper salva um Parquet por ano/mesorregião em `include/data/raw/`, então se cair, basta rodar de novo — os já coletados são pulados automaticamente.

### Execução orquestrada (Airflow)

Após subir o Airflow com `astro dev start`, duas DAGs ficam ativas:

- **`pipeline_pepluvi`** — Roda todos os dias às **06h UTC**: scraping incremental do ano corrente, carga no DuckDB e reconstrução completa das camadas Silver e Gold históricas.
- **`pipeline_api_cemaden`** — Roda a cada **15 minutos**: extração da API CEMADEN, gravação em Parquet particionado e execução incremental de toda a linhagem CEMADEN (Bronze → Silver → Gold).

---

## Estrutura do repositório

```
PEPluvi/
├── dags/
│   ├── pipeline_pepluvi.py           # DAG diária: scraping + dbt Silver + Gold histórico
│   └── pipeline_api_cemaden.py       # DAG real-time (15 min): API CEMADEN → Bronze → Silver → Gold
├── include/
│   ├── config/
│   │   └── settings.py               # constantes de caminho e URL
│   ├── data/                         # NÃO versionado (.gitignore)
│   │   ├── raw/                      # Parquets históricos e api_cemaden/ (Hive partitioned)
│   │   └── pepluvi.duckdb            # banco OLAP local (schemas: bronze, silver, gold)
│   └── pipeline/
│       ├── extract/
│       │   ├── scraping_apac.py      # scraper Selenium → Parquet histórico
│       │   ├── pipeline_api_cemaden.py  # API CEMADEN → Parquet Hive + VIEW Bronze
│       │   ├── ingest_muni.py        # API IBGE → DuckDB
│       │   └── valid_data.py         # validação de integridade dos Parquets
│       └── load/
│           └── ingest_duckdb.py      # ETL Parquet → DuckDB bronze
└── transform/                        # modelagem dbt
    ├── dbt_project.yml               # configurações globais do dbt
    ├── packages.yml                  # dbt-utils
    ├── macros/
    │   ├── clean_string.sql          # normalização de strings (remove acentos)
    │   ├── percentile_rank.sql       # encapsula PERCENT_RANK() para reutilização
    │   └── generate_schema_name.sql
    ├── models/
    │   ├── bronze/
    │   │   ├── sources.yml           # declaração das fontes Bronze
    │   │   ├── brz_api_cemaden.sql   # model dbt sobre os Parquets da Raw CEMADEN
    │   │   └── stg_ibge_municipios_pe.sql
    │   ├── silver/
    │   │   ├── schema.yml            # testes Silver
    │   │   ├── mapeamento_estacoes.sql
    │   │   ├── monitoramento_pluviometrico.sql
    │   │   └── data_cemaden_silver.sql  # Silver real-time: deduplicado + enriquecido
    │   └── gold/
    │       ├── schema.yml            # testes Gold
    │       ├── agregados_anuais.sql
    │       ├── ranking_eventos_extremos.sql
    │       ├── comparativo_sazonal.sql
    │       ├── qualidade_estacoes.sql
    │       ├── data_cemaden_leituras_15min.sql  # Gold: série temporal incremental
    │       └── data_cemaden_acumulados.sql      # Gold: acumulados móveis incrementais
    └── tests/
        └── cemaden/                  # testes singulares dbt do domínio CEMADEN
            ├── assert_data_cemaden_leituras_increasing.sql
            ├── assert_data_cemaden_consecutive_15min.sql
            └── assert_data_cemaden_janelas_integridade.sql
```

---

## Próximos passos

- **API / Backend** — Endpoints REST consumindo `gold.data_cemaden_leituras_15min` e `gold.data_cemaden_acumulados` para alimentar a aplicação web em tempo real.
- **Dashboards (Metabase / Superset)** — Visualizações interativas com mapas e séries temporais consumindo as tabelas Gold.
- **Alertas automáticos** — Notificações via Slack/Telegram quando eventos extremos forem detectados no pipeline.

---

## Referências

- [APAC — Monitoramento Pluviométrico](http://old.apac.pe.gov.br/meteorologia/monitoramento-pluvio.php)
- [DuckDB - Parquet & Hive Partitioning](https://duckdb.org/docs/data/parquet/hive_partitioning)
- [Apache Parquet](https://parquet.apache.org/)
- [Selenium](https://www.selenium.dev/documentation/)
- [Astronomer (Astro CLI)](https://www.astronomer.io/docs/astro/cli/overview)
- [Apache Airflow](https://airflow.apache.org/docs/)
- [dbt — Data Build Tool](https://docs.getdbt.com/)

---

*Projeto: PEPluvi — Igor Tiburcio · Iniciado em abril de 2026*
