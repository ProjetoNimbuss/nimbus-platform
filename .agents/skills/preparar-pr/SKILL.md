---
name: preparar-pr
description: >-
  Use ao concluir uma tarefa ou quando o usuário pedir ajuda com branch, commit, Pull
  Request ou release. O agente apenas PREPARA as sugestões (nome de branch, mensagem de
  commit, descrição de PR); quem executa qualquer comando git é sempre o humano.
---

# Preparar PR (sem executar git)

> **Regra absoluta:** não execute `git add`, `commit`, `push`, `checkout -b`, `switch -c`,
> `merge`, `rebase`, `reset`, `tag`, `stash` nem `gh pr create`. Apenas leitura é permitida:
> `git status`, `git diff`, `git log`, `git branch --show-current`.

Referência: `docs/estrategia-branches.md`.

## Passos

1. **Inspecionar** (somente leitura): `git status`, `git diff --stat`, `git branch --show-current`.
2. **Checar qualidade**: `task lint` (Python) e, se tocou o web, `npm run lint` em `web/`.
3. **Branch** — se o usuário estiver na `main`, alerte e sugira um nome que passe no CI
   (`^(feature|bugfix|hotfix|docs|chore)/.+`), ex.: `feature/fonte-inmet`.
4. **Commit** — sugira mensagem em PT-BR, imperativo, curta:
   `feat(pipelines): adiciona ingestão da fonte INMET`
   (tipos: `feat`, `fix`, `docs`, `chore`, `refactor`; escopo: `pipelines`, `dataform`, `api`, `web`, `monitoring`, `agents`).
5. **Descrição do PR** — entregue pronta para colar:
   ```markdown
   ## O que foi feito
   - ...
   ## Por quê
   ...
   ## Como testar
   - [ ] `task ...`
   ## Impactos
   - Contrato da API / schema BigQuery / variáveis de ambiente novas: ...
   ```
6. **Bloco de comandos para o humano** — apresente (não execute):
   ```bash
   git checkout main && git pull origin main
   git checkout -b feature/<nome>
   git add <arquivos>
   git commit -m "<mensagem>"
   git push origin feature/<nome>
   ```
7. Lembre: revisão pela outra pessoa do time; tag é gerada automaticamente no merge (`auto-tag-on-merge.yml`).
