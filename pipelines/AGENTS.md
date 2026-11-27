# Pipelines — Regras

Stack: Python ≥ 3.10, pandas, pyarrow, requests/selenium, **Prefect 3**, Google Cloud Storage.
**Não use Airflow** (legado removido).

## Estrutura obrigatória

| Caminho | Contrato |
| :--- | :--- |
| `config/settings.py` | Toda URL, bucket (`BUCKETS`), API key via `os.getenv`. Nada fixo nos extractors. |
| `extract/extract_<fonte>[_<granularidade>].py` | Expõe `fetch_data() -> pd.DataFrame` e `save_partitioned(df) -> str` |
| `storage/gcs.py` | Única porta de escrita no GCS (`save_dataframe_to_gcs`, partição `ano=/mes=/dia=`) |
| `flows/<fonte>_workflow.py` | `@flow(name="<fonte>-ingestion-flow", log_prints=True)` |
| `flows/deploy.py` | Registro do deployment (cron + tags) |
| `flows/tasks/dataform_task.py` | `task_run_dataform(tags=[...])` dispara a Silver |
| `load/ddl_bronze_external_tables.sql` | DDL das tabelas externas Bronze |

## Qualidade dos dados

- Renomear colunas para `snake_case` em PT.
- Tipagem explícita antes de salvar: `pd.to_numeric(errors="coerce")`, `pd.to_datetime`, `astype(str)`
  — tipos mistos quebram o Parquet/tabela externa.
- Sempre adicionar a coluna `ingestao_ts = datetime.now()`.
- Selecionar explicitamente as colunas finais (lista `cols`) — schema estável.

## Resiliência

- `requests` sempre com `timeout=30` e `response.raise_for_status()`.
- Tasks de fetch: `task(fetch_data, name="fetch-<fonte>-data", retries=3, retry_delay_seconds=30)`.
- DataFrame vazio → não salva, retorna `""`; o flow só dispara Dataform se houver `gcs_path`.

## Encadeamento

Bronze salvo → `task_run_dataform(tags=["<fonte>"])`. A tag deve existir nos modelos Silver da fonte.

## Estilo

- Ruff: `line-length=100`, regras E/F/W. Rode `task lint` ao final.
- Use `print` com prefixo (`[GCS]`, `[DATAFORM]`) — `log_prints=True` envia ao Prefect.
- Nunca imprima segredos.

## Execução

- Rodar flow: `task flow:<fonte>` (dentro do worker). Registrar deployments: `task flow:deploy`.
- Para criar uma fonte nova, use a skill `nova-fonte-dados`. Para falhas, `debug-pipeline`.
