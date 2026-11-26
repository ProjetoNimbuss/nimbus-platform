# 🌩️ Plano Diretor de Arquitetura e Reestruturação — Plataforma Nimbus

Este documento consolida a estratégia arquitetural, a divisão de repositórios, a padronização dos ambientes de Desenvolvimento (`Dev`) e Produção (`Prod`), a engenharia de dados (com simulação local e promoção para Google Cloud) e a integração de ponta a ponta com Backend e Frontend.

---

## 📑 Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Divisão dos Repositórios Git](#2-divisão-dos-repositórios-git)
   - [nimbus-cloud](#repositório-nimbus-cloud)
   - [nimbus-project](#repositório-nimbus-project)
3. [Estratégia Docker (Dev vs Prod)](#3-estratégia-docker-dev-vs-prod)
   - [docker-compose.dev.yml](#docker-composedevyml-ambiente-local)
   - [docker-compose.prod.yml](#docker-composeprodyml-ambiente-vm--cloud)
   - [Padronização do Taskfile.yml](#padronização-do-taskfileyml)
4. [Engenharia de Dados & Ciclo Medallion](#4-engenharia-de-dados--ciclo-medallion)
   - [Storage Adapter (storage_manager.py)](#storage-adapter-armazenamento-agnóstico)
   - [Refatoração dos Scripts de Ingestão](#refatoração-dos-scripts-de-ingestão)
   - [Ciclo de Transformação: dbt Local ➔ GCP Dataform](#ciclo-de-transformação-dbt-local--gcp-dataform)
5. [Orquestração com Prefect (Local & VM)](#5-orquestração-com-prefect-local--vm)
   - [Estrutura do Workflow](#estrutura-do-workflow)
   - [Integração Prefect ➔ Dataform](#integração-prefect--dataform)
6. [Backend e Frontend (Integração Completa)](#6-backend-e-frontend-integração-completa)
   - [Backend (API)](#backend-api)
   - [Frontend (Web Next.js)](#frontend-web-nextjs)
7. [Roteiro Passo a Passo de Execução](#7-roteiro-passo-a-passo-de-execução)

---

## 1. Visão Geral da Arquitetura

A plataforma Nimbus opera sob o princípio de **Base de Código Única e Múltiplos Ambientes** (*12-Factor App*):

```
                                  ┌─────────────────────────────┐
                                  │      nimbus-project         │
                                  │  (Código Fonte Unificado)   │
                                  └──────────────┬──────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
       🛠️ AMBIENTE DEV (Local / PC)                                 🚀 AMBIENTE PROD (VM + GCP)
 ─────────────────────────────────────────                   ─────────────────────────────────────────
 • docker-compose.dev.yml                                    • docker-compose.prod.yml
 • MinIO (Data Lake local S3)                                • Google Cloud Storage (GCS)
 • DuckDB (OLAP local em arquivo)                            • Google BigQuery (Data Warehouse)
 • dbt Core (Testes ágeis de regras)                         • GCP Dataform (SQLX oficial no BigQuery)
 • Prefect Local (P&D sob demanda)                           • Prefect VM (Orquestração contínua 24/7)
 • Next.js (Hot-reload / npm run dev)                        • Next.js (Build standalone otimizado)
 • Custo de nuvem: R$ 0,00                                   • VM leve + Processamento serverless GCP
```

---

## 2. Divisão dos Repositórios Git

Para garantir segurança, isolamento de permissões e boas práticas de DevOps, o monorepo atual é dividido em dois repositórios independentes:

### Repositório: `nimbus-cloud`
Contém exclusivamente a Infraestrutura como Código (IaC), configurações de rede, túneis, segurança e provisionamento de nuvem.

```
nimbus-cloud/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── backend.tf
│   ├── terraform.tfvars.example
│   └── modules/
│       ├── gcp_data/         # Buckets GCS, Datasets BigQuery, Repositório Dataform
│       ├── mgc_compute/      # Provisionamento da VM na MagaluCloud
│       └── cloudflare_dns/   # DNS, Domínios, SSL e Tunnels
├── scripts/
│   ├── bootstrap_vm.sh       # Cloud-init / instalação do Docker e Tailscale na VM
│   └── setup_tailscale.sh
├── docs/
│   ├── Documentação_Terraform.md
│   ├── Documentação_Configuração_Acesso_Equipe_Tailscale.md
│   └── Arquitetura_Redes_e_Firewall.md
└── README.md
```

### Repositório: `nimbus-project`
Contém todo o código da aplicação, pipelines de engenharia de dados, modelos de transformação e orquestração.

```
nimbus-project/
├── api/                      # Backend (Rotas REST, integração com banco e camada Gold)
├── web/                      # Frontend Next.js (Dashboards públicos, mapas e alertas)
├── ingestion/                # Pipelines Python de extração
│   ├── config/               # Configurações centrais (settings.py)
│   ├── extract/              # Scripts de coleta (CEMADEN, APAC, Open-Meteo, IBGE)
│   └── storage/              # Storage Adapter (MinIO / GCS)
├── transform/                # Modelos analíticos locais com dbt (Laboratório)
│   ├── models/
│   │   ├── bronze/
│   │   ├── silver/
│   │   └── gold/
│   └── dbt_project.yml
├── dataform/                 # Modelos SQLX de produção (Dataform GCP)
│   ├── definitions/
│   │   ├── bronze/
│   │   ├── silver/
│   │   └── gold/
│   └── dataform.json
├── flows/                    # Workflows do Prefect
│   ├── tasks/
│   │   └── dataform_tasks.py # Task de disparo da API do GCP Dataform
│   ├── Dockerfile.prefect    # Imagem com Chrome/Selenium para scrapings
│   └── cemaden_workflow.py   # Workflows por fonte
├── data/                     # Dados estáticos (GPKG, shapefiles, IBGE)
├── docs/                     # Documentações de dados e regras de negócio
├── docker-compose.dev.yml    # Orquestração para ambiente local
├── docker-compose.prod.yml   # Orquestração para ambiente VM
├── Taskfile.yml              # Automação de comandos do projeto
├── requirements.txt          # Dependências Python
└── README.md
```

---

## 3. Estratégia Docker (Dev vs Prod)

### `docker-compose.dev.yml` (Ambiente Local)
Foco em: **produtividade, autonomia sem internet e zero custos de nuvem.**

```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: nimbus_dev_minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    command: server /data --console-address ":9001"
    volumes:
      - minio_dev_data:/data

  postgre:
    image: postgres:16-alpine
    container_name: nimbus_dev_postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-nimbus_app}
      POSTGRES_USER: ${POSTGRES_USER:-nimbus_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-nimbus_pass}
    ports:
      - "5432:5432"
    volumes:
      - pg_dev_data:/var/lib/postgresql/data

  prefect-server:
    image: prefecthq/prefect:3-python3.11
    container_name: nimbus_dev_prefect_server
    command: prefect server start --host 0.0.0.0
    ports:
      - "4200:4200"

  prefect-worker:
    build:
      context: .
      dockerfile: flows/Dockerfile.prefect
    container_name: nimbus_dev_prefect_worker
    command: prefect worker start --pool default-agent-pool
    environment:
      - PREFECT_API_URL=http://prefect-server:4200/api
      - ENVIRONMENT=development
    volumes:
      - .:/app
    depends_on:
      - prefect-server
      - minio

  api:
    build:
      context: ./api
      dockerfile: Dockerfile.dev
    container_name: nimbus_dev_api
    volumes:
      - ./api:/app
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=development
      - DB_HOST=postgre
    depends_on:
      - postgre

  web:
    image: node:20-alpine
    container_name: nimbus_dev_web
    working_dir: /app
    volumes:
      - ./web:/app
      - /app/node_modules
      - /app/.next
    command: sh -c "npm install && npm run dev"
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - api

volumes:
  minio_dev_data:
  pg_dev_data:
```

---

### `docker-compose.prod.yml` (Ambiente VM / Cloud)
Foco em: **baixo consumo de RAM/CPU, estabilidade 24/7, ausência de conflitos de porta (ex: Portainer na 8000).**

```yaml
version: '3.8'

services:
  prefect-server:
    image: prefecthq/prefect:3-python3.11
    container_name: nimbus_prod_prefect_server
    command: prefect server start --host 0.0.0.0
    ports:
      - "4200:4200"
    restart: unless-stopped
    volumes:
      - prefect_data:/root/.prefect

  prefect-worker:
    build:
      context: .
      dockerfile: flows/Dockerfile.prefect
    container_name: nimbus_prod_prefect_worker
    command: prefect worker start --pool prod-agent-pool
    environment:
      - PREFECT_API_URL=http://prefect-server:4200/api
      - ENVIRONMENT=production
      - GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-key.json
      - GCP_PROJECT_ID=${GCP_PROJECT_ID}
    volumes:
      - .:/app
    restart: unless-stopped
    depends_on:
      - prefect-server

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: nimbus_prod_api
    ports:
      # Porta 8001 no host para evitar conflito com o Portainer que ocupa a 8000
      - "8001:8000"
    environment:
      - ENVIRONMENT=production
      - DB_HOST=${PROD_DB_HOST}
      - DB_USER=${PROD_DB_USER}
      - DB_PASSWORD=${PROD_DB_PASSWORD}
    restart: unless-stopped

  web:
    build:
      context: ./web
      dockerfile: Dockerfile.prod
    container_name: nimbus_prod_web
    ports:
      - "8080:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    restart: unless-stopped
    depends_on:
      - api

volumes:
  prefect_data:
```

---

### Padronização do `Taskfile.yml`

Centraliza a execução dos comandos para que qualquer pessoa do time use a mesma sintaxe:

```yaml
version: '3'

dotenv: ['.env']

tasks:
  default:
    desc: Lista todos os comandos disponíveis
    cmds:
      - task --list

  # --- AMBIENTE DE DESENVOLVIMENTO (LOCAL) ---
  dev:up:
    desc: Iniciar ambiente completo de desenvolvimento local
    cmds:
      - docker-compose -f docker-compose.dev.yml up -d
      - docker-compose -f docker-compose.dev.yml ps

  dev:down:
    desc: Parar ambiente de desenvolvimento local
    cmds:
      - docker-compose -f docker-compose.dev.yml down

  dev:logs:
    desc: Acompanhar logs do ambiente local
    cmds:
      - docker-compose -f docker-compose.dev.yml logs -f

  # --- AMBIENTE DE PRODUÇÃO (VM) ---
  prod:up:
    desc: Subir stack de produção na VM
    cmds:
      - docker-compose -f docker-compose.prod.yml up -d --build
      - docker-compose -f docker-compose.prod.yml ps

  prod:down:
    desc: Parar stack de produção na VM
    cmds:
      - docker-compose -f docker-compose.prod.yml down

  up:prefect:
    desc: Subir apenas o Prefect de produção na VM
    cmds:
      - docker-compose -f docker-compose.prod.yml up -d prefect-server prefect-worker

  # --- ENGENHARIA DE DADOS (DBT & DATAFORM) ---
  dbt:run:
    desc: Executar transformações analíticas locais (DuckDB)
    cmds:
      - cd transform && dbt run

  dbt:test:
    desc: Executar testes de integridade analítica no dbt
    cmds:
      - cd transform && dbt test

  dataform:compile:
    desc: Validar sintaxe dos modelos SQLX do Dataform
    cmds:
      - cd dataform && dataform compile

  dataform:test:
    desc: Rodar testes unitários locais do Dataform
    cmds:
      - cd dataform && dataform test
```

---

## 4. Engenharia de Dados & Ciclo Medallion

### Storage Adapter (`storage_manager.py`)
Módulo único que abstrai a escrita de arquivos Parquet. O script de extração não sabe se está escrevendo no MinIO ou no GCS.

```python
# ingestion/storage/storage_manager.py
import os
import pandas as pd
from ingestion.config.settings import (
    ENVIRONMENT,
    BUCKETS,
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    GCP_PROJECT_ID
)

def save_raw_parquet(df: pd.DataFrame, bucket_alias: str, partition_path: str, filename: str) -> str:
    """
    Grava o DataFrame em formato Parquet no destino adequado conforme o ambiente:
    - development: MinIO (s3://...)
    - production: Google Cloud Storage (gs://...)
    """
    if df.empty:
        print(f"Aviso: DataFrame vazio para {bucket_alias}. Nenhum arquivo salvo.")
        return ""

    bucket_name = BUCKETS[bucket_alias]

    if ENVIRONMENT == "production":
        # 🚀 PRODUÇÃO: Google Cloud Storage
        gcs_bucket = f"{GCP_PROJECT_ID}-{bucket_name}"
        gcs_uri = f"gs://{gcs_bucket}/{partition_path}/{filename}"
        
        # O pyarrow/pandas utiliza o Application Default Credentials (ADC) do GCP automaticamente
        df.to_parquet(gcs_uri, index=False)
        print(f"[PROD - GCS] Arquivo salvo em: {gcs_uri}")
        return gcs_uri

    else:
        # 🛠️ DESENVOLVIMENTO: MinIO Local (S3 emulado)
        s3_uri = f"s3://{bucket_name}/{partition_path}/{filename}"
        storage_options = {
            "key": MINIO_ACCESS_KEY,
            "secret": MINIO_SECRET_KEY,
            "client_kwargs": {"endpoint_url": MINIO_ENDPOINT}
        }
        df.to_parquet(s3_uri, index=False, storage_options=storage_options)
        print(f"[DEV - MinIO] Arquivo salvo em: {s3_uri}")
        return s3_uri
```

### Refatoração dos Scripts de Ingestão
Exemplo aplicado ao pipeline do CEMADEN:

```python
# Trecho de ingestion/extract/extract_cemaden.py
from datetime import datetime
import pandas as pd
from ingestion.storage.storage_manager import save_raw_parquet

def save_partitioned(df: pd.DataFrame) -> str:
    data_ref = df["data_hora"].max() if not df.empty else datetime.now()
    partition = f"ano={data_ref.year}/mes={data_ref.month:02d}/dia={data_ref.day:02d}"
    filename = f"{datetime.now().strftime('%H-%M-%S')}.parquet"

    # Salva usando o adapter agnóstico
    return save_raw_parquet(
        df=df,
        bucket_alias="cemaden",
        partition_path=partition,
        filename=filename
    )
```

---

### Ciclo de Transformação: dbt Local ➔ GCP Dataform

Para manter a velocidade máxima sem incorrer em custos na nuvem:
1. **Fase de Criação e Validação (Local):**
   - O desenvolvedor desenvolve e ajusta o modelo SQL na pasta `transform/models/` com **dbt**.
   - Executa `task dbt:run` contra o DuckDB local. A resposta vem em menos de 2 segundos.
   - Testa com `task dbt:test`.
2. **Fase de Promoção para Produção (Dataform SQLX):**
   - Uma vez homologada a regra, o código é convertido para a pasta `dataform/definitions/`.

#### Tabela de Conversão dbt (`.sql`) para Dataform (`.sqlx`):

| Conceito | No dbt (`transform/models/silver/cemaden.sql`) | No Dataform (`dataform/definitions/silver/cemaden.sqlx`) |
| :--- | :--- | :--- |
| **Materialização** | `{{ config(materialized='table') }}` | `config { type: "table", schema: "silver" }` |
| **Referência Bronze** | `FROM {{ ref('bronze_cemaden') }}` | `FROM ${ref("bronze_cemaden")}` |
| **Seleção e Lógica** | `SELECT data_hora, estacao, AVG(chuva)...` | `SELECT data_hora, estacao, AVG(chuva)...` *(Idêntico)* |
| **Filtros e Cláusulas**| `WHERE data_hora IS NOT NULL` | `WHERE data_hora IS NOT NULL` *(Idêntico)* |

---

## 5. Orquestração com Prefect (Local & VM)

### Estrutura do Workflow
O workflow é único e compatível com ambos os ambientes:

```python
# flows/cemaden_workflow.py
import os
from prefect import flow, task
from ingestion.extract.extract_cemaden import fetch_data, save_partitioned, update_bronze_view
from flows.tasks.dataform_tasks import trigger_dataform_execution

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

task_fetch = task(fetch_data, name="fetch-cemaden", retries=3, retry_delay_seconds=30)
task_save = task(save_partitioned, name="save-raw-cemaden")
task_duckdb_view = task(update_bronze_view, name="update-local-duckdb-view")

@flow(name="cemaden-ingestion-flow", log_prints=True)
def cemaden_flow():
    # 1. Ingestão (comporta-se transparentemente conforme o ambiente)
    df = task_fetch()
    s3_or_gcs_path = task_save(df)
    
    # 2. Transformação analítica
    if ENVIRONMENT == "production":
        # 🚀 Em produção, dispara a execução oficial do Dataform no BigQuery
        trigger_dataform_execution(repository="nimbus-dataform-repo")
    else:
        # 🛠️ Em desenvolvimento, atualiza a view do DuckDB para testes locais
        task_duckdb_view()

if __name__ == "__main__":
    cemaden_flow()
```

### Integração Prefect ➔ Dataform
Task que dispara o Dataform via API oficial da GCP:

```python
# flows/tasks/dataform_tasks.py
import os
from prefect import task
from google.cloud import dataform_v1beta1

@task(name="trigger-dataform-execution", retries=2)
def trigger_dataform_execution(repository: str):
    project = os.getenv("GCP_PROJECT_ID")
    location = os.getenv("GCP_REGION", "us-east1")
    
    client = dataform_v1beta1.DataformClient()
    parent = f"projects/{project}/locations/{location}/repositories/{repository}"

    # 1. Cria a compilação do código Dataform
    compilation_result = client.create_compilation_result(
        parent=parent,
        compilation_result=dataform_v1beta1.CompilationResult(git_commitish="main")
    )
    print(f"Dataform compilado: {compilation_result.name}")

    # 2. Dispara a execução das ações no BigQuery
    invocation = client.create_workflow_invocation(
        parent=parent,
        workflow_invocation=dataform_v1beta1.WorkflowInvocation(
            compilation_result=compilation_result.name
        )
    )
    print(f"Invocação do Dataform iniciada no BigQuery: {invocation.name}")
```

---

## 6. Backend e Frontend (Integração Completa)

### Backend (API)
- **Função:** Expõe endpoints REST com métricas analíticas da camada **Gold** e gerencia dados relacionais no **PostgreSQL** (cadastro de usuários, históricos de alertas, relatórios de cidadãos).
- **Em Dev:** Roda com reload ativado conectando ao PostgreSQL local e ao DuckDB.
- **Em Prod:** 
  - Build otimizado em container.
  - Conecta ao PostgreSQL de produção e lê da camada Gold.
  - Porta `8001` no host para garantir convivência pacífica com o Portainer da VM.

### Frontend (Web Next.js)
- **Função:** Visualização pública em tempo real, painéis `Watch` e `Vigil`, séries temporais de chuva e alertas.
- **Em Dev:** `npm run dev` com Fast Refresh.
- **Em Prod:** **Next.js Standalone Build** (`Dockerfile.prod`):
  - Reduz o consumo de RAM de 800MB para **menos de 100MB**.
  - Tamanho da imagem Docker reduzido de ~1GB para ~150MB.

```dockerfile
# web/Dockerfile.prod (Multi-stage build otimizado)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 7. Roteiro Passo a Passo de Execução

Quando iniciarmos a execução, seguiremos este checklist rigoroso:

### 🟩 Fase 1: Divisão dos Repositórios
- [ ] Criar o repositório `nimbus-cloud` no GitHub.
- [ ] Mover `terraform/` e documentações de redes/VPN para o `nimbus-cloud`.
- [ ] Remover a pasta `terraform/` do `nimbus-project`.

### 🟩 Fase 2: Configuração dos Arquivos Docker no `nimbus-project`
- [ ] Criar `docker-compose.dev.yml` (infra local completa).
- [ ] Criar `docker-compose.prod.yml` (imagem otimizada, porta 8001 para a API).
- [ ] Criar `.env.dev.example` e `.env.prod.example`.
- [ ] Atualizar `Taskfile.yml` com os novos comandos de Dev e Prod.

### 🟩 Fase 3: Implementação do Storage Adapter
- [ ] Criar `ingestion/storage/storage_manager.py`.
- [ ] Atualizar os scripts de ingestão (`extract_cemaden.py`, etc.) para usar o `save_raw_parquet`.

### 🟩 Fase 4: Estruturação dos Modelos
- [ ] Manter `transform/` com dbt-duckdb para testes rápidos da equipe.
- [ ] Criar estrutura base da pasta `dataform/` para os modelos de produção.

### 🟩 Fase 5: Configuração e Subida do Prefect na VM
- [ ] Subir apenas o Prefect na VM (`task up:prefect`).
- [ ] Confirmar acesso à interface gráfica na porta `4200` (`http://<IP_DA_VM>:4200`).
- [ ] Validar a criação do pool de agentes e execução do primeiro workflow de teste.

---
*Documento elaborado como referência técnica unificada para a equipe do Projeto Nimbus.*
