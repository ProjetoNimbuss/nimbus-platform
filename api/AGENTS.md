# API Laravel — Regras

Stack: Laravel 11, PHP 8.2+, PostgreSQL. Artisan roda **no container**: `task bash:api` → `php artisan ...`.

## Contrato

- `docs/api-contrato.md` é a fonte da verdade. Todo endpoint segue o contrato **exatamente**.
- Prefixo `/api/v1`; respostas no envelope `{ "data": ... }`.
- Mudou algo? Atualize o contrato e avise que `web/lib/types.ts` precisa acompanhar.

## Camadas

| Camada | Local | Regra |
| :--- | :--- | :--- |
| Migration | `database/migrations/` | `down()` sempre reversível. Nunca edite migration já aplicada — crie outra. |
| Model | `app/Models/` | `$fillable`, `$casts`, relações tipadas; UUID quando o contrato definir |
| Validação | `app/Http/Requests/` | FormRequest por ação de escrita |
| Resposta | `app/Http/Resources/` | API Resource — nunca retorne o Model cru |
| Controller | `app/Http/Controllers/Api/V1/` | Fino; sem regra de negócio complexa |
| Rotas | `routes/api.php` | `Route::prefix('v1')->group(...)`; sem lógica em closures |

## Proibido

- SQL cru com concatenação de input (use Eloquent/Query Builder com bindings).
- Expor campos sensíveis de `User`.
- `task migrate:fresh` sem confirmação do usuário.

## Validação

`task migrate` → `curl http://localhost:8000/api/v1/<rota>` → conferir com o contrato.
Skill: `endpoint-api`.
