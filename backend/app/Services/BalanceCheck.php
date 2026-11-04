<?php

namespace App\Services;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Bank check: match an account to the balance the bank / e-wallet app really shows. Any
 * difference is recorded as one "adjustment" entry dated today, so the history explains it.
 */
class BalanceCheck
{
    /** @return array{difference: float, entry: ?BalanceEntry} */
    public static function match(BalanceAccount $account, float $actual, ?string $note = null): array
    {
        $today = CarbonImmutable::now(BalanceInterest::ZONE)->format('Y-m-d');

        return DB::transaction(function () use ($account, $actual, $note, $today) {
            $recorded   = BalanceInterest::balanceAt($account->code, $today);
            $difference = round($actual - $recorded, 2);
            $entry      = null;

            if (abs($difference) >= 0.01) {
                $entry = BalanceEntry::create([
                    'account'     => $account->code,
                    'type'        => $difference > 0 ? 'add' : 'sell',
                    'kind'        => 'adjustment',
                    'amount'      => abs($difference),
                    'date'        => $today,
                    'description' => 'Bank check: matched to ' . self::money($account, $actual)
                        . ($note ? ' · ' . $note : ''),
                ]);
            }

            $account->update(['checked_at' => $today, 'checked_balance' => round($actual, 2)]);

            return ['difference' => $difference, 'entry' => $entry];
        });
    }

    private static function money(BalanceAccount $account, float $v): string
    {
        return ($account->currency === 'USD' ? '$' : '₱') . number_format($v, 2);
    }
}
