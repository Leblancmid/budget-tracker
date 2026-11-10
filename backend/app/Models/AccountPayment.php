<?php

namespace App\Models;

use App\Models\Concerns\Journaled;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One payment toward an account's cost: gold from a gold trade, or cash from a Balance wallet. */
class AccountPayment extends Model
{
    use Journaled;

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

    /** One line for the Logs page, e.g. "Paid for Leblanc 657 Dist: 540,000,000 G from .17$ binance". */
    public function summary(): string
    {
        $account = $this->account?->description ?: ($this->account?->email ?? 'account');
        $how = match (true) {
            $this->method === 'gold_trade' => 'from ' . ($this->taken['trade']['description'] ?? 'a gold trade'),
            $this->balance_account !== null => 'cash from ' . $this->balance_account,
            $this->cash_amount !== null     => 'paid outside Balance',
            default                         => 'already paid',
        };

        return 'Paid for ' . $account . ': ' . number_format($this->gold) . ' G ' . $how;
    }

    public function sourceTrade(): BelongsTo
    {
        return $this->belongsTo(BusinessTransaction::class, 'source_trade_id');
    }
}
