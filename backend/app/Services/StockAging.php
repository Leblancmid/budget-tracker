<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Money in stock: what you paid for the accounts and gold you haven't sold yet, how long each has
 * sat, and what it would likely bring. Helps decide what to sell off cheaper to free up cash.
 *
 * Likely value: the price you set, else (accounts) what similar accounts sold for, (gold) the gold
 * at your recent sell rate. Unknown when there's nothing to go on.
 */
class StockAging
{
    /** How the money is split by age (days held, up to and including max) */
    public const BUCKETS = [
        ['key' => 'fresh', 'label' => 'Under 2 weeks', 'max' => 13],
        ['key' => 'weeks', 'label' => '2–4 weeks', 'max' => 29],
        ['key' => 'month', 'label' => '1–2 months', 'max' => 59],
        ['key' => 'old', 'label' => 'Over 2 months', 'max' => null],
    ];

    /** @return array{items: list<array<string, mixed>>, totals: array<string, mixed>, buckets: list<array<string, mixed>>} */
    public static function build(): array
    {
        $today = CarbonImmutable::now(BalanceInterest::ZONE)->startOfDay();
        $open  = BusinessTransaction::active()->whereIn('type', ['account', 'gold'])->whereNull('system_key')->get();
        $accounts = RucoyAccount::whereIn('id', $open->pluck('account_id')->filter())->get()->keyBy('id');
        $goldValue = self::goldValuePerG();

        $items = $open->map(function (BusinessTransaction $t) use ($today, $accounts, $goldValue) {
            $held = $t->date ? (int) CarbonImmutable::parse($t->date->toDateString(), BalanceInterest::ZONE)->diffInDays($today) : null;
            [$value, $source, $usualDays] = $t->type === 'account'
                ? self::accountValue($t, $accounts->get($t->account_id))
                : self::goldValue($t, $goldValue);
            $cost = $t->cost_php !== null ? (float) $t->cost_php : null;

            return [
                'id'         => $t->id,
                'type'       => $t->type,
                'name'       => $t->description ?: ($t->type === 'gold' ? 'Gold trade' : 'Account'),
                'held_days'  => $held,
                'usual_days' => $usualDays,
                'cost_php'   => $cost !== null ? round($cost, 2) : null,
                'value_php'  => $value !== null ? round($value, 2) : null,
                // price: the price you set · guide: what similar sold for / your recent gold rate
                'value_from' => $source,
            ];
        })->sortByDesc(fn ($i) => $i['held_days'] ?? -1)->values();

        return ['items' => $items->all(), 'totals' => self::totals($items), 'buckets' => self::buckets($items)];
    }

    /** @return array{0: ?float, 1: ?string, 2: ?float} value, where it came from, days similar ones took to sell */
    private static function accountValue(BusinessTransaction $t, ?RucoyAccount $a): array
    {
        $a ??= new RucoyAccount(['description' => $t->description]);
        $guide = PriceGuide::account(PriceGuide::levelOf($a), PriceGuide::classOf($a), $a->id);
        if ($t->price_php !== null && (float) $t->price_php > 0) {
            return [(float) $t->price_php, 'price', $guide['days_to_sell']];
        }

        return [$guide['price_php'], $guide['price_php'] !== null ? 'guide' : null, $guide['days_to_sell']];
    }

    /** @return array{0: ?float, 1: ?string, 2: null} */
    private static function goldValue(BusinessTransaction $t, ?float $perG): array
    {
        if ($t->price_php !== null && (float) $t->price_php > 0) {
            return [(float) $t->price_php, 'price', null];
        }
        $gold = (float) ($t->price_gold ?? 0);

        return $gold > 0 && $perG !== null ? [$gold * $perG, 'guide', null] : [null, null, null];
    }

    /** ₱ per gold at your recent sell rate ($ per 1M) and the latest $→₱ rate, or null without sales */
    private static function goldValuePerG(): ?float
    {
        $guide = PriceGuide::gold();
        $rate  = $guide['recent_sell_rate'] ?? $guide['sell_rate'];
        $php   = BusinessTransaction::where('type', 'gold')->whereNotNull('php_rate')->latest('date')->value('php_rate');

        return $rate && $php ? (float) $rate * (float) $php / 1_000_000 : null;
    }

    /** @param Collection<int, array<string, mixed>> $items */
    private static function totals(Collection $items): array
    {
        $both = $items->filter(fn ($i) => $i['cost_php'] !== null && $i['value_php'] !== null);

        return [
            'count'          => $items->count(),
            'cost_php'       => round((float) $items->sum('cost_php'), 2),
            'value_php'      => round((float) $items->sum('value_php'), 2),
            // Profit if everything with both a cost and a value sold at that value
            'profit_php'     => round((float) $both->sum(fn ($i) => $i['value_php'] - $i['cost_php']), 2),
            'unvalued'       => $items->whereNull('value_php')->count(),
            'oldest_days'    => $items->max('held_days'),
            // Held longer than similar accounts usually take to sell
            'overdue'        => $items->filter(fn ($i) => $i['usual_days'] !== null && $i['held_days'] !== null && $i['held_days'] > $i['usual_days'] * 2)->count(),
        ];
    }

    /** @param Collection<int, array<string, mixed>> $items */
    private static function buckets(Collection $items): array
    {
        $min = 0;

        return array_map(function (array $b) use ($items, &$min) {
            $in = $items->filter(fn ($i) => ($i['held_days'] ?? 0) >= $min && ($b['max'] === null || ($i['held_days'] ?? 0) <= $b['max']));
            $min = ($b['max'] ?? 0) + 1;

            return ['key' => $b['key'], 'label' => $b['label'], 'count' => $in->count(), 'cost_php' => round((float) $in->sum('cost_php'), 2)];
        }, self::BUCKETS);
    }
}
