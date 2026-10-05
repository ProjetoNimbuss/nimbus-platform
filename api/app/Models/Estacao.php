<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Estacao extends Model
{
    use HasUuids;
    protected $table = 'estacoes';

    protected $fillable = [
        'nome', 'latitude', 'longitude', 'tipo', 'status'
    ];

    public function alertas() { return $this->hasMany(Alerta::class, 'estacao_id'); }
    public function leituras() { return $this->hasMany(Leitura::class, 'estacao_id'); }
}
