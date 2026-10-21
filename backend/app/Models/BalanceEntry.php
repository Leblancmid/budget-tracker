<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BalanceEntry extends Model
{
    protected $fillable = [
        'transaction_id',
        'account',
        'type',
        'description',
        'amount',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date'   => 'date:Y-m-d',
        ];
    }
}
