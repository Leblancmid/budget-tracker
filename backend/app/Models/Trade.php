<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trade extends Model
{
    use HasFactory;

    protected $fillable = [
        'gold_id',
        'description',
        'status',
        'amount',
        'currency',
        'payment_method',
        'start_date',
        'completion_date',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'completion_date' => 'date:Y-m-d',
    ];

    public function gold(): BelongsTo
    {
        return $this->belongsTo(Gold::class);
    }
}
