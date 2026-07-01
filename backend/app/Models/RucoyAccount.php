<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RucoyAccount extends Model
{
    use HasFactory;

    protected $table = 'rucoy_accounts';

    protected $fillable = ['description', 'email', 'avatar', 'price', 'cost'];

    protected $appends = ['profit'];

    protected $casts = [
        'price' => 'float',
        'cost'  => 'float',
    ];

    public function getProfitAttribute(): ?float
    {
        if ($this->price === null || $this->cost === null) {
            return null;
        }

        return $this->price - $this->cost;
    }
}
