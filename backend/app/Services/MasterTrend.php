<?php

namespace App\Services;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\Transaction;
use Carbon\CarbonImmutable;

/**
 * Master → Overview charts: month by month (Manila months), what was earned and what was held
 * at each month's end. Holdings are raw amounts (₱, $, gold); the page values gold and dollars
 * at today's rates, like the rest of the Overview.
 */
class MasterTrend
{
    public const ZONE = 'Asia/Manila';

    /**
     * @return list<array{month: string, business_profit: float, daily_income: float, daily_expense: float,
     *     php_balance: float, usd_balance: float, gold_stash: float, account_gold: float, account_cash_php: float}>
     */
    public static function months(int $count = 12, ?int $userId = null): array
    {
        $now = CarbonImmutable::now(self::ZONE);
        $first = $now->startOfMonth()->subMonths($count - 1);
        $firstUtc = $first->utc();

        $months = [];
        for ($m = $first; $m <= $now; $m = $m->addMonth()) {
            $months[$m->format('Y-m')] = [
                // The current month ends now; earlier ones at their last second
                'end' => $m->format('Y-m') === $now->format('Y-m') ? $now->utc() : $m->endOfMonth()->utc(),
            ];
        }

        $business = self::businessProfit($firstUtc);
        [$income, $expense] = self::daily($first->toDateString(), $userId);
        $php = self::balance(BalanceAccount::codesFor('PHP'), $first->toDateString(), array_keys($months));
        $usd = self::balance(BalanceAccount::codesFor('USD'), $first->toDateString(), array_keys($months));
        $gold = self::goldStash($firstUtc, array_keys($months));
        $accounts = self::accountsHeld($firstUtc);

        $out = [];
        foreach ($months as $key => $m) {
            [$accountGold, $accountCash] = self::accountsAt($accounts, $m['end']);
            $out[] = [
                'month' => $key,
                'business_profit' => round($business[$key] ?? 0, 2),
                'daily_income' => round($income[$key] ?? 0, 2),
                'daily_expense' => round($expense[$key] ?? 0, 2),
                'php_balance' => round($php[$key], 2),
                'usd_balance' => round($usd[$key], 2),
                'gold_stash' => round($gold[$key], 2),
                'account_gold' => round($accountGold, 2),
                'account_cash_php' => round($accountCash, 2),
            ];
        }

        return $out;
    }

    /** Sold profit per month, by when it was sold (the same figure as Business → Stats). */
    private static function businessProfit(CarbonImmutable $fromUtc): array
    {
        return BusinessTransaction::archived()->where('archived_at', '>=', $fromUtc)
            ->get(['type', 'price_php', 'cost_php', 'amount', 'archived_at'])
            ->groupBy(fn ($t) => $t->archived_at->copy()->tz(self::ZONE)->format('Y-m'))
            ->map(fn ($sold) => BusinessProfit::realized($sold)['profit'])
            ->all();
    }

    /** Personal income and expenses per month (Daily Expenses), of one person when given. */
    private static function daily(string $fromDate, ?int $userId): array
    {
        $rows = Transaction::personal()->where('date', '>=', $fromDate)
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->selectRaw('substr(date, 1, 7) as ym, type, sum(amount) as total')
            ->groupBy('ym', 'type')->get();

        $income = $expense = [];
        foreach ($rows as $r) {
            if ($r->type === 'income') {
                $income[$r->ym] = (float) $r->total;
            } else {
                $expense[$r->ym] = (float) $r->total;
            }
        }

        return [$income, $expense];
    }

    /**
     * Wallet balance at each month's end: everything before the first month, plus each month's movements.
     *
     * @param  list<string>  $codes
     * @param  list<string>  $keys
     */
    private static function balance(array $codes, string $fromDate, array $keys): array
    {
        $signed = "sum(case when type = 'add' then amount else -amount end)";
        $opening = (float) BalanceEntry::whereIn('account', $codes)->where('date', '<', $fromDate)->selectRaw("{$signed} as total")->value('total');
        $moves = BalanceEntry::whereIn('account', $codes)->where('date', '>=', $fromDate)
            ->selectRaw("substr(date, 1, 7) as ym, {$signed} as total")->groupBy('ym')
            ->pluck('total', 'ym');

        return self::running($opening, $keys, fn ($key) => (float) ($moves[$key] ?? 0), $moves->filter(fn ($v, $ym) => $ym > end($keys))->sum());
    }

    /** Gold stash at each month's end, from when its entries were added. */
    private static function goldStash(CarbonImmutable $fromUtc, array $keys): array
    {
        $opening = (float) Gold::where('created_at', '<', $fromUtc)->sum('amount');
        $moves = Gold::where('created_at', '>=', $fromUtc)->get(['amount', 'created_at'])
            ->groupBy(fn ($g) => $g->created_at->copy()->tz(self::ZONE)->format('Y-m'))
            ->map(fn ($rows) => (float) $rows->sum('amount'));

        return self::running($opening, $keys, fn ($key) => (float) ($moves[$key] ?? 0));
    }

    /**
     * Opening amount plus each month's movements, carried forward. Anything dated after the last
     * month (e.g. a future-dated entry) lands in the last month so it matches today's totals.
     */
    private static function running(float $opening, array $keys, callable $move, float $later = 0): array
    {
        $total = $opening;
        $out = [];
        foreach ($keys as $i => $key) {
            $total += $move($key) + ($i === count($keys) - 1 ? $later : 0);
            $out[$key] = $total;
        }

        return $out;
    }

    /** Accounts that were (or still are) in stock since the first month, with their cost. */
    private static function accountsHeld(CarbonImmutable $fromUtc): array
    {
        $accounts = RucoyAccount::where(fn ($q) => $q->whereNull('archived_at')->orWhere('archived_at', '>=', $fromUtc))
            ->get(['id', 'cost', 'created_at', 'archived_at']);

        // Accounts bought with cash have a ₱ cost on their sale record instead of a gold cost
        $cashIds = $accounts->filter(fn ($a) => ! (float) $a->cost)->pluck('id');
        $cash = BusinessTransaction::where('type', 'account')->whereIn('account_id', $cashIds)
            ->selectRaw('account_id, sum(cost_php) as total')->groupBy('account_id')->pluck('total', 'account_id');

        return $accounts->map(fn ($a) => [
            'gold' => (float) $a->cost,
            'cash' => (float) ($cash[$a->id] ?? 0),
            'from' => $a->created_at,
            'until' => $a->archived_at,
        ])->all();
    }

    /** Gold and ₱ cost of the accounts in stock at this moment. */
    private static function accountsAt(array $accounts, CarbonImmutable $at): array
    {
        $gold = $cash = 0.0;
        foreach ($accounts as $a) {
            if ($a['from'] <= $at && ($a['until'] === null || $a['until'] > $at)) {
                $gold += $a['gold'];
                $cash += $a['cash'];
            }
        }

        return [$gold, $cash];
    }
}
