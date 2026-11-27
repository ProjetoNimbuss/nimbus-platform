# Dataform — Regras

Projeto `nimbus-506613`, região `southamerica-east1`, Dataform core 3.0.0 (`workflow_settings.yaml`).

## Arquitetura Medallion

| Camada | Onde | Schema |
| :--- | :--- | :--- |
| Bronze | Tabelas externas GCS, declaradas em `definitions/bronze/declarations.js` | `nimbus_bronze_prod` |
| Silver | `definitions/silver/silver_<fonte>_<entidade>.sqlx` | `nimbus_silver_prod` |
| Gold | `definitions/gold/gold_<visao_de_negocio>.sqlx` | schema gold |

Nova tabela Bronze → criar DDL em `pipelines/load/ddl_bronze_external_tables.sql` **e** adicionar o nome
no array `bronzeTables` de `declarations.js`.

## Padrão Silver

- `type: "incremental"` com `uniqueKey`.
- `bigquery: { partitionBy: "DATE(<coluna_ts>)", clusterBy: [...] }`.
- `SAFE_CAST` em todo cast; `TRIM`/`UPPER` em strings de localização; `NULLIF(TRIM(x), "")`.
- Deduplicação: `QUALIFY ROW_NUMBER() OVER (PARTITION BY <chave> ORDER BY ingestao_ts DESC) = 1`.
- `assertions: { nonNull: [...], uniqueKey: [...] }` obrigatórias.

## Padrão Gold

- `type: "table"` (ou `view` se leve), focado em consumo pela API.
- Colunas com nomes de negócio, prontas para o contrato da API.

## Regras gerais

- Sempre `${ref("tabela")}` — nunca `projeto.dataset.tabela` literal.
- `tags: [camada, fonte, ...]` — a tag da fonte é usada pelo Prefect (`task_run_dataform(tags=[...])`).
- `description` obrigatória no `config`.
- Constantes/funções compartilhadas em `includes/`.
- Valide com `dataform compile` dentro de `dataform/` antes de concluir.
- Nunca rode `dataform run` contra produção sem confirmação do usuário.
- Skill: `modelo-dataform`.
