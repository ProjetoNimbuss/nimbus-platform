<div align="center">

<img src="docs/assets/nimbus_logo.jpg" alt="Nimbus — Sistema de Monitoramento e Alertas" width="480"/>


### Sistema Integrado de Dados e Alertas Meteorológicos

**Monitoramento em tempo real · Alertas preventivos · Inteligência climática para a RMR**

---

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![DuckDB](https://img.shields.io/badge/DuckDB-OLAP-FFF000?style=flat-square&logo=duckdb&logoColor=black)](https://duckdb.org)
[![dbt](https://img.shields.io/badge/dbt-Core-FF694B?style=flat-square&logo=dbt&logoColor=white)](https://getdbt.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![MinIO](https://img.shields.io/badge/MinIO-S3%20Storage-C72E49?style=flat-square&logo=minio&logoColor=white)](https://min.io)

</div>

---

## 🌧️ O Problema

A Região Metropolitana do Recife é historicamente uma das áreas mais vulneráveis a eventos climáticos extremos no Brasil. Enchentes, deslizamentos, ressacas e tempestades afetam periodicamente milhões de pessoas.

A fragmentação das fontes de dados climáticos (distribuídas entre APAC, CEMADEN, IBGE, APIs globais e órgãos federais), aliada à ausência de uma plataforma centralizada e acessível, cria um gargalo crítico na cadeia de alertas.

**O Nimbus existe para mudar isso.**

---

## 🎯 O Que é o Nimbus

O **Nimbus** é uma plataforma de monitoramento e inteligência climática construída para a Região Metropolitana do Recife. Integramos dados de múltiplas fontes em uma única infraestrutura de dados, processamos em tempo real e entregamos alertas, previsões e análises históricas.

> *Nimbus é a palavra latina para nuvem de tempestade, a nuvem que anuncia a chuva antes que ela chegue.*

---

## 📦 O Que Entregamos

### 🔴 Monitoramento em Tempo Real
Leitura contínua de temperatura, umidade, precipitação e velocidade do vento para os **14 municípios da RMR**, alimentada por modelos globais de alta resolução (GFS e ECMWF).

### ⚠️ Alertas Preventivos
Sistema de alertas baseado em limiares configuráveis para eventos extremos: **enchentes, tempestades severas e ressacas**. Os alertas são emitidos com antecedência, permitindo ação antes do impacto.

### 🌊 Previsão Oceânica e Costeira
Monitoramento de condições marinhas, altura e período de ondas, swell e correntes, isso em **9 pontos costeiros da RMR**, incluindo Porto do Recife, Porto de Suape e as principais praias urbanas.

### 📅 Histórico Climático desde 1961
Acesso à série histórica de pluviometria de Pernambuco (dados APAC), abrangendo **5 mesorregiões** do estado desde 1961. Base fundamental para análise de tendências e dimensionamento de riscos.

### 🧑‍🤝‍🧑 Vulnerabilidade Sociodemográfica
Correlação dos dados climáticos com informações demográficas e domiciliares do **Censo IBGE 2022 por bairro**, permitindo identificar e priorizar áreas de maior vulnerabilidade social a eventos extremos.

### 📍 Reports de Condições pelos Usuários
Canal direto para que cidadãos e equipes de campo reportem condições climáticas e riscos em tempo real, enriquecendo os dados com informações de contexto local.

### 📊 Dashboard Público
Interface visual acessível para consulta de condições atuais, previsões e histórico climático da RMR.

---

## 🗄️ Fontes de Dados

O Nimbus agrega dados de fontes abertas, oficiais e especializadas:

| Fonte | Tipo | Dados |
| :--- | :--- | :--- |
| **Open-Meteo** | API Gratuita | Condições atuais e previsão meteorológica (7 dias) |
| **Open-Meteo Marine** | API Gratuita | Condições oceânicas e previsão de ondas (5 dias) |
| **Tomorrow.io** | API (Freemium) | Nowcasting e previsão de alta precisão (12h) |
| **CEMADEN / APAC** | API Interna | Telemetria pluviométrica em tempo real — PE |
| **APAC PE** | Web Scraping | Série histórica pluviométrica desde 1961 |
| **IBGE Censo 2022** | Carga Estática | Dados demográficos e domiciliares por bairro |
| **IBGE GPKG** | Carga Estática | Malha vetorial de bairros de Pernambuco |
| **REINDESC** | Carga Estática | Histórico de ocorrências de desastres naturais |

---

## 🏗️ Arquitetura

O Nimbus é construído sobre uma arquitetura **Medallion** (Raw → Bronze → Silver → Gold), com infraestrutura local hoje e migração planejada para GCP e MagaluCloud.

```
Fontes Externas (APIs, Scraping, Arquivos)
        │
        ▼
   📦 Data Lake — MinIO S3 (Parquet + Hive Partitioning)
        │
        ▼
   🥉 Bronze — DuckDB (nimbus.duckdb)
   VIEWs sobre S3 + Tabelas físicas para dados estáticos
        │
        ▼
   🥈 Silver — dbt Core
   Limpeza, padronização, enriquecimento
        │
        ▼
   🥇 Gold — dbt Core
   Métricas, agregações, datasets analíticos
        │
        ▼
   ⚡ FastAPI          🌐 Next.js
   (API REST)          (Dashboards Públicos)
```

**Stack completa:**
- **Ingestão:** Python 3.12, requests, pandas, selenium, pyarrow, s3fs
- **Storage:** MinIO (local) → Google Cloud Storage (nuvem)
- **Banco Analítico:** DuckDB → BigQuery (GCP)
- **Transformação:** dbt Core
- **Orquestração:** Prefect *(em implantação)*
- **API:** FastAPI
- **Frontend:** Next.js
- **Nuvem:** GCP (BigQuery, GCS, Cloud Run) + MagaluCloud (VM )

---

## 📚 Documentação

| Documento | Descrição |
| :--- | :--- |
| [Arquitetura de Dados](docs/arquitetura_dados.md) | Stack, ferramentas, justificativas e plano de migração para nuvem |
| [Ingestão de Dados — Bronze](docs/ingestao_dados_bronze.md) | Fontes, scripts, buckets, views e tabelas da camada Bronze |

---

## 🗂️ Estrutura do Repositório

```
rmr-alertas/
├── dags/               # DAGs de orquestração (Airflow → Prefect)
├── docs/               # Documentação técnica
├── include/
│   ├── config/         # Configurações centralizadas (.env)
│   ├── data/           # nimbus.duckdb (local)
│   └── pipeline/
│       ├── extract/    # Scripts de extração por fonte
│       └── storage/    # Utilitários MinIO & DuckDB
├── rmr-api/            # Backend FastAPI
├── rmr-web/            # Frontend Next.js
└── transform/          # Modelos dbt (Silver & Gold)
```

---

## 🚀 Status do Projeto

| Componente | Status |
| :--- | :--- |
| Ingestão de dados (Bronze) | ✅ Implementado |
| Data Lake (MinIO) | ✅ Implementado |
| Camada Silver/Gold (dbt) | 🔄 Em desenvolvimento |
| Orquestração (Prefect) | 📋 Planejado |
| API (FastAPI) | 🔄 Em desenvolvimento |
| Dashboard (Next.js) | 🔄 Em desenvolvimento |
| Migração GCP/MagaluCloud | 📋 Planejado |

---

<div align="center">

**Nimbus · Região Metropolitana do Recife · 2026**

*Dados que salvam vidas.*

</div>
