<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A daily transaction that repeats (rent, subscriptions, allowance), posted automatically when due. */
class RecurringEntry extends Model
{
    public const FREQUENCIES = ['daily', 'weekly', 'monthly'];

    protected $fillable = [
        'user_id', 'category_id', 'type', 'scope', 'amount', 'description', 'balance_account',
        'frequency', 'day_of_month', 'next_date', 'active', 'last_posted_on',
    ];

    protected function casts(): array
    {
        return [
            'amount'         => 'decimal:2',
            'day_of_month'   => 'integer',
            'next_date'      => 'date:Y-m-d',
            'last_posted_on' => 'date:Y-m-d',
            'active'         => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
