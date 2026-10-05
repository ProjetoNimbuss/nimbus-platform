<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Leitura extends Model
{
    use HasUuids;

    protected $fillable = [
        'estacao_id', 'data_hora', 'precipitacao_mm', 'nivel_rio_m', 'temperatura_c', 'umidade_relativa'
    ];

    protected $casts = [
        'data_hora' => 'datetime'
    ];

    public function estacao() { return $this->belongsTo(Estacao::class, 'estacao_id'); }
}
