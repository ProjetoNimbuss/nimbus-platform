# Documentação Técnica: Camadas Bronze e Silver & Orquestração Dataform

> **Projeto:** Nimbus — Plataforma de Monitoramento e Alertas Climáticos da Região Metropolitana do Recife (RMR)  
> **Ambiente Cloud:** Google Cloud Platform (GCP) — Projeto `nimbus-506613` | Região `southamerica-east1`  
> **Camadas Cobertas:** Bronze (External Tables) → Silver (BigQuery Native + Dataform)  
> **Orquestrador:** Prefect 3.x + Dataform CLI  
> **Última Atualização:** Novembro de 2026  

---

## 1. Visão Geral da Arquitetura

O ecossistema analítico da **Plataforma Nimbus** adota a **Arquitetura Medallion** em nuvem, garantindo linhagem de ponta a ponta, rastreabilidade, isolamento de responsabilidades e governança com custos operacionais otimizados no BigQuery.


---

## 2. Camada Bronze: BigQuery External Tables

A camada Bronze atua como o catálogo tabular dos dados brutos armazenados no Google Cloud Storage (GCS). Ao utilizar **Tabelas Externas do BigQuery** com **Hive Partitioning**, a plataforma não duplica custos de armazenamento, consultando os arquivos Parquet diretamente do bucket com alto desempenho.

### 2.1 Buckets e Estratégia de Particionamento Hive

| Fonte | Bucket GCS | Padrão de Particionamento | Formato |
| :--- | :--- | :--- | :--- |
| **CEMADEN** | `gs://nimbus-506613-bronze-cemaden/` | `ano={ano:INT64}/mes={mes:INT64}/dia={dia:INT64}` | Parquet (Snappy) |
| **Open-Meteo Weather (Current)** | `gs://nimbus-506613-bronze-open-meteo/current/` | `ano={ano:INT64}/mes={mes:INT64}/dia={dia:INT64}` | Parquet (Snappy) |
| **Open-Meteo Weather (Hourly)** | `gs://nimbus-506613-bronze-open-meteo/forecast_hourly/` | `data_extracao={data_extracao:STRING}` | Parquet (Snappy) |
| **Open-Meteo Weather (Daily)** | `gs://nimbus-506613-bronze-open-meteo/forecast_daily/` | `data_extracao={data_extracao:STRING}` | Parquet (Snappy) |
| **Open-Meteo Marine (Current)** | `gs://nimbus-506613-bronze-marine/current/` | `ano={ano:INT64}/mes={mes:INT64}/dia={dia:INT64}` | Parquet (Snappy) |
| **Open-Meteo Marine (Hourly)** | `gs://nimbus-506613-bronze-marine/forecast_hourly/` | `data_extracao={data_extracao:STRING}` | Parquet (Snappy) |
| **Open-Meteo Marine (Daily)** | `gs://nimbus-506613-bronze-marine/forecast_daily/` | `data_extracao={data_extracao:STRING}` | Parquet (Snappy) |
| **Tomorrow.io (Hourly Forecast)** | `gs://nimbus-506613-bronze-tomorrow/forecast_hourly/` | `data_extracao={data_extracao:STRING}` | Parquet (Snappy) |
| **APAC Histórico (Chuva)** | `gs://nimbus-506613-bronze-apac/chuva/` | `data_extracao={data_extracao:STRING}` | Parquet (Snappy) |
| **APAC Metadados (Estações)** | `gs://nimbus-506613-bronze-apac/estacoes/` | Sem particionamento temporal | Parquet (Snappy) |

### 2.2 DDLs no BigQuery (`pipelines/load/ddl_bronze_external_tables.sql`)

Todas as tabelas foram criadas no dataset `nimbus_bronze_prod` utilizando as opções:
- `format = 'PARQUET'`
- `hive_partition_uri_prefix = 'gs://...'`
- `uris = ['gs://.../*']`

Exemplo de DDL com particionamento Hive triplo (`ano/mes/dia`):
```sql
CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.bronze_cemaden_telemetria`
WITH PARTITION COLUMNS (
    ano INT64,
    mes INT64,
    dia INT64
)
OPTIONS (
    format = 'PARQUET',
    hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-cemaden/cemaden/uf=PE',
    uris = ['gs://nimbus-506613-bronze-cemaden/cemaden/uf=PE/*']
);
```

### 2.3 Padronização do Scraper APAC (Fix de Parquet & Migração GCS)

O BigQuery impõe restrições estritas para nomes de colunas em arquivos Parquet:
- Devem iniciar com letras (`[a-zA-Z]`) ou sublinhado (`_`).
- Não podem conter barras ou caracteres acentuados.

**Ajuste Realizado:**
1. No extrator [`pipelines/extract/extract_apac.py`](file:///home/igortiburcio/Projetos/nimbus-platform/pipelines/extract/extract_apac.py), foi implementada a função `padronizar_colunas_apac()` para renomear colunas dinâmicas da tabela HTML de dias (`01` a `31`) para `dia_01` a `dia_31`, e converter cabeçalhos como `Mês/Ano` para `mes_ano` e `Código` para `codigo`.
2. Foi executada uma migração em lote in-place em todos os **330 arquivos Parquet legados** no bucket `gs://nimbus-506613-bronze-apac/`, eliminando qualquer inconsistência de leitura na tabela externa `bronze_apac_historico`.

---

## 3. Camada Silver: Modelagem com Dataform

A camada Silver (`nimbus_silver_prod`) transforma dados brutos e mutáveis em tabelas analíticas normalizadas, tipadas, limpas e otimizadas para consulta com particionamento diário e clustering.

### 3.1 Padrões de Qualidade e Governança nos Modelos SQLX

Todos os modelos em `dataform/definitions/silver/` seguem regras rígidas de engenharia analítica:
1. **Deduplicação Determinística:**  
   Aplicação de `QUALIFY ROW_NUMBER() OVER (PARTITION BY <chave_primaria_natural> ORDER BY data_extracao DESC) = 1` para garantir idempotência em reprocessamentos.
2. **Tipagem Defensiva (`SAFE_CAST`):**  
   Converte campos textuais ou numéricos flutuantes de forma segura para `FLOAT64`, `INT64`, `TIMESTAMP` ou `DATE`, prevenindo quebras de execução por strings mal formatadas.
3. **Otimização de Custos BigQuery:**  
   - `partitionBy`: `DATE(data_medicao)` ou `TIMESTAMP_TRUNC(data_extracao, DAY)`.
   - `clusterBy`: Chaves de alto filtro analítico como `codigo_estacao`, `cidade`, `ponto_monitoramento`.

### 3.2 Modelos Implementados

| Modelo Silver | Tabela Fonte Bronze | Granularidade / Chave Primária | Particionamento & Cluster |
| :--- | :--- | :--- | :--- |
| `silver_cemaden_telemetria` | `bronze_cemaden_telemetria` | `codigo_estacao`, `data_hora_leitura` | Partition: `TIMESTAMP_TRUNC(data_hora_leitura, DAY)`<br/>Cluster: `codigo_estacao`, `municipio` |
| `silver_open_meteo_weather_current` | `bronze_open_meteo_weather_current` | `cidade`, `horario_leitura` | Partition: `TIMESTAMP_TRUNC(horario_leitura, DAY)`<br/>Cluster: `cidade` |
| `silver_open_meteo_weather_hourly` | `bronze_open_meteo_weather_hourly` | `cidade`, `horario_previsao` | Partition: `TIMESTAMP_TRUNC(horario_previsao, DAY)`<br/>Cluster: `cidade` |
| `silver_open_meteo_weather_daily` | `bronze_open_meteo_weather_daily` | `cidade`, `data_previsao` | Partition: `data_previsao`<br/>Cluster: `cidade` |
| `silver_open_meteo_marine_current` | `bronze_open_meteo_marine_current` | `ponto_monitoramento`, `horario_leitura` | Partition: `TIMESTAMP_TRUNC(horario_leitura, DAY)`<br/>Cluster: `ponto_monitoramento` |
| `silver_open_meteo_marine_hourly` | `bronze_open_meteo_marine_hourly` | `ponto_monitoramento`, `horario_previsao` | Partition: `TIMESTAMP_TRUNC(horario_previsao, DAY)`<br/>Cluster: `ponto_monitoramento` |
| `silver_open_meteo_marine_daily` | `bronze_open_meteo_marine_daily` | `ponto_monitoramento`, `data_previsao` | Partition: `data_previsao`<br/>Cluster: `ponto_monitoramento` |
| `silver_tomorrow_hourly_forecast` | `bronze_tomorrow_hourly_forecast` | `polo_sentinela`, `horario_previsao` | Partition: `TIMESTAMP_TRUNC(horario_previsao, DAY)`<br/>Cluster: `polo_sentinela` |
| `silver_apac_historico` | `bronze_apac_historico` | `codigo_estacao`, `data_medicao` | Partition: `data_medicao`<br/>Cluster: `codigo_estacao`, `municipio` |

### 3.3 Destaque de Modelagem: UNPIVOT Histórico APAC

A tabela bruta da APAC armazenava medições em formato matricial de 31 colunas mensais (`dia_01`, `dia_02`, ..., `dia_31`). No modelo [`silver_apac_historico.sqlx`](file:///home/igortiburcio/Projetos/nimbus-platform/dataform/definitions/silver/silver_apac_historico.sqlx), os dados foram transformados em granularidade estritamente temporal via `UNPIVOT`:

```sql
WITH desnormalizado AS (
  SELECT
    SAFE_CAST(codigo AS STRING) AS codigo_estacao,
    SAFE_CAST(mes_ano AS STRING) AS mes_ano,
    SAFE_CAST(dia_str AS INT64) AS dia_mes,
    SAFE_CAST(chuva_mm_str AS FLOAT64) AS chuva_mm,
    ...
  FROM ${ref("bronze_apac_historico")}
  UNPIVOT (
    chuva_mm_str FOR dia_str IN (
      dia_01 AS '1', dia_02 AS '2', ..., dia_31 AS '31'
    )
  )
)
SELECT
  codigo_estacao,
  PARSE_DATE('%Y-%m-%d', CONCAT(ano, '-', mes, '-', LPAD(CAST(dia_mes AS STRING), 2, '0'))) AS data_medicao,
  chuva_mm,
  ...
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY codigo_estacao, data_medicao 
  ORDER BY data_extracao DESC
) = 1
```

Isso converteu milhões de células esparsas em uma série temporal contínua e deduplicada.

---

## 4. Dados Estáticos e Geoespaciais: Consolidação do Censo e Geometrias

Os dados complementares residem em `gs://nimbus-506613-geo-complementares/` e foram processados pelo script [`pipelines/load/load_silver_geo.py`](file:///home/igortiburcio/Projetos/nimbus-platform/pipelines/load/load_silver_geo.py), que carrega diretamente no BigQuery as seguintes tabelas Silver:

### 4.1 Tabelas Geoespaciais e Sociais Carregadas

1. **`silver_geo_bairros_pe`**: 705 bairros de Pernambuco extraídos do arquivo `bairros_pe.gpkg` com geometrias convertidas para WKT (`GEOGRAPHY` no BigQuery) e reprojetadas para EPSG:4326.
2. **`silver_ibge_municipios_pe`**: Metadados oficiais dos 185 municípios de Pernambuco (com destaque para os 14 da RMR).
3. **`silver_reindesc_desastres`**: 1.341 registros históricos de desastres naturais da RMR (alagamentos, deslizamentos, inundações).
4. **`silver_ibge_bairros_censo_pe`**: Tabela unificada dos indicadores sociais do Censo Demográfico 2022.

### 4.2 Consolidação dos 6 CSVs do Censo IBGE 2022

Em vez de criar 6 tabelas esparsas, os arquivos do Censo IBGE 2022 foram consolidados em uma única tabela analítica rica (`silver_ibge_bairros_censo_pe`), pois compartilham a mesma chave primária natural (`CD_BAIRRO`):
- `Basico_PE.csv` (População residente, domicílios particulares)
- `Alfabetizacao_PE.csv` (Taxa de alfabetização por bairro)
- `Domicilio_PE.csv` (Características do domicílio, esgotamento sanitário)
- `Entorno_PE.csv` (Infraestrutura urbana do entorno: bueiros, pavimentação, iluminação)
- `Pessoas_PE.csv` (Distribuição etária e grupos vulneráveis: idosos e crianças)
- `Responsavel_PE.csv` (Chefia familiar e rendimento médio)

**Garantia de Qualidade:**
- **Filtro PE:** `CD_BAIRRO LIKE '26%'` reduz o volume para os 660 bairros oficiais do estado.
- **Merge 1:1 sem fan-out:** Junção sequencial por `CD_BAIRRO` mantendo cardinalidade exata (660 linhas).
- **Prefixação clara:** Colunas nomeadas semanticamente (ex: `pop_total`, `taxa_alfabetizacao`, `domicilios_sem_esgoto`, `entorno_sem_bueiro`).

---

## 5. Orquestração Integrada: Prefect + Dataform CLI

A execução das transformações Silver é disparada de forma **subsequente e imediata** após o término bem-sucedido de cada ingestão Bronze no Prefect.

### 5.1 Decisão Arquitetural: Dataform CLI no Container Worker

> [!NOTE]
> **Por que utilizar o `@dataform/cli` em vez da API de Repositório do GCP Dataform?**  
> O repositório Nimbus é um monorepo (`pipelines/`, `dataform/`, `web/`, etc.). O serviço gerenciado do GCP Dataform exige que os arquivos de configuração (`workflow_settings.yaml` e `package.json`) residam na **raiz absoluta** do repositório Git, o que resultava no erro `404: Can't find package.json`.  
> Ao instalar o `@dataform/cli` diretamente no container do Prefect Worker, a execução roda localmente apontando para o diretório `/app/dataform`, compilando o projeto e enviando os jobs SQL diretamente à API do BigQuery com total flexibilidade e sem poluir a raiz do projeto.

### 5.2 Containerização do Prefect Worker (`Dockerfile.prefect`)

A imagem do worker foi estendida com suporte nativo a Node.js 20 e Dataform CLI:
```dockerfile
# Instalação do Node.js v20 e @dataform/cli global
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g @dataform/cli@3.0.0-beta.4 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalação de dependências do Dataform (@dataform/core)
COPY dataform/package.json /app/dataform/package.json
RUN cd /app/dataform && npm install
```

### 5.3 Task Genérica Reutilizável (`pipelines/flows/tasks/dataform_task.py`)

A task `task_run_dataform` foi criada com suporte a tags, retries e logs estruturados:
```python
@task(name="Dataform CLI Run", retries=2, retry_delay_seconds=30)
def task_run_dataform(tags: list[str] | None = None, full_refresh: bool = False) -> None:
    # Localiza credenciais via .df-credentials.json ou GOOGLE_APPLICATION_CREDENTIALS
    # Executa subprocesso: dataform run --tags <tag1>,<tag2>
    ...
```

### 5.4 Mapeamento dos Fluxos Prefect

Cada pipeline aciona sua respectiva tag Silver após salvar os arquivos Parquet no GCS:

| Prefect Workflow | Arquivo | Frequência | Tag Dataform Executada | Modelos Silver Afetados |
| :--- | :--- | :--- | :--- | :--- |
| `cemaden_flow` | `cemaden_workflow.py` | A cada 10 min | `silver_cemaden` | `silver_cemaden_telemetria` |
| `open_meteo_pipeline` | `open_meteo_workflow.py` | Horário (Current/Hourly) & Diário (Daily) | `silver_open_meteo_weather`, `silver_open_meteo_marine` | `silver_open_meteo_weather_*`<br/>`silver_open_meteo_marine_*` |
| `tomorrow_pipeline` | `tomorrow_workflow.py` | Horário (12h rolling) | `silver_tomorrow` | `silver_tomorrow_hourly_forecast` |
| `apac_pipeline` | `apac_workflow.py` | Diário | `silver_apac` | `silver_apac_historico` |

---

## 6. Estrutura de Arquivos Implementados

```text
nimbus-platform/
├── .gitignore                                      # Protege credenciais (.df-credentials.json)
├── dataform/
│   ├── .df-credentials.json                        # Configuração de credenciais do Dataform CLI
│   ├── package.json                                # Dependência @dataform/core v3.0.0-beta.4
│   ├── workflow_settings.yaml                      # defaultProject: nimbus-506613, defaultDataset: nimbus_bronze_prod
│   └── definitions/
│       ├── bronze/
│       │   └── declarations.js                     # Declaração das 10 tabelas externas no Dataform
│       └── silver/
│           ├── declarations_geo.js                 # Declaração das 4 tabelas estáticas no Dataform
│           ├── silver_apac_historico.sqlx          # Modelo Silver UNPIVOT APAC
│           ├── silver_cemaden_telemetria.sqlx      # Modelo Silver CEMADEN
│           ├── silver_open_meteo_weather_current.sqlx
│           ├── silver_open_meteo_weather_hourly.sqlx
│           ├── silver_open_meteo_weather_daily.sqlx
│           ├── silver_open_meteo_marine_current.sqlx
│           ├── silver_open_meteo_marine_hourly.sqlx
│           ├── silver_open_meteo_marine_daily.sqlx
│           └── silver_tomorrow_hourly_forecast.sqlx
├── pipelines/
│   ├── extract/
│   │   └── extract_apac.py                         # Padronização de colunas (dia_01..dia_31)
│   ├── load/
│   │   ├── ddl_bronze_external_tables.sql          # DDLs das tabelas externas no BigQuery
│   │   └── load_silver_geo.py                      # Carga dos dados Geo/Censo (GPKG + CSVs)
│   └── flows/
│       ├── Dockerfile.prefect                      # Imagem do worker com Node.js + @dataform/cli
│       ├── tasks/
│       │   ├── __init__.py
│       │   └── dataform_task.py                    # Task Python do Prefect para rodar Dataform
│       ├── cemaden_workflow.py                     # Chamada subsequente task_run_dataform
│       ├── open_meteo_workflow.py                  # Chamada subsequente task_run_dataform
│       ├── tomorrow_workflow.py                    # Chamada subsequente task_run_dataform
│       └── apac_workflow.py                        # Chamada subsequente task_run_dataform
└── docs/
    └── documentacao_camadas_bronze_e_silver.md     # Este documento
```

---

## 7. Próximos Passos para Ativação em Produção

1. **Revisão e Aprovação:**  
   Confirmar se a documentação e os arquivos alterados atendem plenamente às especificações.
2. **Commit e Push na Branch:**  
   ```bash
   git add .
   git commit -m "feat(silver): implementar modelos silver dataform e integracao dataform cli no prefect"
   git push origin feature/bronze-external-tables
   ```
3. **Pull Request & Merge na `main`:**  
   Ao mergear na branch `main`, a esteira CI/CD ([`.github/workflows/deploy.yml`](file:///home/igortiburcio/Projetos/nimbus-platform/.github/workflows/deploy.yml)) no servidor de produção (`debian@nimbus-server-prod`) executará automaticamente:
   - `docker-compose up -d --build prefect-worker` (reconstruindo a imagem com Node.js e Dataform CLI).
   - Re-deploy dos flows atualizados via `task flow:deploy`.
4. **Execução Única da Carga Geo/Censo (One-off):**  
   No servidor de produção, executar a carga inicial das tabelas estáticas:
   ```bash
   docker exec -it nimbus_prefect_worker python pipelines/load/load_silver_geo.py
   ```
5. **Acompanhamento no Prefect UI:**  
   Verificar a execução automática dos próximos runs agendados pelo Prefect, garantindo que a task `Dataform CLI Run` conclua com sucesso após cada ingestão.
