---
name: modelo-dataform
description: >-
  Use quando for criar ou alterar modelos SQLX das camadas Silver ou Gold no Dataform
  (BigQuery) do Nimbus, incluindo particionamento, deduplicação, assertions e tags que
  conectam o modelo aos flows Prefect.
---

# Modelo Dataform (Silver / Gold)

Leia `dataform/AGENTS.md` antes. Referência: `definitions/silver/silver_cemaden_telemetria.sqlx`.

## Passos

1. **Camada**
   - Silver = limpeza/tipagem/dedup de **uma** fonte Bronze.
   - Gold = visão de negócio (juntando Silvers) pronta para a API.
2. **Dependência existe?** Bronze precisa estar em `definitions/bronze/declarations.js`;
   Silver referenciada precisa existir em `definitions/silver/`.
3. **Copiar template**: [silver_template.sqlx](examples/silver_template.sqlx) ou
   [gold_template.sqlx](examples/gold_template.sqlx).
4. **Config**
   - Silver: `incremental`, `uniqueKey`, `partitionBy: "DATE(<ts>)"`, `clusterBy` (colunas de filtro comuns: cidade, estação).
   - Tags: `[camada, fonte, entidade]`. A tag da fonte **deve** bater com `task_run_dataform(tags=[...])` do flow.
   - `description` clara.
5. **SQL**
   - CTE `bronze_limpa` com `SAFE_CAST`, `TRIM`, `UPPER`, `NULLIF(TRIM(x), "")`, filtros de nulos na chave.
   - Valores físicos impossíveis → `NULL` (ex.: chuva negativa).
   - `QUALIFY ROW_NUMBER() OVER (PARTITION BY <chave> ORDER BY ingestao_ts DESC) = 1`.
6. **Assertions**: `nonNull` na chave + timestamp; `uniqueKey` igual ao config.
7. **Compilar**: em `dataform/`, `dataform compile` (ou `npx @dataform/cli compile`). Sem erros.
8. **Executar** (só com confirmação do usuário — escreve em produção):
   `dataform run --tags <fonte>` ou via `task flow:<fonte>`.
9. **Gold alterada?** Verifique impacto em `docs/api-contrato.md` e endpoints da API.

## Validação

- Compilação limpa; assertions passam (dataset `nimbus_assertions`).
- `SELECT <chave>, COUNT(*) ... GROUP BY 1 HAVING COUNT(*) > 1` retorna vazio.
