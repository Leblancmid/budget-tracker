<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BalanceEntry extends Model
{
    protected $fillable = [
        'account',
        'type',
        'description',
        'amount',
        'date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date:Y-m-d',
    ];
}
