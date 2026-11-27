---
name: endpoint-api
description: >-
  Use quando for criar ou alterar endpoints REST, models, migrations, validações ou
  respostas da API Laravel do Nimbus (prefixo /api/v1), mantendo o contrato em
  docs/api-contrato.md sincronizado com o frontend.
---

# Endpoint na API Laravel

Leia `api/AGENTS.md`. Artisan roda no container: `docker-compose exec api php artisan ...`
(ou `task bash:api`).

## Passos

1. **Contrato**: localize/defina o endpoint em `docs/api-contrato.md` (rota, query params,
   corpo, resposta `{ "data": ... }`, códigos HTTP). Divergiu? Atualize o contrato primeiro.
2. **Migration** (se precisar de tabela/coluna):
   `php artisan make:migration create_<tabela>_table` — `down()` reversível.
3. **Model** em `app/Models/` — `$fillable`, `$casts`, relações; `HasUuids` se o contrato usa UUID.
4. **FormRequest** (escrita): `php artisan make:request V1/Store<Recurso>Request`.
5. **Resource**: `php artisan make:resource V1/<Recurso>Resource` — campos exatamente como no contrato (ver [ResourceTemplate.php](examples/ResourceTemplate.php)).
6. **Controller**: `php artisan make:controller Api/V1/<Recurso>Controller --api` (ver [ControllerTemplate.php](examples/ControllerTemplate.php)).
   Filtros de query via `->when($request->filled('x'), ...)`. Paginar listas grandes.
7. **Rota** em `routes/api.php`:
   ```php
   Route::prefix('v1')->group(function () {
       Route::apiResource('<recursos>', <Recurso>Controller::class)->only(['index', 'show']);
   });
   ```
8. **Aplicar**: `task migrate` (nunca `migrate:fresh` sem confirmação).
9. **Testar**: `curl -s http://localhost:8000/api/v1/<recursos> | jq` e comparar com o contrato.
   Cenários: sucesso, filtro, 404, 422 (validação).
10. **Frontend**: atualize `web/lib/types.ts` para refletir o contrato.

## Checklist

- [ ] Contrato atualizado · [ ] Migration reversível · [ ] Resource (sem Model cru)
- [ ] Validação via FormRequest · [ ] Rota em `v1` · [ ] Testado com curl · [ ] Tipos do web
