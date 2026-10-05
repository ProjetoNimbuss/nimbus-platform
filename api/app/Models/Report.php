<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'tipo', 'descricao', 'latitude', 'longitude', 'endereco', 'status'
    ];

    public function midias() { return $this->hasMany(ReportMidia::class, 'report_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
