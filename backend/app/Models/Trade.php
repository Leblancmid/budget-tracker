<?php

namespace App\Models;

use App\Models\Concerns\Archivable;
use App\Models\Concerns\Journaled;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Trade extends Model
{
    use Archivable, HasFactory, Journaled;

    protected $fillable = [
        'gold_id',
        'description',
        'status',
        'amount',
        'currency',
        'payment_method',
        'middleman_fee',
        'start_date',
        'completion_date',
    ];

    protected function casts(): array
    {
        return [
            'amount'          => 'decimal:2',
            'completion_date' => 'date:Y-m-d',
            'archived_at'     => 'datetime',
        ];
    }

    public function gold(): BelongsTo
    {
        return $this->belongsTo(Gold::class);
    }

    public function middlemanFeeRecord(): HasOne
    {
        return $this->hasOne(MiddlemanFee::class);
    }
}
