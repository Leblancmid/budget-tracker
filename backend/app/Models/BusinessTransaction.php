<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessTransaction extends Model
{
    protected $fillable = ['type', 'action', 'amount', 'description', 'date', 'notes'];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date:Y-m-d',
    ];
}
