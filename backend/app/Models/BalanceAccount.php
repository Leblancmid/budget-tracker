<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BalanceAccount extends Model
{
    public const CURRENCIES = ['USD', 'PHP'];

    protected $fillable = ['code', 'name', 'currency', 'color', 'icon', 'sort_order', 'hidden_at'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'hidden_at'  => 'datetime',
        ];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(BalanceEntry::class, 'account', 'code');
    }

    /** Account codes for a currency, e.g. codesFor('USD') → ['PAYPAL', 'BINANCE', ...] */
    public static function codesFor(string $currency): array
    {
        return self::where('currency', $currency)->pluck('code')->all();
    }
}
