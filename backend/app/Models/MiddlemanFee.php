<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MiddlemanFee extends Model
{
    protected $fillable = ['amount', 'description'];

    protected $casts = [
        'amount' => 'decimal:2',
    ];
}
