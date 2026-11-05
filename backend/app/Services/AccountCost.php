<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;

/**
 * An account's exact ₱ cost. Each payment carries its own rates (e.g. 540M at .17 × 63.4 and
 * 460M at .1777 × 62.53), so the paid part is the sum of the payments. Any gold not yet paid is
 * valued at the account's own cost rates, until it is paid. Accounts without payments work as before.
 */
class AccountCost
{
    /**
     * @return float|null ₱ cost, or null when part of it can't be valued yet (unpaid gold, no rates)
     */
    public static function costPhp(RucoyAccount $account, ?float $costRate, ?float $costPhpRate): ?float
    {
        $payments = $account->relationLoaded('payments') ? $account->payments : $account->payments()->get();
        $paidGold = (float) $payments->sum('gold');
        $paidPhp  = (float) $payments->sum('cost_php');
        $unpaid   = max(0.0, (float) ($account->cost ?? 0) - $paidGold);

        if ($unpaid <= 0) {
            return round($paidPhp, 2);
        }
        if (! $costRate || ! $costPhpRate) {
            return null;
        }

        return round($paidPhp + ($unpaid / 1_000_000) * $costRate * $costPhpRate, 2);
    }

    /**
     * The cost rates typed in Edit Account ($ per 1M, ₱ per $), from its pricing transaction.
     *
     * @return array{0: ?float, 1: ?float}
     */
    public static function typedRates(RucoyAccount $account): array
    {
        $tx = BusinessTransaction::where('type', 'account')->where('account_id', $account->id)->first();
        $phpRate = $tx?->cost_php_rate ?? $tx?->php_rate;

        return [$tx?->cost_rate ? (float) $tx->cost_rate : null, $phpRate ? (float) $phpRate : null];
    }

    /** ₱ value of $gold at the account's typed cost rates; null without rates. */
    public static function atTypedRates(RucoyAccount $account, float $gold): ?float
    {
        [$rate, $phpRate] = self::typedRates($account);

        return $rate && $phpRate ? round($gold / 1_000_000 * $rate * $phpRate, 2) : null;
    }

    /**
     * Bring the account's pricing transaction (Sales) in line with its payments: ₱ cost, profit.
     * Creates the transaction if the account has none yet, so the paid cost shows straight away.
     */
    public static function sync(RucoyAccount $account): void
    {
        $account->unsetRelation('payments');
        $hasPayments = $account->payments()->exists();

        $tx = BusinessTransaction::where('type', 'account')->where('account_id', $account->id)->first();
        if (! $tx && ! $hasPayments) {
            return;
        }
        $tx ??= BusinessTransaction::create([
            'type'        => 'account',
            'account_id'  => $account->id,
            'amount'      => 0.01,
            'description' => $account->description,
            'date'        => now('Asia/Manila')->toDateString(),
        ]);

        self::apply($tx, $account);
        $tx->save();
    }

    /**
     * Cost values for a gold trade made from an account that has payments ("To Gold"). A gold
     * trade keeps one cost rate, so it gets the payments' average $ rate (by gold) and a ₱ rate
     * worked back from the exact total: Cost (G) × cost rate × ₱ rate = what you really spent.
     * The paid gold counts as paid. Null when the account has no payments.
     *
     * @return array{cost_php: float, cost_rate: ?float, cost_php_rate: ?float, cost_gold_paid: float}|null
     */
    public static function forGoldTrade(RucoyAccount $account, ?float $typedRate, ?float $typedPhpRate): ?array
    {
        $payments = $account->payments()->get();
        if ($payments->isEmpty()) {
            return null;
        }
        $costPhp = self::costPhp($account, $typedRate, $typedPhpRate)
            ?? round((float) $payments->sum('cost_php'), 2); // unpaid part without rates: what's paid so far
        $costGold = (float) ($account->cost ?? 0);
        $paidGold = min((float) $payments->sum('gold'), $costGold);

        // Average $ rate per 1M over the payments that have one, plus any unpaid gold at the typed rate
        $rated = $payments->filter(fn ($p) => $p->cost_rate !== null && (float) $p->gold > 0);
        $gold  = (float) $rated->sum('gold');
        $usd   = (float) $rated->sum(fn ($p) => (float) $p->gold / 1_000_000 * (float) $p->cost_rate);
        $unpaid = max(0.0, $costGold - (float) $payments->sum('gold'));
        if ($unpaid > 0 && $typedRate) {
            $gold += $unpaid;
            $usd += $unpaid / 1_000_000 * $typedRate;
        }
        $rate = $gold > 0 ? $usd / ($gold / 1_000_000) : $typedRate;

        return [
            'cost_php'       => $costPhp,
            'cost_rate'      => $rate ? round($rate, 6) : null,
            // The ₱ rate that makes G × rate × ₱ rate equal the exact cost
            'cost_php_rate'  => $rate && $costGold > 0 ? round($costPhp / ($costGold / 1_000_000 * $rate), 4) : null,
            'cost_gold_paid' => $paidGold,
        ];
    }

    /**
     * Set an account transaction's ₱ cost (plus profit and amount): from its payments when it has
     * any, otherwise from the typed cost and rates, as before payments existed.
     */
    public static function apply(BusinessTransaction $tx, RucoyAccount $account): void
    {
        $costRate    = $tx->cost_rate !== null ? (float) $tx->cost_rate : null;
        $costPhpRate = $tx->cost_php_rate !== null ? (float) $tx->cost_php_rate : ($tx->php_rate !== null ? (float) $tx->php_rate : null);

        if ($account->payments()->exists()) {
            $tx->cost_php = self::costPhp($account, $costRate, $costPhpRate);
        } else {
            $tx->cost_php = $account->cost !== null && $costRate && $costPhpRate
                ? round(((float) $account->cost / 1_000_000) * $costRate * $costPhpRate, 2)
                : null;
        }

        $tx->profit_php = $tx->price_php !== null && $tx->cost_php !== null
            ? round((float) $tx->price_php - (float) $tx->cost_php, 2)
            : null;
        $tx->amount = $tx->profit_php !== null && $tx->profit_php > 0 ? $tx->profit_php : 0.01;
    }
}
