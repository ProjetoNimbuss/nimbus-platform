# 🌧️ Sistema de Alertas Climáticos — RMR

> Monitoramento e alerta contra eventos climáticos extremos para a **Região Metropolitana do Recife**.  
> Combinando previsão meteorológica, dados geoespaciais e radar em tempo real para proteger 9 municípios.

---

## 📌 Visão Geral

O sistema responde três perguntas em ordem crescente de complexidade:

| Etapa | Pergunta | Status |
|-------|----------|--------|
| 1 | **Vai chover onde?** — Pipeline meteorológico + dashboard base | ✅ Concluída |
| 2 | **Onde vai alagar?** — Risco geoespacial (topografia, marés, rios) | 🔄 Em desenvolvimento |
| 3 | **Quando e onde exatamente?** — Nowcasting por radar + ML | 🔜 Planejado |

---

## 🗂️ Estrutura do Repositório

| Etapa | Fluxo | Descrição |
|---|---|---|
| **Scraping Histórico** | `scraping_apac.py` | Coleta automatizada (Selenium) por mesorregião/ano. Salva em **Parquet**. |
| **API Real-time** | `dados_15min_apac.py` | Coleta dados CEMADEN a cada 15 min. Salva em **Parquet (Hive)**. |
| **Ingestão IBGE** | `ingest_muni_ibge.py` | Carga de metadados geográficos dos municípios. |
| **Ingestão Bronze** | `ingest_duckdb.py` | Carga física dos dados históricos no DuckDB. |
| **View Bronze** | `update_bronze_view` | Cria **VIEW dinâmica** para dados CEMADEN (sem duplicação). |
| **Transformação Silver** | `dbt run --select silver` | Deduplicação de estações, join IBGE, enriquecimento espacial e métricas sazonais. |
| **Transformação Gold** | `dbt run --select gold` | KPIs anuais, ranking de eventos extremos, comparativo sazonal e perfil de qualidade por estação. |
| **Qualidade de Dados** | `dbt test` | Testes de integridade nas chaves compostas, nulls, ranges e valores aceitos. |
| **Orquestração** | Airflow | DAG diária (APAC) e a cada 15 min (CEMADEN), incluindo `dbt run/test` Silver e Gold. |

---

## Arquitetura do pipeline

### 1. Dados Históricos (APAC)
```
rmr-alertas/
├── rmr-web/              # Interface pública em Next.js
├── rmr-api/              # API REST em FastAPI (em desenvolvimento)
├── dags/                 # DAGs Airflow (pipeline de dados)
├── docs/                 # ADRs, Runbook e documentação técnica
├── include/              # Pipeline Python (extract/load)
├── transform/            # Modelagem dbt (Bronze → Silver → Gold)
├── .github/workflows/    # CI/CD
├── Dockerfile
├── Makefile
├── pyproject.toml
├── requirements.txt
├── .env.example
└── .gitignore
```

---

## 🛠️ Stack Tecnológica

<<<<<<< HEAD
### Front-end (`rmr-web`)
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **SWR** — data fetching com revalidação automática

### Back-end (`rmr-api`) — em desenvolvimento
- **Python 3.11+** + **FastAPI**
- **DuckDB** — leitura das tabelas Ouro do pipeline
- **Uvicorn** — servidor ASGI

### Pipeline de Dados
- **Apache Airflow** (Astro CLI) — orquestração
- **DuckDB** — warehouse analítico local
- **dbt** — transformações Bronze → Silver → Gold
- **Selenium** — scraping histórico (APAC)
=======
| Camada | Localização | Formato | Descrição |
|---|---|---|---|
| **Raw (APAC)** | `include/data/raw/*.parquet` | Parquet | Arquivos brutos por ano/região. |
| **Raw (API)** | `include/data/raw/api_cemaden/` | Parquet | Particionamento Hive: `ano=Y/mes=M/dia=D/`. |
| **Bronze (Hist)** | `bronze.monitoramento_pluviometrico` | DuckDB Table | Dados históricos carregados fisicamente. |
| **Bronze (15min)** | `bronze.apac_15min_bronze` | DuckDB View | View dinâmica sobre os arquivos Parquet da Raw. |
| **Silver** | `silver.mapeamento_estacoes` | DuckDB Table | Cadastro unificado das estações deduplicadas (CEMADEN + IBGE), com lat/lon. |
| **Silver** | `silver.monitoramento_pluviometrico` | DuckDB Table | OBT enriquecida: `codigo_estacao`, `precipitacao_mm`, `mesorregiao`, alertas, médias móveis. |
| **Gold** | `gold.agregados_anuais` | DuckDB Table | Total anual, média histórica, desvio e classificação do ano (Seco/Normal/Chuvoso). |
| **Gold** | `gold.ranking_eventos_extremos` | DuckDB Table | Eventos diários classificados por percentil e severidade por estação e mesorregião. |
| **Gold** | `gold.comparativo_sazonal` | DuckDB View | Comparativo mensal: ano corrente vs média dos últimos 5 anos, por mesorregião. |
| **Gold** | `gold.qualidade_estacoes` | DuckDB Table | Perfil de qualidade por estação: score de confiança, % preenchimento, % nulos e categoria (`alta`/`media`/`baixa`). |
>>>>>>> 74646ce (adicao de métrica de qualidade por est)

---

## ⚡ Começando

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- [Astro CLI](https://www.astronomer.io/docs/astro/cli/install-cli)
- Docker
- Google Chrome (para o Selenium)

### 1. Clone o repositório

```bash
git clone https://github.com/vinihoudini/rmr-alertas.git
cd rmr-alertas
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com seus tokens
```

### 3. Suba o frontend

```bash
cd rmr-web
npm install
npm run dev
# http://localhost:3000
```

### 4. Suba o Airflow

```bash
astro dev start
# http://localhost:8080 — admin/admin
```

### 5. Suba a API (em desenvolvimento)

```bash
<<<<<<< HEAD
cd rmr-api
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload
# http://localhost:8000
# Docs: http://localhost:8000/docs
=======
# 1. Coletar dados da APAC (salva Parquets em include/data/raw/)
make extract

# 2. Validar os Parquets
python include/pipeline/extract/valid_data.py

# 3. Ingerir no DuckDB (carga completa)
make load

# 3b. Ingerir apenas um ano específico (carga incremental)
python include/pipeline/load/ingest_duckdb.py 2026

# 4. Transformar (Silver → Gold)
cd transform
dbt run --select silver gold
dbt test --select silver gold
```

> A carga histórica completa (1961 → hoje, todas as mesorregiões) leva várias horas. O scraper salva um Parquet por ano/mesorregião em `include/data/raw/`, então se cair, basta rodar de novo — os já coletados são pulados automaticamente.

### Execução orquestrada (Airflow)

Após subir o Airflow com `astro dev start`, a DAG `pipeline_pepluvi` roda automaticamente todos os dias às **06h UTC**, executando a carga incremental do ano corrente e reconstruindo toda a camada Silver e Gold.

---

## Estrutura do repositório

```
PEPluvi/
├── dags/
│   ├── pipeline_pepluvi.py       # DAG Airflow (carga diária + dbt Silver + Gold)
│   └── pipeline_15min_apac.py    # DAG Real-time (15 min)
├── include/
│   ├── config/
│   │   └── settings.py           # constantes de caminho e URL
│   ├── data/                     # NÃO versionado (.gitignore)
│   │   ├── raw/                  # Parquets brutos por mesorregião/ano e api_cemaden
│   │   └── pepluvi.duckdb        # banco OLAP local (schemas: bronze, silver, gold)
│   └── pipeline/
│       ├── extract/
│       │   ├── scraping_apac.py  # scraper Selenium → salva Parquet
│       │   ├── dados_15min_apac.py # API CEMADEN → salva Parquet Hive
│       │   ├── ingest_muni_ibge.py # API IBGE → DuckDB
│       │   └── valid_data.py     # validação dos arquivos
│       └── load/
│           └── ingest_duckdb.py  # ETL Parquet → DuckDB bronze
├── transform/                    # modelagem dbt (Silver → Gold)
│   ├── dbt_project.yml           # configurações globais do dbt
│   ├── packages.yml              # dbt-utils
│   ├── macros/
│   │   ├── clean_string.sql      # normalização de strings (remove acentos)
│   │   ├── percentile_rank.sql   # encapsula PERCENT_RANK() para reutilização
│   │   └── generate_schema_name.sql
│   └── models/
│       ├── bronze/               # sources e staging IBGE
│       ├── silver/
│       │   ├── mapeamento_estacoes.sql
│       │   ├── monitoramento_pluviometrico.sql
│       │   └── schema.yml        # testes Silver
│       └── gold/
│           ├── agregados_anuais.sql
│           ├── ranking_eventos_extremos.sql
│           ├── comparativo_sazonal.sql
│           ├── qualidade_estacoes.sql  # perfil de confiabilidade por estação
│           └── schema.yml        # testes Gold
├── Makefile                      # atalhos de execução
├── pyproject.toml                # dependências e linting (Ruff)
├── Dockerfile                    # imagem customizada (Chrome p/ Selenium)
├── airflow_settings.yaml         # configuração local do Airflow
├── requirements.txt              # dependências Python
├── .gitignore
└── README.md
>>>>>>> 74646ce (adicao de métrica de qualidade por est)
```

---

## 🗺️ Fontes de Dados

| Fonte | Dados | Etapa |
|-------|-------|-------|
| APAC | Histórico pluviométrico (1961→hoje) + tempo real (15min) | 1 |
| CEMADEN | Dados de monitoramento em tempo real | 1 |
| Open-Meteo Forecast API | Previsão horária de precipitação (7 dias) | 1 |
| Open-Meteo Historical API | Histórico 2010–hoje (backfill) | 1 |
| INMET Estações Automáticas | Validação observada (Recife, Olinda, Cabo) | 1 |
| MDT / PE 3D | Altimetria 1m de resolução | 2 |
| MapBiomas | Uso do solo (impermeabilidade por célula) | 2 |
| IBGE Setores Censitários | População exposta por célula | 2 |
| DHN / Marinha | Tábua de marés do Porto do Recife | 2 |
| APAC Cotas dos Rios | Níveis do Capibaribe, Beberibe e Tejipió | 2 |
| Radar APAC | Imagens PPI a cada 10 minutos | 3 |
| GOES-16 (NOAA) | Satélite infravermelho + vapor d'água | 3 |

---

## 🚨 Níveis de Alerta

| Nível | Cor | Descrição |
|-------|-----|-----------|
| Normal | 🟢 | Sem risco identificado |
| Atenção | 🟡 | Chuva prevista, monitoramento ativo |
| Alerta | 🟠 | Risco elevado de alagamento |
| Emergência | 🔴 | Evento extremo em curso |

---

## 👥 Time

| Papel | Responsabilidade |
|-------|-----------------|
| Vinicius Houdini | Dev Pleno — API FastAPI, arquitetura, integração |
| Igor Tiburcio | Analista de Dados — Pipeline Airflow, DuckDB, dbt, modelos |

---

## 📅 Roadmap

### ✅ Etapa 1 — Pipeline Meteorológico + Interface Base
- [x] Definição de arquitetura
- [x] Pipeline APAC (histórico + real-time a cada 15min)
- [x] Pipeline CEMADEN
- [x] Camada Silver (dbt)
- [x] Interface pública Next.js (níveis de alerta por município)

### 🔄 Etapa 2 — Risco Geoespacial (em andamento)
- [ ] API FastAPI base com endpoints de grid e alertas
- [ ] Ingestão MDT/PE3D, MapBiomas, IBGE, DHN, APAC Rios
- [ ] Joins geoespaciais na camada Silver (DuckDB spatial)
- [ ] Índice de risco composto por célula (camada Gold)
- [ ] Dashboard BI (Metabase ou Superset) para Defesa Civil
- [ ] Interface pública: índice de risco + população exposta

### 🔜 Etapa 3 — Nowcasting + Machine Learning
- [ ] Scraper do radar meteorológico APAC (10min)
- [ ] Georreferenciamento das imagens PPI
- [ ] Optical flow para projeção de células de chuva (t+30min)
- [ ] Integração GOES-16 via S3 público
- [ ] Modelo XGBoost de probabilidade de alerta
- [ ] WebSocket para atualizações em tempo real no frontend
- [ ] Player de radar animado na interface
- [ ] PWA com notificações push

---

## 📄 Variáveis de Ambiente

Veja o arquivo [`.env.example`](.env.example) para a lista completa.

```env
# Pipeline
INMET_TOKEN=
CEMADEN_TOKEN=

# API
API_PORT=8000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# BI (Etapa 2)
METABASE_SECRET_KEY=

# Mapbox (Etapa 3)
NEXT_PUBLIC_MAPBOX_TOKEN=

# PostgreSQL (Etapa 2+)
POSTGRES_URL=
```

---

> Desenvolvido para a Defesa Civil da Região Metropolitana do Recife.  
> Vinicius Houdini · Igor Tiburcio · 2026
