<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AlertaExterno extends Model
{
    use HasUuids;
    protected $table = 'alertas_externos';

    protected $fillable = [
        'orgao_emissor', 'severidade', 'tipo_alerta', 'descricao', 'inicio', 'fim', 'link_oficial'
    ];

    protected $casts = [
        'inicio' => 'datetime',
        'fim' => 'datetime'
    ];
}
