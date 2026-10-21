<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoldLog extends Model
{
    protected $fillable = ['type', 'amount', 'description'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }
}
