# Nimbus Platform — Regras Globais do Agente

Plataforma de monitoramento hidrometeorológico de Pernambuco / RMR.

```text
Fontes externas → GCS (Bronze, Parquet) → BigQuery/Dataform (Silver/Gold) → API Laravel → Web Next.js
                         ↑ orquestrado por Prefect 3            observado por Prometheus/Grafana
```

## Mapa do monorepo

| Pasta | Conteúdo | Regras específicas |
| :--- | :--- | :--- |
| `pipelines/` | Ingestão Python + flows Prefect | `pipelines/AGENTS.md` |
| `dataform/` | Modelos SQLX Bronze/Silver/Gold | `dataform/AGENTS.md` |
| `api/` | Backend Laravel 11 | `api/AGENTS.md` |
| `web/` | Frontend Next.js | `web/AGENTS.md` |
| `monitoring/` | Prometheus + Grafana | skill `observabilidade` |
| `docs/` | Documentação técnica | — |

Skills do projeto ficam em `.agents/skills/`.

## 🚫 Git: o humano é o dono do versionamento

- **NUNCA** execute `git commit`, `git push`, `git merge`, `git rebase`, `git reset`,
  `git tag`, `git stash`, `git checkout -b`/`git switch -c`, `git branch -d`, `gh pr create`
  ou qualquer comando que altere o histórico, branches ou o remoto.
- **NUNCA** faça `git add` / stage de arquivos.
- Comandos somente leitura são permitidos: `git status`, `git diff`, `git log`, `git show`, `git blame`.
- Ao terminar uma tarefa, **sugira** nome de branch, mensagem de commit e descrição de PR
  (skill `preparar-pr`) — mas deixe a execução para o humano.

## Comandos

- Use **sempre** o Taskfile (`task <cmd>`), não `docker-compose` direto. Ver `docs/guia-taskfile.md`.
  - Subir: `task up:app`, `task up:pipelines`, `task up:obs` · Status: `task status`
  - Logs: `task logs:api`, `task logs:worker`, `task logs:web`
  - Qualidade: `task lint` (Ruff)
- **Peça confirmação** antes de comandos destrutivos: `task clean`, `task migrate:fresh`,
  `task down`, remoção de volumes, `DROP`/`DELETE` em bancos, ou escrita em buckets/datasets de produção.

## Portas locais

API `8000` · Web `8080` · Postgres `5432` · Prefect `4200` · Prometheus `9090` · Grafana `3001` · cAdvisor `8085`

## Segurança

- Nunca leia, imprima ou altere `.env` nem credenciais GCP. Nova variável → documente em `.env.example`.
- Nunca deixe segredos, API keys ou IDs de projeto fixos no código Python (use `pipelines/config/settings.py`).
- GCP: projeto `nimbus-506613`, região `southamerica-east1`.

## Idioma e estilo

- Domínio em português (`estacao`, `leitura`, `alerta`, `previsao`), seguindo o código existente.
- Comentários, documentação e mensagens sugeridas em **PT-BR**.
- Não introduza dependências novas sem justificar ao usuário.

## Documentação

- Mudou arquitetura/fluxo de dados → atualize `docs/arquitetura-e-dados.md`.
- Mudou endpoint → atualize `docs/api-contrato.md`.
- Novo comando no Taskfile → atualize `docs/guia-taskfile.md`.
