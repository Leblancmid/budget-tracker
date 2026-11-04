<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One payment toward an account's cost: gold from a gold trade, or cash from a Balance wallet. */
class AccountPayment extends Model
{
    public const METHODS = ['gold_trade', 'cash'];

    protected $fillable = [
        'account_id', 'method', 'gold', 'cost_php', 'cost_rate', 'cost_php_rate',
        'source_trade_id', 'taken', 'balance_entry_id', 'balance_account', 'cash_amount', 'currency',
        'date', 'note',
    ];

    protected function casts(): array
    {
        return [
            'gold'          => 'float',
            'cost_php'      => 'float',
            'cost_rate'     => 'float',
            'cost_php_rate' => 'float',
            'cash_amount'   => 'float',
            'taken'         => 'array',
            'date'          => 'date:Y-m-d',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(RucoyAccount::class, 'account_id');
    }

    public function sourceTrade(): BelongsTo
    {
        return $this->belongsTo(BusinessTransaction::class, 'source_trade_id');
    }
}
