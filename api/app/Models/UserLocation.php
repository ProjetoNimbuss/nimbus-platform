<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserLocation extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'name', 'location', 'address', 'alert_radius_meters'
    ];

    public function user() { return $this->belongsTo(User::class); }
}
