<?php

namespace App\Models;

use App\Models\Concerns\Journaled;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BalanceAccount extends Model
{
    use Journaled;

    public const CURRENCIES = ['USD', 'PHP'];

    protected $fillable = ['code', 'name', 'currency', 'color', 'icon', 'sort_order', 'hidden_at', 'interest_rate', 'interest_tax', 'interest_credited_through', 'checked_at', 'checked_balance'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'hidden_at'  => 'datetime',
            'interest_rate' => 'float',
            'interest_tax'  => 'float',
            'interest_credited_through' => 'date:Y-m-d',
            'checked_at'      => 'date:Y-m-d',
            'checked_balance' => 'float',
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
