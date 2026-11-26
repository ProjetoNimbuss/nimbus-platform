# Resumo Técnico: Sistema de Alertas Climáticos (PEPluvi / rmr-alertas)

## Visão Geral
O projeto **PEPluvi (rmr-alertas)** é uma plataforma end-to-end de monitoramento e análise de dados pluviométricos (chuvas) do estado de Pernambuco, com foco na Região Metropolitana do Recife. O sistema integra dados históricos da APAC (desde 1961) e dados em tempo real do CEMADEN (atualizados a cada 15 minutos).

A arquitetura é dividida em três pilares principais: **Pipeline de Dados (ETL)**, **API Backend** e **Frontend Web**.

---

## 1. Pipeline de Dados e Analytics (ETL/ELT)
Responsável pela coleta, processamento, qualidade e armazenamento dos dados. Utiliza uma Arquitetura Medalhão (Bronze, Silver, Gold).

* **Orquestração:** **Apache Airflow** (via Astro CLI). Gerencia duas DAGs principais: uma diária (histórico APAC) e uma a cada 15 minutos (tempo real CEMADEN).
* **Extração (Scraping & APIs):** Scripts em **Python 3.11+**.
  * **APAC:** Uso de **Selenium** para automação e extração de dados históricos.
  * **CEMADEN & IBGE:** Consumo de APIs REST.
* **Armazenamento Bruto (Raw):** Dados salvos localmente em arquivos **Apache Parquet**, utilizando particionamento estilo Hive (`ano/mes/dia`).
* **Data Warehouse / OLAP:** **DuckDB**. Atua como o motor analítico embarcado ultrarrápido, rodando localmente (`pepluvi.duckdb`) e consultando arquivos Parquet.
* **Transformação e Qualidade:** **dbt (Data Build Tool)**.
  * **Bronze:** Views dinâmicas (*Zero-Copy*) diretamente sobre os Parquets.
  * **Silver:** Deduplicação, limpeza, enriquecimento espacial e join com IBGE.
  * **Gold:** Tabelas desnormalizadas para consumo direto. Inclui KPIs anuais, acumulados móveis (15min até 24h) e ranqueamento de eventos extremos. Além disso, executa testes rigorosos de qualidade de dados (`dbt test`).

---

## 2. Backend API (`rmr-api`)
Camada de serviço RESTful que expõe os dados processados para a aplicação web de forma otimizada.

* **Framework:** **FastAPI** rodando via **Uvicorn** (Python).
* **Integração de Dados:** Conecta-se diretamente ao banco **DuckDB** (somente leitura).
* **Otimização:** Durante a inicialização (`lifespan`), a API cria conexões em memória e *materialized views* a partir dos arquivos Parquet recentes do CEMADEN para garantir tempos de resposta de milissegundos.
* **Endpoints Principais:** Fornece séries temporais de precipitação por estação (`/stations`), informações do nível de alerta (`/alertas`) e riscos espacializados em grids/municípios.

---

## 3. Frontend Web (`rmr-web`)
Aplicação rica e interativa para visualização dos dados climáticos e painel de alertas para o usuário final.

* **Framework:** **Next.js 16** (com **React 19**) e **TypeScript**.
* **Estilização & UI:** **TailwindCSS 4** para design system e responsividade. Suporte a temas (Dark/Light mode) gerenciado por `next-themes`.
* **Animações e Ícones:** **Framer Motion** para micro-interações fluidas e transições, além de **Lucide React** para iconografia.
* **Mapas e Visualização Espacial:**
  * Mapas interativos 2D baseados em **Leaflet** (`react-leaflet`).
  * Capacidade para renderização 3D avançada utilizando a stack **Three.js** (`@react-three/fiber` e `@react-three/drei`).
* **Gráficos e Dashboards:** **Recharts** para exibição limpa e performática de séries temporais de chuva.
* **Consumo de API:** **SWR** (da Vercel) para requisições com cache, revalidação automática e reatividade em tempo real consumindo a FastAPI.
