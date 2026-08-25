# Análise Arquitetural: Estrutura de Pastas & Infraestrutura Docker

> **Projeto:** Nimbus — Sistema de Alertas Climáticos da Região Metropolitana do Recife (RMR)  
> **Data:** 25/08/2026  
> **Status:** Arquitetura Atualizada & Documentação de Referência  

---

## 1. Inventário da Estrutura Atual do Repositório

```
nimbus-platform/
├── .env                                # Variáveis de ambiente locais (não versionado)
├── .env.example                        # Template de variáveis de ambiente
├── .gitignore                          # Ignora .env, DuckDB, node_modules, etc.
├── .pre-commit-config.yaml             # Pre-commit hooks para qualidade de código
├── Taskfile.yml                        # Automação oficial do projeto (go-task)
├── LICENSE
├── README.md
├── docker-compose.yml                  # Todos os serviços unificados (MinIO, Postgres, API, Web, Prefect)
├── pyproject.toml                      # Metadata do projeto Python "nimbus"
├── requirements.txt                    # Dependências Python globais (pipeline, dbt, prefect)
│
├── .github/workflows/
│   ├── ci.yml                          # Lint com Ruff
│   └── auto-tag-on-merge.yml           # Auto tag semântica em merges
│
├── docs/                               # Documentação centralizada
│   ├── assets/
│   ├── Documentação_de_arquitetura_de dados.md
│   ├── Documentacao_Ingestao_bronze.md
│   ├── api-contrato.md                 # Contratos REST /api/v1 (Watch, Vigil, Reports)
│   ├── estrategia-de-branches.md        # Convenção de fluxo Git
│   ├── guia_taskfile_e_provisionamento.md # Tutorial de setup e comandos Taskfile
│   ├── analise_sinergia_dados_e_telas.md
│   ├── analise_arquitetural.md         # Este documento
│   └── resumo_tecnico.md
│
│── PIPELINE DE DADOS (Python) ──────────────────────────────
│
├── pipeline/                           # Módulo Python de ingestão de dados
│   ├── __init__.py                     # Torna pipeline/ pacote Python válido
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py                 # Centraliza .env, caminhos e buckets MinIO
│   │   └── constants.py                # CITIES, COASTAL_POINTS, POLOS_SENTINELA
│   ├── extract/
│   │   ├── __init__.py
│   │   ├── extract_apac.py             # Scraping APAC (Selenium + BeautifulSoup)
│   │   ├── extract_cemaden.py          # Telemetria CEMADEN (15min)
│   │   ├── extract_ibge_municipios.py  # Dados vetoriais e demográficos IBGE
│   │   ├── extract_open_meteo_current.py
│   │   ├── extract_open_meteo_daily.py
│   │   ├── extract_open_meteo_hourly.py
│   │   ├── extract_open_meteo_marine_current.py
│   │   ├── extract_open_meteo_marine_daily.py
│   │   ├── extract_open_meteo_marine_hourly.py
│   │   └── extract_tomorrow_io.py
│   └── storage/
│       ├── __init__.py
│       ├── duckdb_minio.py             # Gerenciador de conexões DuckDB ↔ MinIO (httpfs)
│       └── setup_minio.py              # Script de criação automatizada dos buckets S3
│
│── ORQUESTRAÇÃO (Prefect) ──────────────────────────────────
│
├── flows/                              # Workflows Prefect (substitui dags/ Airflow)
│   ├── Dockerfile.prefect              # Python 3.11-slim + Google Chrome (Selenium) + PIP
│   ├── flow_apac_historico.py          # Scraping APAC + dbt Silver/Gold — diário
│   ├── flow_cemaden.py                 # CEMADEN + dbt — a cada 15min
│   └── deploy.py                       # Deployments no Prefect Server
│
│── TRANSFORMAÇÃO (dbt Core) ────────────────────────────────
│
├── transform/                          # Projeto dbt analítico (Silver & Gold)
│   ├── dbt_project.yml                 # nome: "nimbus"
│   ├── profiles.yml                    # Conexão DuckDB
│   ├── packages.yml
│   ├── macros/                         # clean_string, percentile_rank, etc.
│   ├── models/
│   │   ├── bronze/                     # VIEWs dinâmicas sobre S3 Parquet
│   │   ├── silver/                     # Limpeza, deduplicação e JOINs
│   │   └── gold/                       # Métricas, KPIs e acumulados móveis
│   └── tests/                          # Testes de integridade de dados
│
│── BACKEND API (Laravel) ───────────────────────────────────
│
├── api/                                # Backend REST em PHP 8.2 / Laravel
│   ├── Dockerfile                      # php:8.2-fpm-alpine + pdo_pgsql + Composer
│   ├── artisan                         # CLI do Laravel
│   ├── composer.json
│   ├── app/
│   │   ├── Http/Controllers/           # Controllers REST (Alertas, Estações, Reports)
│   │   ├── Models/                     # Modelos Eloquent
│   │   └── Services/                   # Lógica de negócio e comunicação com DuckDB
│   ├── routes/
│   │   ├── api.php                     # Rotas /api/v1/...
│   │   └── web.php
│   └── database/
│       ├── migrations/                 # Migrations PostgreSQL (users, reports, etc.)
│       └── seeders/
│
│── FRONTEND (Next.js) ──────────────────────────────────────
│
└── web/                                # Dashboard Web em Next.js 16 / React 19
    ├── Dockerfile                      # Multi-stage build (deps, builder, runner)
    ├── package.json
    ├── app/                            # App Router (/, /previsao, /tecnico, /tecnico/historico)
    ├── components/                     # Componentes UI, mapas Leaflet e gráficos Recharts
    ├── lib/                            # Types, constants, utils, mock-data
    └── services/                       # Cliente HTTP (fetch/SWR) para consumo da API
```

---

## 2. Visão Geral da Arquitetura de Containers (Docker)

A infraestrutura local é orquestrada por um único arquivo `docker-compose.yml` que unifica os 6 componentes do projeto:

```
                          ┌──────────────────────────┐
                          │   Next.js Dashboard UI   │
                          │        (web: 8080)       │
                          └─────────────┬────────────┘
                                        │ (HTTP REST)
                                        ▼
                          ┌──────────────────────────┐
                          │    Laravel Backend API   │
                          │        (api: 8000)       │
                          └──────┬────────────┬──────┘
                                 │            │
             (Queries OLAP SQL)  │            │ (Eloquent OLTP)
                                 ▼            ▼
   ┌────────────────────────────────┐      ┌────────────────────────────────┐
   │    DuckDB (nimbus.duckdb)      │      │   PostgreSQL (nimbus_postgres) │
   │ Data Warehouse (Bronze/Gold)   │      │ Banco Relacional (api: 5432)   │
   └────────────────┬───────────────┘      └────────────────────────────────┘
                    │ (Parquet / httpfs)
                    ▼
   ┌────────────────────────────────┐      ┌────────────────────────────────┐
   │    MinIO (Object Storage S3)   │◄─────┤     Prefect Worker / Flows     │
   │ Data Lake (minio: 9000/9001)   │      │ Python Ingestion (worker:4200) │
   └────────────────────────────────┘      └────────────────────────────────┘
```

| Serviço | Container Name | Imagem / Build | Porta | Função |
| :--- | :--- | :--- | :--- | :--- |
| **`web`** | `nimbus_web` | `web/Dockerfile` | `8080` | Interface visual em Next.js 16 / React 19. |
| **`api`** | `nimbus_api` | `api/Dockerfile` | `8000` | Backend REST Laravel PHP 8.2 (Rotas `/api/v1`). |
| **`postgres`** | `nimbus_postgres` | `postgres:15-alpine` | `5432` | Banco relacional para usuários, relatos e logs da API. |
| **`minio`** | `nimbus_minio` | `minio/minio:latest` | `9000` / `9001` | Data Lake S3 local armazenando arquivos Parquet. |
| **`prefect-server`** | `nimbus_prefect_server` | `prefecthq/prefect:3-python3.11` | `4200` | Dashboard e agendador visual do Prefect. |
| **`prefect-worker`** | `nimbus_prefect_worker` | `flows/Dockerfile.prefect` | Internal | Executor dos scripts Python (`pipeline/`) e dbt (`transform/`). |

---

## 3. Automação & DX com Taskfile

O projeto utiliza o **`Taskfile.yml`** para simplificar o gerenciamento local. Em vez de decorar comandos complexos do Docker ou Artisan, o desenvolvedor executa tarefas simples:

- `task setup`: Provisionamento inicial completo (Containers + MinIO S3 Buckets + Laravel Migrations).
- `task up`: Subida rápida de todos os serviços.
- `task up:<servico>`: Subida isolada/granular (`task up:minio`, `task up:postgres`, `task up:api`, `task up:web`, `task up:prefect`).
- `task status`: Exibe a tabela de containers ativos.
- `task logs`: Acompanha os logs unificados em tempo real.
- `task migrate`: Executa migrations no banco PostgreSQL.
- `task dbt-run`: Executa transformações de dados dbt.

Consulte o documento **[`docs/guia_taskfile_e_provisionamento.md`](guia_taskfile_e_provisionamento.md)** para o tutorial passo a passo.
