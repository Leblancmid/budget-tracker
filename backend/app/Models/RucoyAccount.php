<?php

namespace App\Models;

use App\Models\Concerns\Archivable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RucoyAccount extends Model
{
    use Archivable, HasFactory;

    protected $table = 'rucoy_accounts';

    /** Accessories an account can include. Keep in sync with frontend/src/utils/accessories.ts. */
    public const ACCESSORIES = [
        // Decorations
        'bandana', 'crown', 'hood',
        // Buffs
        'necklace-green', 'necklace-purple', 'necklace-blue', 'necklace-gold',
        'ring-green', 'ring-purple', 'ring-blue', 'ring-gold',
    ];

    protected $fillable = [
        'description', 'email', 'avatar', 'price', 'cost', 'payment_status', 'payment_date',
        'level', 'melee', 'distance', 'magic', 'defense', 'accessories', 'screenshot', 'show_price', 'listed_at',
    ];

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
            'listed_at'   => 'datetime',
            'archived_at' => 'datetime',
        ];
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
