<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para formatação de dados de saída no envelope de resposta Nimbus.
 */
class ExemploResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'codigo' => $this->codigo,
            'cidade' => $this->cidade,
            'valor_mm' => $this->valor !== null ? (float) $this->valor : null,
            'status' => $this->status,
            'data_hora' => $this->data_hora?->toIso8601String(),
        ];
    }
}
