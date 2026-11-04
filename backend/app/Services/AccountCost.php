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
