<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    use HasUuids;
    
    protected $fillable = [
        'email', 'password_hash', 'role', 'is_active'
    ];

    public function profile() { return $this->hasOne(Profile::class); }
    public function locations() { return $this->hasMany(UserLocation::class); }
    public function reports() { return $this->hasMany(Report::class); }
}
