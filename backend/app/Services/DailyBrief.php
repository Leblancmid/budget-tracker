<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\RecurringEntry;
use App\Models\Transaction;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * The Daily Expenses weekly brief, for one person: the last 7 days of spending compared with the
 * week before, budgets that are over or heading there, and things worth a look (spending with no
 * budget, unusually big expenses, bills coming up, days with nothing logged). Only that person's
 * personal transactions count (business-tagged ones are left out, as on the dashboard).
 * Plain rules on their own numbers, so it's free and always the same for the same data.
 */
class DailyBrief
{
    /** Warn about a budget's pace only after this many days of the month (too noisy before). */
    private const PACE_FROM_DAY = 5;

    /** "May go over" once the month-end projection passes the budget by this much. */
    private const PACE_MARGIN = 1.05;

    /** A category without a budget is worth mentioning at this share of the month's spending… */
    private const UNBUDGETED_SHARE = 0.15;

    /** …and at least this many pesos. */
    private const UNBUDGETED_MIN = 1000;

    /** A big expense: this many times the category's usual (median) spend… */
    private const BIG_FACTOR = 3;

    /** …at least this many pesos, judged against at least this many earlier entries. */
    private const BIG_MIN = 1000;

    private const BIG_MIN_HISTORY = 5;

    /** Mention a gap in logging after this many days. */
    private const GAP_DAYS = 3;

    /** @return array<string, mixed> */
    public static function build(int $userId, ?CarbonImmutable $today = null): array
    {
        $today ??= CarbonImmutable::now(BalanceInterest::ZONE)->startOfDay();
        $from       = $today->subDays(6); // the last 7 days, today included
        $prevFrom   = $from->subDays(7);
        $monthStart = $today->startOfMonth();

        $base = fn () => Transaction::where('user_id', $userId)->personal();
        $between = fn (Builder $q, CarbonImmutable $a, CarbonImmutable $b) => $q->whereBetween('date', [$a->format('Y-m-d'), $b->format('Y-m-d')]);

        $week     = $between($base(), $from, $today)->with('category:id,name')->get();
        $prevWeek = $between($base(), $prevFrom, $from->subDay())->get();
        $month    = $between($base(), $monthStart, $today)->with('category:id,name')->get();

        $spent     = fn (Collection $t) => (float) $t->where('type', 'expense')->sum('amount');
        $earned    = fn (Collection $t) => (float) $t->where('type', 'income')->sum('amount');
        $byCategory = $month->where('type', 'expense')->groupBy('category_id')
            ->map(fn ($t) => ['name' => $t->first()->category?->name ?? 'Uncategorised', 'spent' => (float) $t->sum('amount')]);

        $budgets = Budget::where('user_id', $userId)->where('month', $today->month)->where('year', $today->year)
            ->with('category:id,name')->get();
        $daysLeft = $today->daysInMonth - $today->day + 1; // today included
        $budgetTotal = (float) $budgets->sum('amount');
        $budgetSpent = (float) $budgets->sum(fn ($b) => $byCategory[$b->category_id]['spent'] ?? 0);

        $insights = collect()
            ->push(self::spending($week, $prevWeek, $spent))
            ->merge(self::budgets($budgets, $byCategory, $today, $daysLeft))
            ->push(self::unbudgeted($budgets, $byCategory, $spent($month), $today))
            ->merge(self::bigExpenses($userId, $week, $today))
            ->push(self::upcoming($userId, $today))
            ->push(self::gap($userId, $today))
            ->push(self::noIncome($userId, $earned($month), $today))
            ->filter()->values();

        $order = ['bad' => 0, 'warn' => 1, 'good' => 2, 'info' => 3];

        return [
            'from'    => $from->format('Y-m-d'),
            'to'      => $today->format('Y-m-d'),
            // Monday of this week, so the app knows when there's a new brief to read
            'week'    => $today->startOfWeek(CarbonImmutable::MONDAY)->format('Y-m-d'),
            'summary' => [
                'spent'        => round($spent($week), 2),
                'prev_spent'   => round($spent($prevWeek), 2),
                'income'       => round($earned($week), 2),
                'month_spent'  => round($spent($month), 2),
                'month_budget' => $budgetTotal > 0 ? round($budgetTotal, 2) : null,
                // What's left of the budgets, spread over the days left (today included)
                'safe_per_day' => $budgetTotal > 0 ? round(max(0, $budgetTotal - $budgetSpent) / $daysLeft, 2) : null,
                'days_left'    => $daysLeft,
            ],
            'insights' => $insights->sortBy(fn ($i) => $order[$i['level']])->values()->all(),
        ];
    }

    private static function insight(string $key, string $level, string $title, string $detail, ?string $link = null): array
    {
        return compact('key', 'level', 'title', 'detail', 'link');
    }

    private static function peso(float $v): string
    {
        return ($v < 0 ? '−₱' : '₱') . number_format(abs($v), 0);
    }

    /** The last 7 days against the 7 before, and where most of it went. */
    private static function spending(Collection $week, Collection $prev, \Closure $spent): ?array
    {
        $now = $spent($week);
        $before = $spent($prev);
        if ($now == 0 && $before == 0) {
            return null;
        }
        $top = $week->where('type', 'expense')->groupBy(fn ($t) => $t->category?->name ?? 'Uncategorised')
            ->map(fn ($t) => (float) $t->sum('amount'))->sortDesc()->take(2);
        $where = $top->isEmpty() ? 'Nothing spent this week.'
            : 'Most went to ' . $top->map(fn ($v, $name) => $name . ' (' . self::peso($v) . ')')->values()->implode(' and ') . '.';

        if ($before == 0) {
            return self::insight('spending', 'info', self::peso($now) . ' spent in the last 7 days', $where, '/transactions');
        }
        $diff = $now - $before;
        $pct = abs($diff) / $before * 100;
        $level = $diff <= 0 ? 'good' : ($pct > 10 ? 'warn' : 'info');

        return self::insight('spending', $level,
            self::peso($now) . ' spent in the last 7 days, ' . ($diff <= 0 ? 'down ' : 'up ') . self::peso(abs($diff)) . sprintf(' (%d%%) from the week before', round($pct)),
            $where, '/transactions');
    }

    /** Budgets already over, and budgets on pace to go over by month end. */
    private static function budgets(Collection $budgets, Collection $byCategory, CarbonImmutable $today, int $daysLeft): array
    {
        $out = [];
        foreach ($budgets as $b) {
            $limit = (float) $b->amount;
            $used = $byCategory[$b->category_id]['spent'] ?? 0;
            $name = $b->category?->name ?? 'A category';
            if ($limit <= 0) {
                continue;
            }
            if ($used > $limit) {
                $out[] = self::insight('over:' . $b->category_id, 'bad', $name . ' is over budget',
                    self::peso($used) . ' spent of ' . self::peso($limit) . sprintf(' (%d%%), with %d day%s left in %s.',
                        round($used / $limit * 100), $daysLeft, $daysLeft === 1 ? '' : 's', $today->format('F')), '/budgets');

                continue;
            }
            if ($today->day < self::PACE_FROM_DAY || $used <= 0) {
                continue;
            }
            $perDay = $used / $today->day;
            if ($perDay * $today->daysInMonth <= $limit * self::PACE_MARGIN) {
                continue;
            }
            // The day the budget runs out at this pace
            $runsOut = $today->startOfMonth()->addDays((int) ceil($limit / $perDay) - 1);
            $safe = ($limit - $used) / $daysLeft;
            $out[] = self::insight('pace:' . $b->category_id, 'warn', $name . ' may go over budget',
                self::peso($used) . ' of ' . self::peso($limit) . ' spent by ' . $today->format('M j') . '. At this pace it runs out around '
                    . $runsOut->format('M j') . '; ' . self::peso($safe) . ' a day keeps it on budget.', '/budgets');
        }

        return $out;
    }

    /** A big share of spending in a category with no budget (or no budgets at all this month). */
    private static function unbudgeted(Collection $budgets, Collection $byCategory, float $monthSpent, CarbonImmutable $today): ?array
    {
        if ($monthSpent <= 0) {
            return null;
        }
        if ($budgets->isEmpty()) {
            $top = $byCategory->sortByDesc('spent')->take(2)->pluck('name')->implode(' and ');

            return self::insight('no_budgets', 'info', 'No budgets set for ' . $today->format('F'),
                self::peso($monthSpent) . ' spent so far. Copy last month\'s budgets, or set one for ' . $top . '.', '/budgets');
        }
        $budgeted = $budgets->pluck('category_id')->all();
        $biggest = $byCategory->reject(fn ($c, $id) => in_array($id, $budgeted))
            ->filter(fn ($c) => $c['spent'] >= self::UNBUDGETED_MIN && $c['spent'] / $monthSpent >= self::UNBUDGETED_SHARE)
            ->sortByDesc('spent')->first();
        if (! $biggest) {
            return null;
        }

        return self::insight('unbudgeted', 'info', $biggest['name'] . ' has no budget: ' . self::peso($biggest['spent']) . ' this month',
            sprintf('That\'s %d%% of your spending in %s. Give it a budget', round($biggest['spent'] / $monthSpent * 100), $today->format('F'))
                . ($biggest['name'] === 'Others' ? ', or move some of it into clearer categories.' : '.'), '/budgets');
    }

    /** Expenses this week far above what that category usually costs. */
    private static function bigExpenses(int $userId, Collection $week, CarbonImmutable $today): array
    {
        $big = $week->where('type', 'expense')->filter(fn ($t) => (float) $t->amount >= self::BIG_MIN);
        if ($big->isEmpty()) {
            return [];
        }
        $history = Transaction::where('user_id', $userId)->personal()->where('type', 'expense')
            ->whereIn('category_id', $big->pluck('category_id')->unique())
            ->whereBetween('date', [$today->subDays(97)->format('Y-m-d'), $today->subDays(7)->format('Y-m-d')])
            ->get(['category_id', 'amount'])->groupBy('category_id');

        return $big->map(function ($t) use ($history) {
            $past = ($history[$t->category_id] ?? collect())->pluck('amount')->map(fn ($a) => (float) $a);
            if ($past->count() < self::BIG_MIN_HISTORY) {
                return null;
            }
            $usual = (float) $past->median();
            if ($usual <= 0 || (float) $t->amount < $usual * self::BIG_FACTOR) {
                return null;
            }
            $name = $t->category?->name ?? 'a category';

            return ['t' => $t, 'x' => (float) $t->amount / $usual, 'usual' => $usual, 'name' => $name];
        })->filter()->sortByDesc('x')->take(3)
            ->map(fn ($b) => self::insight('big:' . $b['t']->id, 'info', 'Big expense: ' . self::peso((float) $b['t']->amount) . ' on ' . $b['name'],
                ($b['t']->description ? '"' . $b['t']->description . '" on ' : 'On ') . $b['t']->date->format('M j')
                    . sprintf(', about %d× your usual %s spend (%s).', round($b['x']), $b['name'], self::peso($b['usual'])), '/transactions'))
            ->values()->all();
    }

    /** Recurring entries that will post in the next 7 days. */
    private static function upcoming(int $userId, CarbonImmutable $today): ?array
    {
        $due = RecurringEntry::where('user_id', $userId)->where('active', true)
            ->whereBetween('next_date', [$today->format('Y-m-d'), $today->addDays(7)->format('Y-m-d')])
            ->with('category:id,name')->orderBy('next_date')->get();
        if ($due->isEmpty()) {
            return null;
        }
        $expenses = (float) $due->where('type', 'expense')->sum('amount');
        $list = $due->take(4)->map(fn ($r) => ($r->description ?: $r->category?->name ?: 'Entry') . ' ' . self::peso((float) $r->amount)
            . ' on ' . CarbonImmutable::parse($r->next_date)->format('M j'))->implode(' · ');

        return self::insight('upcoming', 'info',
            $due->count() . ' recurring entr' . ($due->count() === 1 ? 'y posts' : 'ies post') . ' this week'
                . ($expenses > 0 ? ' (' . self::peso($expenses) . ' out)' : ''),
            $list . ($due->count() > 4 ? ' · and ' . ($due->count() - 4) . ' more.' : '.'), '/transactions');
    }

    /** Nothing logged for a few days: totals are probably missing something. */
    private static function gap(int $userId, CarbonImmutable $today): ?array
    {
        $last = Transaction::where('user_id', $userId)->personal()->where('date', '<=', $today->format('Y-m-d'))->max('date');
        if (! $last) {
            return null;
        }
        // A calendar date: read it in the same (Manila) zone as today, or the count is a day short
        $lastDay = CarbonImmutable::parse($last instanceof \DateTimeInterface ? $last->format('Y-m-d') : $last, $today->getTimezone())->startOfDay();
        $days = (int) $lastDay->diffInDays($today);
        if ($days < self::GAP_DAYS) {
            return null;
        }

        return self::insight('gap', 'info', "Nothing logged for {$days} days",
            'The last entry was on ' . $lastDay->format('M j') . '. Catch up with Quick add (Ctrl+K), one line per expense.', '/transactions');
    }

    /** Halfway-ish through the month with no income, when last month had some. */
    private static function noIncome(int $userId, float $monthIncome, CarbonImmutable $today): ?array
    {
        if ($monthIncome > 0 || $today->day < 10) {
            return null;
        }
        $lastMonth = $today->subMonthNoOverflow();
        $before = (float) Transaction::where('user_id', $userId)->personal()->where('type', 'income')
            ->whereBetween('date', [$lastMonth->startOfMonth()->format('Y-m-d'), $lastMonth->endOfMonth()->format('Y-m-d')])
            ->sum('amount');
        if ($before <= 0) {
            return null;
        }

        return self::insight('no_income', 'info', 'No income logged in ' . $today->format('F') . ' yet',
            'In ' . $lastMonth->format('F') . ' you logged ' . self::peso($before) . '. If you\'ve been paid, add it so your net is right.', '/transactions');
    }
}
