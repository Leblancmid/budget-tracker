<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\BusinessTransaction;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Master → Overview for someone who isn't an admin: only what's theirs. That's their own Daily
 * Expenses, and the profit of sales they made (marked sold, or recorded already sold). Wallets,
 * the gold stash and listed accounts are the business's, so they aren't shown.
 */
class OwnOverview
{
    /** Types that aren't the record being added (edits, removals, undo…) */
    private const NOT_ADDED = ['archived', 'edited', 'removed', 'undone', 'redone', 'published'];

    /** The sold business records this person made: whoever marked it sold, else whoever added it sold. */
    public static function soldBy(User $user): Collection
    {
        $logs = ActivityLog::where('loggable_type', BusinessTransaction::class)->orderBy('id')
            ->get(['loggable_id', 'type', 'user_id']);
        // The latest "sold" wins (sold, undone, sold again by someone else)
        $soldBy = $logs->where('type', 'archived')->pluck('user_id', 'loggable_id');
        $addedBy = $logs->whereNotIn('type', self::NOT_ADDED)->unique('loggable_id')->pluck('user_id', 'loggable_id');

        $ids = BusinessTransaction::archived()->pluck('id')
            ->filter(fn ($id) => ($soldBy[$id] ?? $addedBy[$id] ?? null) === $user->id);

        return BusinessTransaction::whereIn('id', $ids)->get(['id', 'type', 'price_php', 'cost_php', 'amount', 'archived_at']);
    }

    public static function stats(User $user): array
    {
        $now = CarbonImmutable::now(MasterTrend::ZONE);
        $sold = self::soldBy($user);
        $thisMonth = $sold->filter(fn ($t) => $t->archived_at->copy()->tz(MasterTrend::ZONE)->format('Y-m') === $now->format('Y-m'));

        $daily = fn (?string $type, bool $month) => (float) Transaction::personal()->where('user_id', $user->id)
            ->where('type', $type)
            ->when($month, fn ($q) => $q->where('date', '>=', $now->startOfMonth()->toDateString()))
            ->sum('amount');

        $business = BusinessProfit::realized($sold)['profit'];
        $monthBusiness = BusinessProfit::realized($thisMonth)['profit'];
        $dailyNet = $daily('income', false) - $daily('expense', false);
        $monthDailyNet = $daily('income', true) - $daily('expense', true);

        return [
            'scope'                   => 'own',
            'overall_profit'          => round($business + $dailyNet, 2),
            'monthly_profit'          => round($monthBusiness + $monthDailyNet, 2),
            'business_profit'         => round($business, 2),
            'daily_net'               => round($dailyNet, 2),
            'monthly_business_profit' => round($monthBusiness, 2),
            'monthly_daily_net'       => round($monthDailyNet, 2),
            'daily_income'            => round($daily('income', false), 2),
            'daily_expense'           => round($daily('expense', false), 2),
            'monthly_daily_income'    => round($daily('income', true), 2),
            'monthly_daily_expense'   => round($daily('expense', true), 2),
            'sales_count'             => $sold->count(),
            'monthly_sales_count'     => $thisMonth->count(),
        ];
    }

    /** The last months of their own profit, in the Overview chart's shape (holdings left at 0). */
    public static function months(User $user, int $count = 12): array
    {
        $now = CarbonImmutable::now(MasterTrend::ZONE);
        $first = $now->startOfMonth()->subMonths($count - 1);

        $business = self::soldBy($user)
            ->filter(fn ($t) => $t->archived_at->gte($first->utc()))
            ->groupBy(fn ($t) => $t->archived_at->copy()->tz(MasterTrend::ZONE)->format('Y-m'))
            ->map(fn ($sold) => BusinessProfit::realized($sold)['profit']);

        $daily = Transaction::personal()->where('user_id', $user->id)->where('date', '>=', $first->toDateString())
            ->get(['type', 'amount', 'date'])
            ->groupBy(fn ($t) => substr((string) $t->getRawOriginal('date'), 0, 7));

        $out = [];
        for ($m = $first; $m <= $now; $m = $m->addMonth()) {
            $key = $m->format('Y-m');
            $rows = $daily[$key] ?? collect();
            $out[] = [
                'month'            => $key,
                'business_profit'  => round($business[$key] ?? 0, 2),
                'daily_income'     => round((float) $rows->where('type', 'income')->sum('amount'), 2),
                'daily_expense'    => round((float) $rows->where('type', 'expense')->sum('amount'), 2),
                'php_balance'      => 0, 'usd_balance' => 0, 'gold_stash' => 0, 'account_gold' => 0, 'account_cash_php' => 0,
            ];
        }

        return $out;
    }
}
