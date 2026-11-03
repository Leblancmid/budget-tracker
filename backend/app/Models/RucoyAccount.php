<?php

namespace App\Models;

use App\Models\Concerns\Archivable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RucoyAccount extends Model
{
    use Archivable, HasFactory;

    protected $table = 'rucoy_accounts';

    protected $fillable = [
        'description', 'email', 'avatar', 'price', 'cost', 'payment_status', 'payment_date',
        'level', 'hp', 'melee', 'distance', 'magic', 'defense', 'screenshot', 'show_price', 'listed_at',
    ];

    protected $appends = ['profit'];

    protected function casts(): array
    {
        return [
            'price'       => 'float',
            'cost'        => 'float',
            'level'       => 'integer',
            'hp'          => 'integer',
            'melee'       => 'integer',
            'distance'    => 'integer',
            'magic'       => 'integer',
            'defense'     => 'integer',
            'show_price'  => 'boolean',
            'listed_at'   => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function getProfitAttribute(): ?float
    {
        if ($this->price === null || $this->cost === null) {
            return null;
        }

        return $this->price - $this->cost;
    }
}
