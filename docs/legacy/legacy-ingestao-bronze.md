#  Documentação de Ingestão de Dados da Camada Bronze 

> **Projeto:** Nimbus — Sistema de Alertas Climáticos da Região Metropolitana do Recife (RMR)  
> **Camadas Cobertas:** Raw (MinIO S3) → Bronze (DuckDB `nimbus.duckdb`)  
> **Última Atualização:** 16/08/2026 

---

##  1. Visão Geral

A camada de ingestão do projeto Nimbus coleta dados de **5 fontes externas distintas** e **1 carga estática** (dados complementares). Cada fonte possui um ou mais scripts Python dedicados em `include/pipeline/extract/`, responsáveis por:

1. **Extrair** dados da fonte (API REST / Web Scraping / Arquivo);
2. **Estruturar** em DataFrame pandas com tipagem correta;
3. **Persistir** em formato Parquet (com compressão Snappy) no MinIO (Data Lake Raw);
4. **Registrar** a VIEW/TABLE correspondente no schema `bronze` do `nimbus.duckdb`.

---

##  2. Ferramentas Utilizadas na Ingestão

| Ferramenta | Versão | Finalidade |
| :--- | :--- | :--- |
| **Python** | 3.12 | Linguagem de todos os scripts de extração |
| **pandas** | ≥ 2.0 | Manipulação de DataFrames, cast de tipos |
| **pyarrow** | ≥ 15 | Serialização Parquet com compressão Snappy |
| **s3fs** | latest | Interface S3-compatible para escrita no MinIO |
| **requests** | latest | Consumo de APIs REST (Open-Meteo, CEMADEN, Tomorrow.io) |
| **selenium** | 4.x | Automação de browser para scraping do portal APAC |
| **BeautifulSoup4** | latest | Parsing HTML das tabelas do portal APAC |
| **MinIO (SDK `minio`)** | latest | Gerenciamento de buckets via `setup_minio.py` |
| **DuckDB** | ≥ 0.10 | Registro das VIEWs/TABLEs no schema `bronze` |
| **DuckDB `httpfs`** | built-in | Extensão para leitura de Parquet remoto via S3 |
| **DuckDB `spatial`** | built-in | Extensão para leitura de arquivos GeoPackage (GPKG) |

---

## 3. Fontes de Dados & Scripts de Ingestão

---

### 3.1 Open-Meteo Weather API

| Atributo                      | Valor                                                                                  |
| :---------------------------- | :------------------------------------------------------------------------------------- |
| **Tipo da Fonte**             | API REST — Gratuita, sem autenticação                                                  |
| **Dados Fornecidos**          | Condições meteorológicas atuais e previsão (temperatura, umidade, precipitação, vento) |
| **Cobertura Geográfica**      | 14 municípios da RMR (ver `CITIES` nos scripts)                                        |
| **Frequência de Atualização** | Horária (dados atuais) / Diária (previsão 7 dias)                                      |
| **Documentação Oficial**      | https://open-meteo.com/en/docs                                                         |
| **Endpoint Base**             | `https://api.open-meteo.com/v1/forecast`                                               |

**Scripts de Extração:**

| Script | Descrição | Bucket Destino | Particionamento | Bronze Object |
| :--- | :--- | :--- | :--- | :--- |
| [`extract_open_meteo_current.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_open_meteo_current.py) | Coleta condições meteorológicas **atuais** para as 14 cidades da RMR em uma única requisição batch | `open-meteo-weather` | `current/uf=PE/ano/mes/dia/` | `bronze.open_meteo_current` (VIEW) |
| [`extract_open_meteo_hourly.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_open_meteo_hourly.py) | Coleta **previsão horária** 7 dias para as 14 cidades da RMR | `open-meteo-weather` | `forecast_hourly/uf=PE/data_extracao/` | `bronze.open_meteo_forecast_hourly` (VIEW) |
| [`extract_open_meteo_daily.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_open_meteo_daily.py) | Coleta **previsão diária** 7 dias para as 14 cidades da RMR | `open-meteo-weather` | `forecast_daily/uf=PE/data_extracao/` | `bronze.open_meteo_forecast_daily` (VIEW) |

**Municípios monitorados:** Recife, Jaboatão dos Guararapes, Olinda, Paulista, Camaragibe, São Lourenço da Mata, Abreu e Lima, Igarassu, Cabo de Santo Agostinho, Ipojuca, Moreno, Itapissuma, Ilha de Itamaracá, Araçoiaba.

---

### 3.2 Open-Meteo Marine API

| Atributo                      | Valor                                                                  |
| :---------------------------- | :--------------------------------------------------------------------- |
| **Tipo da Fonte**             | API REST — Gratuita, sem autenticação                                  |
| **Dados Fornecidos**          | Condições oceanográficas (altura e período de ondas, swell, correntes) |
| **Cobertura Geográfica**      | 9 pontos costeiros da RMR                                              |
| **Frequência de Atualização** | Horária (dados atuais) / Diária (previsão 5 dias)                      |
| **Documentação Oficial**      | https://open-meteo.com/en/docs/marine-weather-api                      |
| **Endpoint Base**             | `https://marine-api.open-meteo.com/v1/marine`                          |

**Scripts de Extração:**

| Script | Descrição | Bucket Destino | Particionamento | Bronze Object |
| :--- | :--- | :--- | :--- | :--- |
| [`extract_open_meteo_marine_current.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_open_meteo_marine_current.py) | Coleta condições marinhas **atuais** em 9 pontos costeiros | `open-meteo-marine` | `current/uf=PE/ano/mes/dia/` | `bronze.open_meteo_marine_current` (VIEW) |
| [`extract_open_meteo_marine_hourly.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_open_meteo_marine_hourly.py) | Coleta **previsão horária** 5 dias das condições marinhas | `open-meteo-marine` | `forecast_hourly/uf=PE/data_extracao/` | `bronze.open_meteo_marine_forecast_hourly` (VIEW) |
| [`extract_open_meteo_marine_daily.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_open_meteo_marine_daily.py) | Coleta **previsão diária** 5 dias das condições marinhas | `open-meteo-marine` | `forecast_daily/uf=PE/data_extracao/` | `bronze.open_meteo_marine_forecast_daily` (VIEW) |

**Pontos Costeiros Monitorados:** Recife - Boa Viagem, Porto do Recife, Olinda - Orla, Paulista - Maria Farinha, Ilha de Itamaracá, Jaboatão - Candeias, Cabo - Gaibu, Porto de Suape, Ipojuca - Porto de Galinhas.

---

### 3.3 Tomorrow.io API

| Atributo | Valor |
| :--- | :--- |
| **Tipo da Fonte** | API REST — Requer autenticação via `TOMORROW_IO_API_KEY` (`.env`) |
| **Dados Fornecidos** | Nowcasting e previsão horária de alta precisão (precipitação, vento, visibilidade, etc.) |
| **Cobertura Geográfica** | 4 Pólos Sentinela da RMR |
| **Frequência de Atualização** | Horária (previsão 12h rolling) |
| **Documentação Oficial** | https://docs.tomorrow.io/reference/welcome |
| **Endpoint Base** | `https://api.tomorrow.io/v4/weather/forecast` |
| **Autenticação** | API Key via query param `apikey` — configurada em `.env` como `TOMORROW_IO_API_KEY` |

**Scripts de Extração:**

| Script | Descrição | Bucket Destino | Particionamento | Bronze Object |
| :--- | :--- | :--- | :--- | :--- |
| [`extract_tomorrow_io.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_tomorrow_io.py) | Consulta previsão horária de 12h para os 4 Pólos Sentinela. Realiza uma requisição por polo com `time.sleep(0.5)` entre chamadas para respeitar rate limits. | `tomorrow-api` | `hourly_forecast/uf=PE/data_ingestao/` | `bronze.tomorrow_io_hourly_forecast` (VIEW) |

**Pólos Sentinela:** Polo Central (Recife), Polo Norte (Paulista), Polo Sul (Cabo de Santo Agostinho), Polo Oeste (São Lourenço da Mata).

---

### 3.4 CEMADEN — API de Telemetria Pluviométrica

| Atributo                      | Valor                                                                                |
| :---------------------------- | :----------------------------------------------------------------------------------- |
| **Tipo da Fonte**             | API REST — Endpoint interno da APAC (sem autenticação pública)                       |
| **Dados Fornecidos**          | Leituras de chuva em tempo real de estações pluviométricas automáticas de Pernambuco |
| **Cobertura Geográfica**      | Estações do CEMADEN em todo o estado de PE                                           |
| **Frequência de Atualização** | A cada execução (dados do momento da chamada)                                        |
| **Endpoint**                  | `http://dados.apac.pe.gov.br:41120/cemaden/`                                         |
| **Documentação**              | ------                                                                               |

**Scripts de Extração:**

| Script | Descrição | Bucket Destino | Particionamento | Bronze Object |
| :--- | :--- | :--- | :--- | :--- |
| [`extract_cemaden.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_cemaden.py) | Consome a API, normaliza o campo JSON aninhado `Dados_completos`, padroniza colunas e realiza cast de tipos antes de persistir. A data de partição é derivada do campo `data_hora` mais recente do lote. | `cemaden-api` | `ano/mes/dia/` | `bronze.data_cemaden` (VIEW) |

---

### 3.5 APAC — Scraping Histórico Pluviométrico

| Atributo | Valor |
| :--- | :--- |
| **Tipo da Fonte** | Web Scraping — Portal público APAC PE |
| **Dados Fornecidos** | Série histórica de precipitação mensal por posto pluviométrico (desde 1961) |
| **Cobertura Geográfica** | 5 Mesorregiões do estado de Pernambuco |
| **Frequência de Atualização** | Pontual / Periódica (script de atualização anual) |
| **URL** | http://old.apac.pe.gov.br/meteorologia/monitoramento-pluvio.php |
| **Ferramenta de Scraping** | Selenium (Chrome headless) + BeautifulSoup |

**Scripts de Extração:**

| Script | Descrição | Bucket Destino | Particionamento | Bronze Object |
| :--- | :--- | :--- | :--- | :--- |
| [`extract_apac.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/pipeline/extract/extract_apac.py) | Automatiza o browser para selecionar mesorregião e intervalo de datas no portal APAC. Extrai a tabela HTML via BeautifulSoup, valida o ano dos dados (para evitar dados cruzados do site), e persiste um arquivo Parquet por mesorregião/ano. Possui lógica de idempotência — pula arquivos já existentes no S3. | `web-scraping-apac` | `{Mesorregiao}_{Ano}.parquet` (flat) | `bronze.apac_historico` (VIEW) |

**Mesorregiões Cobertas:** Metropolitana do Recife, Mata Pernambucana, Agreste Pernambucano, São Francisco Pernambucano, Sertão Pernambucano.

---

### 3.6 Dados Geográficos & Demográficos Complementares (IBGE / REINDESC(Cemaden))

| Atributo                      | Valor                                                                                                                                                                      |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo da Fonte**             | Carga estática (load manual)                                                                                                                                               |
| **Dados Fornecidos**          | Malha vetorial de bairros de PE (GeoPackage), Censo 2022 IBGE por bairros (demografia, alfabetização, domicílios, cor/raça), tabela de ocorrências de desastres (REINDESC) |
| **Cobertura Geográfica**      | Brasil (bairros) — serão filtrados para PE/RMR nas camadas Silver/Gold                                                                                                     |
| **Frequência de Atualização** | Estática — atualizada a cada novo Censo IBGE ou publicação do REINDESC                                                                                                     |
| **Fontes Originais**          | IBGE Censo 2022 (https://censo2022.ibge.gov.br/) / REINDESC (https://s2id.mi.gov.br) / IBGE GPKG (https://www.ibge.gov.br/geociencias/downloads-geociencias.html)          |

**Método de Carga:**

Não há script automatizado. Os arquivos foram copiados manualmente para o bucket `dados-geo-complementares` no MinIO. 

**Bronze Objects (Tabelas Físicas Nativas — BASE TABLE):**

| Bronze Table                        | Arquivo Fonte                                             | Registros |
| :---------------------------------- | :-------------------------------------------------------- | :-------- |
| `bronze.geo_bairros_pe`             | `PE_bairros_CD2022.gpkg`                                  | 705       |
| `bronze.reindesc_ocorrencias`       | `reindesc_tabela_ocorrencias.csv`                         | 1.441     |
| `bronze.ibge_bairros_demografia`    | `Agregados_por_bairros_demografia_BR.csv`                 | 11.770    |
| `bronze.ibge_bairros_alfabetizacao` | `Agregados_por_bairros_alfabetizacao_BR.csv`              | 11.770    |
| `bronze.ibge_bairros_cor_raca`      | `Agregados_por_bairros_cor_ou_raca_BR.csv`                | 11.770    |
| `bronze.ibge_bairros_domicilio1`    | `Agregados_por_bairros_caracteristicas_domicilio1_BR.csv` | 11.770    |
| `bronze.ibge_bairros_domicilio2`    | `Agregados_por_bairros_caracteristicas_domicilio2_BR.csv` | 11.770    |
| `bronze.ibge_bairros_domicilio3`    | `Agregados_por_bairros_caracteristicas_domicilio3_BR.csv` | 11.770    |

> **Nota:** Diferente das fontes dinâmicas (que usam VIEWs externas sobre o S3), os dados estáticos são materializados como **tabelas físicas nativas** no DuckDB, garantindo performance máxima em JOINs sem dependência de rede.

---

##  4. Buckets do Data Lake (MinIO)

| Bucket                     | Fonte                  | Tipo de Objeto   | Requer Atualização |
| :------------------------- | :--------------------- | :--------------- | :----------------- |
| `open-meteo-weather`       | Open-Meteo Weather API | Parquet (Snappy) | Contínua           |
| `open-meteo-marine`        | Open-Meteo Marine API  | Parquet (Snappy) | Contínua           |
| `tomorrow-api`             | Tomorrow.io API        | Parquet (Snappy) | Contínua           |
| `cemaden-api`              | CEMADEN (via APAC)     | Parquet (Snappy) | Contínua           |
| `web-scraping-apac`        | Portal APAC PE         | Parquet (Snappy) | Periódica          |
| `dados-geo-complementares` | IBGE / REINDESC / GPKG | CSV, GPKG        | Estático           |

---

##  5. Credenciais & Segurança

- Todas as credenciais (MinIO, API Keys) são gerenciadas via arquivo `.env` na raiz do projeto.
- As configurações são centralizadas em [`include/config/settings.py`](file:///home/igortiburcio/Projetos/RMR_Alertas/rmr-alertas/include/config/settings.py), que carrega o `.env` via `python-dotenv`.
- O arquivo `.env` e o banco `nimbus.duckdb` estão no `.gitignore` — nunca são versionados.

**Variáveis de ambiente relevantes:**

| Variável | Uso |
| :--- | :--- |
| `MINIO_ENDPOINT` | URL do MinIO local (`http://localhost:9000`) |
| `AWS_ACCESS_KEY_ID` | Access key do MinIO |
| `AWS_SECRET_ACCESS_KEY` | Secret key do MinIO |
| `TOMORROW_IO_API_KEY` | Chave da API Tomorrow.io |
| `APAC_BASE_URL` | URL do portal APAC (scraping) |
