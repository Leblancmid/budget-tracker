<?php

namespace App\Models;

use App\Models\Concerns\Archivable;
use App\Models\Concerns\Journaled;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RucoyAccount extends Model
{
    use Archivable, HasFactory, Journaled;

    protected $table = 'rucoy_accounts';

    /** Accessories an account can include. Keep in sync with frontend/src/utils/accessories.ts. */
    public const ACCESSORIES = [
        // Decorations
        'bandana', 'crown', 'hood',
        // Buffs
        'necklace-green', 'necklace-purple', 'necklace-blue', 'necklace-gold',
        'ring-green', 'ring-purple', 'ring-blue', 'ring-gold',
    ];

    public const DEAL_TYPES = ['gold', 'cash'];

    protected $fillable = [
        'description', 'email', 'avatar', 'price', 'cost', 'payment_status', 'payment_date',
        'deal_type', 'price_cash', 'cost_cash', 'cash_currency',
        'level', 'melee', 'distance', 'magic', 'defense', 'accessories', 'screenshot', 'show_price', 'listed_at',
    ];

    protected $attributes = ['deal_type' => 'gold'];

    protected $appends = ['profit'];

    protected function casts(): array
    {
        return [
            'price'       => 'float',
            'cost'        => 'float',
            'level'       => 'integer',
            'melee'       => 'integer',
            'distance'    => 'integer',
            'magic'       => 'integer',
            'defense'     => 'integer',
            'accessories' => 'array',
            'show_price'  => 'boolean',
            'price_cash'  => 'float',
            'cost_cash'   => 'float',
            'listed_at'   => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    /** Priced in cash (₱ or $) instead of gold. */
    public function isCash(): bool
    {
        return $this->deal_type === 'cash';
    }

    public function payments(): HasMany
    {
        return $this->hasMany(AccountPayment::class, 'account_id')->orderBy('date')->orderBy('id');
    }

    public function getProfitAttribute(): ?float
    {
        if ($this->price === null || $this->cost === null) {
            return null;
        }

        return $this->price - $this->cost;
    }
}
