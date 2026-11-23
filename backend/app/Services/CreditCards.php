<?php

namespace App\Services;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Your credit cards: what you owe on each, how much of the limit that is, and when the next payment
 * is due (from the card's due day). For the morning alerts and the wallet cards.
 */
class CreditCards
{
    /** At this share of the limit, warn */
    public const HIGH_USE = 0.8;

    /** Warn this many days before a payment is due */
    public const DUE_SOON_DAYS = 3;

    /**
     * @return Collection<int, array{account: BalanceAccount, owed: float, used: ?float, next_due: ?CarbonImmutable, due_in: ?int}>
     */
    public static function status(?CarbonImmutable $today = null): Collection
    {
        $today ??= CarbonImmutable::now(BalanceInterest::ZONE)->startOfDay();
        $cards = BalanceAccount::where('kind', 'credit')->whereNull('hidden_at')->get();
        $balance = BalanceEntry::whereIn('account', $cards->pluck('code'))
            ->selectRaw("account, SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END) as b")
            ->groupBy('account')->pluck('b', 'account');

        return $cards->map(function (BalanceAccount $card) use ($balance, $today) {
            $owed = max(0.0, -round((float) ($balance[$card->code] ?? 0), 2));
            $due  = $card->due_day ? self::nextDue($card->due_day, $today) : null;

            return [
                'account'  => $card,
                'owed'     => $owed,
                'used'     => $card->credit_limit > 0 ? $owed / $card->credit_limit : null,
                'next_due' => $due,
                'due_in'   => $due ? (int) $today->diffInDays($due) : null,
            ];
        })->values();
    }

    /** The next date (today or later) with this day of the month; a short month uses its last day. */
    public static function nextDue(int $day, CarbonImmutable $today): CarbonImmutable
    {
        $inMonth   = fn (CarbonImmutable $month) => $month->setDay(min($day, $month->daysInMonth));
        $thisMonth = $inMonth($today->startOfMonth());

        return $thisMonth->lessThan($today) ? $inMonth($today->startOfMonth()->addMonth()) : $thisMonth;
    }
}
