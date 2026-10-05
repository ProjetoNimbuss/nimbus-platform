<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Alerta extends Model
{
    use HasUuids;

    protected $fillable = [
        'estacao_id', 'tipo', 'nivel', 'mensagem', 'data_emissao', 'status'
    ];

    protected $casts = [
        'data_emissao' => 'datetime'
    ];

    public function estacao() { return $this->belongsTo(Estacao::class, 'estacao_id'); }
}
