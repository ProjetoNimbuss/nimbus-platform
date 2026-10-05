<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ReportMidia extends Model
{
    use HasUuids;
    protected $table = 'report_midias';

    protected $fillable = [
        'report_id', 'midia_url'
    ];

    public function report() { return $this->belongsTo(Report::class, 'report_id'); }
}
