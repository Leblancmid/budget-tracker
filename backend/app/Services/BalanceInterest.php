<?php

namespace App\Services;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use Carbon\CarbonImmutable;

/**
 * Daily interest on Balance accounts that have a yearly rate, the way banks like Maribank do it:
 * each day's closing balance × rate ÷ 365, minus withholding tax, credited for that day. Days
 * missed (PC off) are caught up in order, so each day earns on the interest before it.
 */
class BalanceInterest
{
    public const ZONE = 'Asia/Manila';

    /** Never back-fill more than this many days in one go. */
    private const MAX_DAYS = 400;

    /** Credit every finished day up to yesterday (Manila) for all accounts with a rate. */
    public static function accrueAll(?CarbonImmutable $today = null): int
    {
        $today ??= CarbonImmutable::now(self::ZONE)->startOfDay();
        $credited = 0;
        foreach (BalanceAccount::where('interest_rate', '>', 0)->get() as $account) {
            $credited += self::accrue($account, $today);
        }

        return $credited;
    }

    /** @return int number of interest entries created */
    public static function accrue(BalanceAccount $account, CarbonImmutable $today): int
    {
        $rate = (float) $account->interest_rate;
        if ($rate <= 0) {
            return 0;
        }
        $yesterday = $today->subDay();
        $through   = $account->interest_credited_through
            ? CarbonImmutable::parse($account->interest_credited_through->format('Y-m-d'), self::ZONE)
            : $yesterday; // rate just set: start earning from today
        $day = $through->addDay();
        if ($day->lt($yesterday->subDays(self::MAX_DAYS))) {
            $day = $yesterday->subDays(self::MAX_DAYS);
        }

        $keep    = 1 - min(max((float) $account->interest_tax, 0), 100) / 100;
        $created = 0;
        for (; $day->lte($yesterday); $day = $day->addDay()) {
            $date    = $day->format('Y-m-d');
            $balance = self::balanceAt($account->code, $date);
            $net     = round($balance * $rate / 100 / 365 * $keep, 2);
            if ($net >= 0.01) {
                BalanceEntry::create([
                    'account'     => $account->code,
                    'type'        => 'add',
                    'kind'        => 'interest',
                    'amount'      => $net,
                    'date'        => $date,
                    'description' => 'Interest · ' . rtrim(rtrim(number_format($rate, 4), '0'), '.') . '% a year'
                        . ($keep < 1 ? ', ' . rtrim(rtrim(number_format((1 - $keep) * 100, 2), '0'), '.') . '% tax withheld' : ''),
                ]);
                $created++;
            }
        }

        if ($yesterday->gte($through)) {
            $account->interest_credited_through = $yesterday->format('Y-m-d');
            $account->save();
        }

        return $created;
    }

    /** Closing balance of an account on a day: everything dated up to and including it. */
    public static function balanceAt(string $code, string $date): float
    {
        return (float) BalanceEntry::where('account', $code)->where('date', '<=', $date)
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0) as b")
            ->value('b');
    }
}
