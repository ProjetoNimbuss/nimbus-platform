<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ExemploResource;
use App\Models\Exemplo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Controller de exemplo para API V1 seguindo o contrato Nimbus (docs/api-contrato.md).
 */
class ExemploController extends Controller
{
    /**
     * Listar recursos com filtros opcionais.
     * GET /api/v1/exemplos
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Exemplo::query();

        // Filtros de query
        $query->when($request->filled('status'), function ($q) use ($request) {
            $q->where('status', $request->query('status'));
        });

        $query->when($request->filled('cidade'), function ($q) use ($request) {
            $q->where('cidade', $request->query('cidade'));
        });

        $registros = $query->latest('data_hora')->paginate(50);

        return ExemploResource::collection($registros);
    }

    /**
     * Detalhes de um recurso específico.
     * GET /api/v1/exemplos/{id}
     */
    public function show(string $id): ExemploResource|JsonResponse
    {
        $registro = Exemplo::find($id);

        if (!$registro) {
            return response()->json([
                'error' => 'Recurso não encontrado',
                'message' => "Nenhum registro encontrado para o ID {$id}."
            ], 404);
        }

        return new ExemploResource($registro);
    }
}
