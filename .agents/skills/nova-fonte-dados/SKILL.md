---
name: nova-fonte-dados
description: >-
  Use quando o usuário pedir para integrar uma nova fonte de dados meteorológicos ou
  hidrológicos (API REST ou scraping) no Nimbus, cobrindo extract Python, gravação Bronze
  no GCS, flow Prefect, deployment agendado, tabela externa e modelo Silver no Dataform.
---

# Nova fonte de dados (ponta a ponta)

Referência viva: CEMADEN (`pipelines/extract/extract_cemaden.py`,
`pipelines/flows/cemaden_workflow.py`, `dataform/definitions/silver/silver_cemaden_telemetria.sqlx`).

## 0. Levantamento (pergunte ao usuário se faltar)

- URL/endpoint, autenticação (API key?), formato (JSON/HTML), frequência de atualização.
- Chave natural do registro (ex.: `codigo_estacao + data_hora`) e coluna de timestamp.
- Nome curto da fonte em snake_case → `<fonte>` (ex.: `inmet`).

## 1. Configuração — `pipelines/config/settings.py`

- Adicione URL e, se houver, `os.getenv("<FONTE>_API_KEY", "")`.
- Adicione `"<fonte>": f"{GCP_PROJECT_ID}-bronze-<fonte>"` em `BUCKETS`.
- Documente variáveis novas em `.env.example` (nunca edite `.env`).
- Avise o usuário que o bucket precisa existir no GCS (não crie recursos de nuvem sem confirmação).

## 2. Extract — `pipelines/extract/extract_<fonte>.py`

Copie [extract_template.py](examples/extract_template.py). Garanta:
`fetch_data()` com `timeout=30` + `raise_for_status()`, renomear colunas, tipagem explícita,
`ingestao_ts`, lista `cols` final; `save_partitioned(df)` usando `save_dataframe_to_gcs`.

## 3. Flow — `pipelines/flows/<fonte>_workflow.py`

Copie [workflow_template.py](examples/workflow_template.py). Retries no fetch; Dataform só se houver `gcs_path`.

## 4. Deployment — `pipelines/flows/deploy.py`

Adicione bloco `flow.from_source(...).to_deployment(name="<fonte>-<frequencia>", cron=..., tags=[...])`
e inclua na chamada final `deploy(...)`, seguindo os blocos existentes.

## 5. Taskfile — `Taskfile.yml`

```yaml
  flow:<fonte>:
    desc: Executa o fluxo de ingestão <Fonte> no contêiner do worker
    cmds:
      - docker-compose exec prefect-worker python pipelines/flows/<fonte>_workflow.py
```
Atualize `docs/guia-taskfile.md`.

## 6. Bronze — tabela externa

- Acrescente DDL em `pipelines/load/ddl_bronze_external_tables.sql` usando
  [external_table_template.sql](examples/external_table_template.sql).
- Adicione `"<fonte>_<entidade>"` ao array `bronzeTables` em `dataform/definitions/bronze/declarations.js`.
- Informe ao usuário que o DDL precisa ser aplicado no BigQuery (não execute sem confirmação).

## 7. Silver

Ative a skill **`modelo-dataform`** e crie `silver_<fonte>_<entidade>.sqlx` com tag `"<fonte>"`.

## 8. Validação

1. `task lint` sem erros.
2. `task flow:<fonte>` → log mostra `[GCS] ... gs://...` e `[DATAFORM SUCESSO]`.
3. `SELECT COUNT(*) FROM nimbus_bronze_prod.<fonte>_<entidade>` > 0.
4. `SELECT * FROM nimbus_silver_prod.silver_<fonte>_<entidade> LIMIT 10` coerente.
5. `task flow:deploy` e conferir o deployment em `http://localhost:4200`.

## Checklist final

- [ ] settings + `.env.example` · [ ] extract · [ ] flow · [ ] deploy.py · [ ] Taskfile + guia
- [ ] DDL + declarations.js · [ ] Silver com tag · [ ] `docs/arquitetura-e-dados.md` atualizado
- [ ] Sugestão de PR via skill `preparar-pr` (sem commitar)
