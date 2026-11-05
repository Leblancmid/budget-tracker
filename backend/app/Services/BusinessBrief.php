<?php

namespace App\Services;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\RucoyAccount;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * The weekly brief: the last 7 days of the business compared with before, plus the things
 * that need you (slow listings, overdue payments, gold not received, wallets to check).
 * Plain rules on your own numbers, so it's free and always the same for the same data.
 */
class BusinessBrief
{
    /** A listing is slow once it's been up this many times your usual days-to-sell. */
    private const SLOW_FACTOR = 1.5;

    /** …and at least this many days. */
    private const SLOW_MIN_DAYS = 7;

    /** Check a wallet against the bank at least this often. */
    private const CHECK_EVERY_DAYS = 7;

    /** @return array<string, mixed> */
    public static function build(?CarbonImmutable $today = null): array
    {
        $today ??= CarbonImmutable::now(BalanceInterest::ZONE)->startOfDay();
        $from     = $today->subDays(6);            // the last 7 days, today included
        $prevFrom = $from->subDays(7);
        $end      = $today->addDay();

        $week = self::sold($from, $end);
        $prev = self::sold($prevFrom, $from);
        $usualGold = self::goldMargin(self::sold($today->subDays(60), $from)->where('type', 'gold'));
        $weekGold  = self::goldMargin($week->where('type', 'gold'));

        $insights = collect()
            ->push(self::profitInsight($week, $prev))
            ->push(self::goldMarginInsight($weekGold, $usualGold, $week->where('type', 'gold')->count()))
            ->merge(self::slowListings($today))
            ->merge(self::overduePayments($today))
            ->merge(self::goldNotReceived($today))
            ->push(self::awaitingPricing())
            ->merge(self::wallets($today))
            ->push(self::stash())
            ->filter()->values();

        $order = ['bad' => 0, 'warn' => 1, 'good' => 2, 'info' => 3];

        return [
            'from'    => $from->format('Y-m-d'),
            'to'      => $today->format('Y-m-d'),
            // Monday of this week, so the app knows when there's a new brief to read
            'week'    => $today->startOfWeek(CarbonImmutable::MONDAY)->format('Y-m-d'),
            'summary' => [
                'profit'         => round(self::profit($week), 2),
                'prev_profit'    => round(self::profit($prev), 2),
                'accounts_sold'  => $week->where('type', 'account')->count(),
                'gold_sold'      => $week->where('type', 'gold')->count(),
                'gold_margin'    => $weekGold !== null ? round($weekGold * 100, 1) : null,
                'usual_gold_margin' => $usualGold !== null ? round($usualGold * 100, 1) : null,
            ],
            'insights' => $insights->sortBy(fn ($i) => $order[$i['level']])->values()->all(),
        ];
    }

    /** Sold (archived) accounts and gold trades between two Manila days ($to not included). */
    private static function sold(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return BusinessTransaction::archived()->whereIn('type', ['account', 'gold'])
            ->where('archived_at', '>=', $from->utc())->where('archived_at', '<', $to->utc())
            ->get();
    }

    private static function profit(Collection $sold): float
    {
        return (float) $sold->sum('price_php') - (float) $sold->sum('cost_php');
    }

    private static function goldMargin(Collection $gold): ?float
    {
        $priced = $gold->filter(fn ($t) => (float) $t->price_php > 0 && $t->cost_php !== null);
        $price  = (float) $priced->sum('price_php');

        return $price > 0 ? ($price - (float) $priced->sum('cost_php')) / $price : null;
    }

    private static function insight(string $key, string $level, string $title, string $detail, ?string $link = null): array
    {
        return compact('key', 'level', 'title', 'detail', 'link');
    }

    private static function peso(float $v): string
    {
        return ($v < 0 ? '−₱' : '₱') . number_format(abs($v), 0);
    }

    private static function profitInsight(Collection $week, Collection $prev): array
    {
        $now    = self::profit($week);
        $before = self::profit($prev);
        $sales  = $week->count();
        if ($sales === 0) {
            return self::insight('profit', 'warn', 'No sales in the last 7 days',
                'Nothing was sold this week' . ($prev->count() ? ' (the week before made ' . self::peso($before) . ').' : '.'), '/business/transactions');
        }
        $diff  = $now - $before;
        $parts = [];
        foreach (['account' => 'account', 'gold' => 'gold trade'] as $type => $label) {
            $n = $week->where('type', $type)->count();
            if ($n) {
                $parts[] = $n . ' ' . $label . ($n === 1 ? '' : 's') . ' (' . self::peso(self::profit($week->where('type', $type))) . ')';
            }
        }

        return self::insight('profit', $diff >= 0 ? 'good' : 'warn',
            self::peso($now) . ' profit this week, ' . ($diff >= 0 ? 'up ' : 'down ') . self::peso(abs($diff)) . ' from last week',
            'Sold ' . implode(' and ', $parts) . '.', '/business');
    }

    private static function goldMarginInsight(?float $week, ?float $usual, int $count): ?array
    {
        if ($week === null || $usual === null || $count === 0) {
            return null;
        }
        $pts = ($week - $usual) * 100;
        if (abs($pts) < 2) {
            return null; // about the same: nothing to say
        }

        return $pts < 0
            ? self::insight('gold_margin', 'warn', sprintf('Gold margin dropped to %.1f%%', $week * 100),
                sprintf('Your usual is %.1f%% (last 60 days). Buy cheaper or raise your sell rate; see the Price Guide when adding gold.', $usual * 100), '/business/transactions')
            : self::insight('gold_margin', 'good', sprintf('Gold margin up to %.1f%%', $week * 100),
                sprintf('Better than your usual %.1f%%.', $usual * 100));
    }

    /** Listed accounts up for much longer than you usually take to sell. */
    private static function slowListings(CarbonImmutable $today): array
    {
        $days = PriceGuide::soldAccounts()->pluck('days_to_sell')->filter(fn ($d) => $d !== null);
        $usual = $days->count() ? $days->avg() : null;
        $limit = max(self::SLOW_MIN_DAYS, ($usual ?? self::SLOW_MIN_DAYS) * self::SLOW_FACTOR);

        return RucoyAccount::active()->whereNotNull('listed_at')->get()
            ->map(fn ($a) => ['a' => $a, 'days' => (int) floor($a->listed_at->diffInHours($today->utc()) / 24)])
            ->filter(fn ($x) => $x['days'] >= $limit)
            ->sortByDesc('days')
            ->map(fn ($x) => self::insight('slow_listing:' . $x['a']->id, 'warn',
                ($x['a']->description ?: 'An account') . ' has been listed ' . $x['days'] . ' days',
                ($usual !== null ? sprintf('You usually sell in %.0f days. ', $usual) : '')
                    . self::slowAdvice(WebsiteStats::viewsOf($x['a']->id), $x['days']), '/business/transactions'))
            ->values()->all();
    }

    /**
     * What to do about a slow listing, using its website views when known: plenty of views but
     * no sale usually means the price; few views means people aren't seeing it.
     */
    private static function slowAdvice(?int $views, int $days): string
    {
        if ($views === null) {
            return 'Consider a lower price, a fresh screenshot, or posting it again.';
        }
        $perWeek = $views / max(1, $days / 7);
        if ($views >= 10 && $perWeek >= 3) {
            return "Viewed {$views} times on the website but not sold: the price is probably the problem.";
        }

        return "Only {$views} website view" . ($views === 1 ? '' : 's') . ': post it again or share the link more.';
    }

    /** Accounts whose payment date has passed and aren't fully paid. */
    private static function overduePayments(CarbonImmutable $today): array
    {
        return RucoyAccount::active()->whereNotNull('payment_date')
            ->where('payment_date', '<', $today->format('Y-m-d'))
            ->where('payment_status', '!=', 'fully_paid')
            ->orderBy('payment_date')->get()
            ->map(fn ($a) => self::insight('overdue:' . $a->id, 'bad',
                'Payment overdue: ' . ($a->description ?: $a->email),
                'Was due ' . CarbonImmutable::parse($a->payment_date)->format('M j')
                    . ' (' . str_replace('_', ' ', $a->payment_status) . ').', '/business/transactions'))
            ->all();
    }

    /** Gold trades still waiting for the buyer's gold after a week. */
    private static function goldNotReceived(CarbonImmutable $today): array
    {
        return BusinessTransaction::active()->where('type', 'gold')->whereNull('system_key')
            ->whereNotNull('price_gold_received')->whereColumn('price_gold_received', '<', 'price_gold')
            ->where('date', '<=', $today->subDays(7)->format('Y-m-d'))
            ->orderBy('date')->get()
            ->map(function ($t) use ($today) {
                $left = (float) $t->price_gold - (float) $t->price_gold_received;

                return self::insight('gold_pending:' . $t->id, 'warn',
                    ($t->description ?: 'A gold trade') . ': ' . self::gold($left) . ' still not received',
                    'Started ' . (int) CarbonImmutable::parse($t->date->format('Y-m-d'))->diffInDays($today) . ' days ago.', '/business/transactions');
            })->all();
    }

    private static function awaitingPricing(): ?array
    {
        $n = BusinessTransaction::active()->whereIn('type', ['account', 'gold'])->whereNull('price_php')->count();

        return $n ? self::insight('awaiting_pricing', 'info', $n . ' item' . ($n === 1 ? '' : 's') . ' awaiting pricing',
            'Add the rates so your profit and net worth are complete.', '/business/transactions') : null;
    }

    /** Wallets below zero, and wallets not checked against the bank lately. */
    private static function wallets(CarbonImmutable $today): array
    {
        $balances = BalanceEntry::selectRaw("account, SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END) as b")
            ->groupBy('account')->pluck('b', 'account');
        $visible = BalanceAccount::whereNull('hidden_at')->orderBy('sort_order')->get()
            ->filter(fn ($a) => isset($balances[$a->code]));

        $out = $visible->filter(fn ($a) => (float) $balances[$a->code] < -0.004)
            ->map(fn ($a) => self::insight('negative:' . $a->code, 'bad', $a->name . ' is below zero',
                'The app shows ' . ($a->currency === 'USD' ? '$' : '₱') . number_format((float) $balances[$a->code], 2)
                    . '. An entry is probably missing: run a bank check.', '/master/balance'))
            ->values()->all();

        $stale = $visible->filter(fn ($a) => ! $a->checked_at
            || $a->checked_at->format('Y-m-d') < $today->subDays(self::CHECK_EVERY_DAYS)->format('Y-m-d'));
        if ($stale->isNotEmpty()) {
            $out[] = self::insight('check_wallets', 'info',
                'Check ' . $stale->pluck('name')->implode(', ') . ' against the bank',
                'Not checked in the last ' . self::CHECK_EVERY_DAYS . ' days. Use Check on each account in Balance: it fixes any difference in one click.', '/master/balance');
        }

        return $out;
    }

    private static function stash(): ?array
    {
        $gold = (float) Gold::sum('amount');
        if ($gold < 1_000_000) {
            return null;
        }
        $rate  = PriceGuide::gold()['sell_rate'];
        $php   = BusinessTransaction::where('type', 'gold')->whereNotNull('php_rate')->latest('date')->value('php_rate');
        $value = $rate && $php ? $gold / 1_000_000 * $rate * (float) $php : null;

        return self::insight('stash', 'info', self::gold($gold) . ' in your gold stash',
            $value ? 'About ' . self::peso($value) . ' at your recent sell rate of $' . rtrim(rtrim(number_format($rate, 4), '0'), '.') . '/KK.' : 'Gold waiting to be sold.', '/rucoy');
    }

    /** 540000000 → "540KK", 1800000000 → "1.8KKK" (how gold is quoted in trade chats). */
    private static function gold(float $g): string
    {
        return $g >= 1_000_000_000
            ? rtrim(rtrim(number_format($g / 1_000_000_000, 2), '0'), '.') . 'KKK'
            : rtrim(rtrim(number_format($g / 1_000_000, 1), '0'), '.') . 'KK';
    }
}
