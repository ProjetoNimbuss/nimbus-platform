---
name: debug-pipeline
description: >-
  Use quando um flow Prefect do Nimbus falhar, ficar travado, ou quando dados não
  aparecerem no GCS, no BigQuery (Bronze/Silver/Gold), na API ou no frontend.
  Runbook de diagnóstico em camadas.
---

# Debug de pipeline

Siga as camadas **em ordem** e pare na primeira com falha. Não rode comandos destrutivos
(`task clean`, recriar volumes, `dataform run` em produção) sem confirmação do usuário.

| # | Camada | Verificação | Sinal de problema |
| :-- | :--- | :--- | :--- |
| 1 | Containers | `task status` | `prefect-server`/`prefect-worker` fora de `Up` |
| 2 | Logs | `task logs:worker` · UI `http://localhost:4200` (Flow Runs) | Traceback, `Crashed`, `Late` |
| 3 | Fonte | `curl -sS -m 30 <URL>` (URL em `pipelines/config/settings.py`) | Timeout, 4xx/5xx, schema mudou |
| 4 | Execução isolada | `task flow:<fonte>` | Erro reproduzível |
| 5 | GCS | Existe `gs://<bucket>/ano=YYYY/mes=MM/dia=DD/` de hoje? | Sem partição nova |
| 6 | Bronze | `SELECT COUNT(*) FROM nimbus_bronze_prod.<tabela>` | Erro de schema Parquet |
| 7 | Dataform | Log `[DATAFORM ERRO]`; dataset `nimbus_assertions` | Compilação/assertion falhou |
| 8 | Silver/Gold | `SELECT MAX(data_hora)` na tabela | Dado atrasado |
| 9 | API/Web | `task logs:api` · `curl localhost:8000/api/v1/...` | Ver skills `endpoint-api` / `pagina-web` |

## Erros conhecidos

| Sintoma | Causa provável | Correção |
| :--- | :--- | :--- |
| `ValueError: GCP_PROJECT_ID é obrigatória` | `.env` sem variável / não montado no container | Pedir ao usuário para conferir `.env` (não ler o arquivo) |
| `ArrowTypeError` / `ArrowInvalid` ao salvar | Coluna com tipos mistos | `astype(str)` / `pd.to_numeric(errors="coerce")` no extract |
| Bronze: `Incompatible partition schemas` / tipo divergente | Parquet novo com tipo diferente dos antigos | Padronizar tipo no extract; alinhar DDL |
| `Dataform CLI falhou` + `credentials` | `.df-credentials.json`/ADC ausente | Ver `ensure_df_credentials` em `flows/tasks/dataform_task.py` |
| `Assertion failed ... uniqueKey` | Dedup insuficiente | Revisar `QUALIFY ROW_NUMBER()` e `uniqueKey` |
| APAC: `WebDriverException` / `SessionNotCreated` | Chrome/driver incompatível no worker | Revisar `flows/Dockerfile.prefect` |
| Flow `Late` e nunca roda | Worker sem pool `default-agent-pool` / deployment antigo | `task flow:deploy`, reiniciar worker |
| HTTP 429 (Tomorrow.io) | Limite da API key | Reduzir frequência no `deploy.py` |

## Saída esperada

Relate ao usuário: camada da falha, evidência (trecho de log), causa raiz e correção proposta/aplicada.
