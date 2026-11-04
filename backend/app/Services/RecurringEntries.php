<?php

namespace App\Services;

use App\Models\RecurringEntry;
use App\Models\Transaction;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Posts recurring entries as daily transactions on their due dates (Manila time), catching up
 * any dates missed while the PC was off, then moves each one to its next date.
 */
class RecurringEntries
{
    public const ZONE = 'Asia/Manila';

    /** Never post more than this many missed dates of one entry in one go. */
    private const MAX_CATCH_UP = 60;

    /** @return int number of transactions created */
    public static function postDue(?CarbonImmutable $today = null): int
    {
        $today ??= CarbonImmutable::now(self::ZONE)->startOfDay();
        $posted = 0;

        RecurringEntry::with('category')
            ->where('active', true)
            ->whereDate('next_date', '<=', $today->format('Y-m-d'))
            ->get()
            ->each(function (RecurringEntry $entry) use ($today, &$posted) {
                $posted += self::post($entry, $today);
            });

        return $posted;
    }

    /** Post every date of $entry due up to $today. @return int transactions created */
    public static function post(RecurringEntry $entry, CarbonImmutable $today): int
    {
        $created = 0;

        DB::transaction(function () use ($entry, $today, &$created) {
            $due = CarbonImmutable::parse($entry->next_date->format('Y-m-d'), self::ZONE);
            while ($due->lte($today) && $created < self::MAX_CATCH_UP) {
                $tx = Transaction::create([
                    'user_id'            => $entry->user_id,
                    'category_id'        => $entry->category_id,
                    'recurring_entry_id' => $entry->id,
                    'type'               => $entry->type,
                    'scope'              => $entry->scope,
                    'amount'             => $entry->amount,
                    'description'        => $entry->description,
                    'date'               => $due->format('Y-m-d'),
                ]);
                TransactionBalance::sync($tx, $entry->balance_account);
                $entry->last_posted_on = $due->format('Y-m-d');
                $due = self::after($due, $entry->frequency, $entry->day_of_month);
                $created++;
            }
            // Too far behind: skip ahead instead of posting months of old entries
            while ($due->lte($today)) {
                $due = self::after($due, $entry->frequency, $entry->day_of_month);
            }
            $entry->next_date = $due->format('Y-m-d');
            $entry->save();
        });

        return $created;
    }

    /**
     * The date after $date for a frequency. Monthly keeps the chosen day, using the last day
     * of shorter months (31st → 30 Nov → 31 Dec).
     */
    public static function after(CarbonImmutable $date, string $frequency, ?int $dayOfMonth = null): CarbonImmutable
    {
        if ($frequency === 'daily') {
            return $date->addDay();
        }
        if ($frequency === 'weekly') {
            return $date->addWeek();
        }
        $next = $date->startOfMonth()->addMonth();

        return $next->setDay(min($dayOfMonth ?? $date->day, $next->daysInMonth));
    }
}
