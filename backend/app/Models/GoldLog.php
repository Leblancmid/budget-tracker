<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoldLog extends Model
{
    protected $fillable = ['type', 'amount', 'description'];

    protected $casts = ['amount' => 'decimal:2'];
}
