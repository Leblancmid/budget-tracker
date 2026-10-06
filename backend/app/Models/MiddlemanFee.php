<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MiddlemanFee extends Model
{
    protected $fillable = ['trade_id', 'amount', 'description'];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function trade(): BelongsTo
    {
        return $this->belongsTo(Trade::class);
    }
}
