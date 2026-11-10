<?php

namespace App\Models;

use App\Models\Concerns\Archivable;
use App\Models\Concerns\Journaled;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessTransaction extends Model
{
    use Archivable, Journaled;

    protected $fillable = ['system_key', 'type', 'action', 'account_id', 'price_rate', 'cost_rate', 'php_rate', 'cost_php_rate', 'price_gold', 'cost_gold', 'price_gold_received', 'cost_gold_paid', 'price_php', 'cost_php', 'profit_php', 'amount', 'description', 'date', 'notes', 'archived_at'];

    protected function casts(): array
    {
        return [
            'amount'        => 'decimal:2',
            'price_rate'    => 'decimal:6',
            'cost_rate'     => 'decimal:6',
            'php_rate'      => 'decimal:4',
            'cost_php_rate' => 'decimal:4',
            'price_php'     => 'decimal:2',
            'cost_php'      => 'decimal:2',
            'profit_php'    => 'decimal:2',
            'date'          => 'date:Y-m-d',
            'archived_at'   => 'datetime',
        ];
    }

    /** Balance wallet payments for the gold bought on this trade (deducted from Balance). */
    public function walletEntries(): HasMany
    {
        return $this->hasMany(BalanceEntry::class);
    }

    /**
     * Gold bought with money ("₱ paid"): no gold went out (Cost 0 G), the cost is the ₱ paid.
     * Its cost follows the price gold, e.g. selling half the gold takes half the ₱ cost.
     */
    public function costPaidInPhp(): bool
    {
        return (float) ($this->cost_gold ?? 0) == 0 && (float) ($this->cost_php ?? 0) > 0;
    }

    /**
     * Gold of this trade actually in hand to pay with: what's been received when that's tracked
     * (a buyer still paying you in parts), otherwise the whole price gold.
     */
    public function usableGold(): float
    {
        $price = (float) ($this->price_gold ?? 0);

        // Middleman fees are always already in the stash; that trade doesn't track "received"
        return $this->price_gold_received !== null && ! $this->isSystem() ? min((float) $this->price_gold_received, $price) : $price;
    }

    /** The gold a wallet payment buys: the cost gold, or the price gold when the cost was paid in ₱. */
    public function boughtGold(): float
    {
        return (float) ($this->cost_gold ?? 0) > 0 ? (float) $this->cost_gold : (float) ($this->price_gold ?? 0);
    }

    /**
     * What buying $gold of this trade's cost gold costs in a wallet's currency, at the trade's
     * cost rates: G / 1M × cost rate = $, × the cost ₱ rate for a peso wallet. Null without rates.
     */
    public function walletCost(float $gold, string $currency, ?float $costPhp = null): ?float
    {
        // The ₱ actually paid wins for a peso wallet
        if ($currency === 'PHP' && $costPhp !== null && $costPhp > 0) {
            return round($costPhp, 2);
        }
        if ($gold <= 0 || ! $this->cost_rate) {
            return null;
        }
        $usd = $gold / 1_000_000 * (float) $this->cost_rate;
        if ($currency === 'USD') {
            return round($usd, 2);
        }
        $phpRate = $this->cost_php_rate ?? $this->php_rate;

        return $phpRate ? round($usd * (float) $phpRate, 2) : null;
    }

    /** App-managed rows (e.g. the pinned Middleman Fee trade) can't be deleted or archived. */
    public function isSystem(): bool
    {
        return ! empty($this->system_key);
    }

    /**
     * Recalculate a gold trade's ₱ values from its G amounts and rates.
     * 0 G is worth ₱0 regardless of rates; without rates the ₱ value is left unset.
     */
    public function recomputeGoldPhp(): void
    {
        $toPhp = function ($gold, $usdRate, $phpRate) {
            if ($gold !== null && (float) $gold == 0) {
                return 0.0;
            }
            if ($gold === null || ! $usdRate || ! $phpRate) {
                return null;
            }

            return round(((float) $gold / 1_000_000) * (float) $usdRate * (float) $phpRate, 2);
        };

        $this->price_php  = $toPhp($this->price_gold, $this->price_rate, $this->php_rate);
        $this->cost_php   = $toPhp($this->cost_gold, $this->cost_rate, $this->cost_php_rate ?? $this->php_rate);
        $this->profit_php = $this->price_php !== null && $this->cost_php !== null
            ? round((float) $this->price_php - (float) $this->cost_php, 2)
            : null;
        $this->amount = $this->profit_php !== null && $this->profit_php > 0 ? $this->profit_php : 0.01;
    }

    public function scopeIncome(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('action', 'sell')
                ->orWhere(function ($q2) {
                    $q2->whereNull('action')->where('type', '!=', 'expense');
                });
        });
    }

    public function scopeExpense(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('action', 'buy')
                ->orWhere(function ($q2) {
                    $q2->whereNull('action')->where('type', 'expense');
                });
        });
    }

    public static function incomeExpr(): string
    {
        return "CASE WHEN action = 'sell' OR (action IS NULL AND type != 'expense') THEN 'income' ELSE 'expense' END";
    }
}
