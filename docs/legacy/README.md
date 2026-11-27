# 📦 Documentos Legados e Históricos — Nimbus

Este diretório contém documentações históricas de fases anteriores do projeto **Nimbus**, preservadas para fins de registro técnico e rastreabilidade evolutiva.

---

## 📑 Relação dos Arquivos Arquivados

1. **`legacy-ingestao-bronze.md`**:  
   Documentação técnica inicial da fase de prototipação local (ingestão gravando em MinIO S3 local e registro de VIEWs no DuckDB).

2. **`legacy-arquitetura-dados-v1.md`**:  
   Versão 1.0 da arquitetura de dados (desenho inicial on-premise com MinIO, DuckDB e dbt Core).

3. **`legacy-resumo-tecnico.md`**:  
   Resumo executivo do projeto piloto ("PEPluvi / rmr-alertas") citando orquestração com Apache Airflow (Astro CLI), DuckDB e FastAPI.

4. **`legacy-camadas-bronze-silver.md`**:  
   Primeira versão da documentação em nuvem cobrindo as camadas Bronze e Silver no BigQuery e Dataform. Foi unificada e superada pelo documento definitivo da arquitetura.

5. **`legacy-analise-arquitetural.md`**:  
   Análise comparativa inicial da reestruturação de pastas e transição de infraestrutura (agosto de 2026).

6. **`legacy-branch-watch-vigil.md`**:  
   Relatório de entrega de sprint da branch pontual de wireframes do frontend (`feat/wireframes-nimbus-watch-vigil`).

---

> ℹ️ **Documentação Vigente Oficial:**  
> Para consultar a arquitetura atual de dados em produção (Google Cloud Storage, BigQuery, Dataform SQLX, Prefect 3 e as camadas Bronze, Silver e Gold), consulte o documento oficial:  
> 👉 [**`docs/arquitetura-e-dados.md`**](../arquitetura-e-dados.md)
