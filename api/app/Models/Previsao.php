<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Previsao extends Model
{
    use HasUuids;
    protected $table = 'previsoes';

    protected $fillable = [
        'cidade', 'estado', 'data_previsao', 'condicao', 'temperatura_min', 'temperatura_max', 'probabilidade_chuva', 'volume_chuva_mm'
    ];

    protected $casts = [
        'data_previsao' => 'date'
    ];
}
