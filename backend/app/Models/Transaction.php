<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    use HasFactory;

    public const SCOPES = ['personal', 'business'];

    protected $fillable = ['user_id', 'category_id', 'type', 'scope', 'amount', 'description', 'date', 'notes'];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date:Y-m-d',
    ];

    protected $attributes = [
        'scope' => 'personal',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** The Balance entry this transaction adds to / deducts from, if linked to an account. */
    public function balanceEntry(): HasOne
    {
        return $this->hasOne(BalanceEntry::class);
    }

    /** Only transactions that count toward Daily Expenses (excludes Business). */
    public function scopePersonal(Builder $query): Builder
    {
        return $query->where('scope', 'personal');
    }
}
