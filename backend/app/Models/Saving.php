<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Saving extends Model
{
    protected $fillable = [
        'mode_of_payment',
        'type',
        'transfer',
        'description',
        'amount',
        'date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date:Y-m-d',
    ];
}
