<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Price suggestions from your own past sales (no AI, just your numbers):
 * what similar accounts sold for and the most to pay to keep your usual margin, and the
 * gold rates you've been selling / buying at lately.
 */
class PriceGuide
{
    public const CLASSES = ['melee', 'distance', 'magic'];

    /** How many sold accounts to compare with. */
    private const COMPARABLES = 5;

    /**
     * Price climbs steeply with level, so look close first and only widen the search
     * until there are at least MIN_COMPARABLES similar sales.
     */
    private const LEVEL_RANGES = [10, 20, 40, 80];

    private const MIN_COMPARABLES = 3;

    /**
     * Sold accounts like this one (same class, nearest level) and what they suggest.
     *
     * @return array<string, mixed>
     */
    public static function account(?int $level, ?string $class, ?int $excludeId = null): array
    {
        $sold = self::soldAccounts()->when($excludeId, fn ($c) => $c->where('id', '!=', $excludeId));
        $margin = self::margin($sold);

        $pool = $sold->filter(fn ($a) => $a['level'] !== null && $a['price_php'] > 0)
            ->when($class, fn ($c) => $c->where('class', $class));
        $similar = collect();
        $range   = null;
        foreach ($level ? self::LEVEL_RANGES : [] as $range) {
            $similar = $pool->filter(fn ($a) => abs($a['level'] - $level) <= $range)
                ->sortBy(fn ($a) => abs($a['level'] - $level))
                ->take(self::COMPARABLES)->values();
            if ($similar->count() >= self::MIN_COMPARABLES) {
                break;
            }
        }

        $median = fn (string $key) => self::median($similar->pluck($key)->filter(fn ($v) => $v !== null)->all());
        $pricePhp  = $median('price_php');
        $priceGold = $median('price_gold');
        $days      = $median('days_to_sell');

        return [
            'level'           => $level,
            'class'           => $class,
            'sold_count'      => $sold->count(),
            'usual_margin'    => $margin !== null ? round($margin * 100, 1) : null,
            'comparables'     => $similar->all(),
            // ± levels the comparables are within (wider = less reliable)
            'level_range'     => $similar->isNotEmpty() ? $range : null,
            'price_php'       => $pricePhp !== null ? round($pricePhp, 2) : null,
            'price_gold'      => $priceGold,
            'days_to_sell'    => $days !== null ? round($days, 1) : null,
            // The most to pay and still make your usual margin when it sells at the typical price
            'max_buy_php'     => $pricePhp !== null && $margin !== null ? round($pricePhp * (1 - $margin), 2) : null,
            'max_buy_gold'    => $priceGold !== null && $margin !== null ? round($priceGold * (1 - $margin), -6) : null,
        ];
    }

    /**
     * Gold rates from sold gold trades of the last 30 days (or the last 20 sales if fewer):
     * average sell and buy rates, margin, and the highest buy rate that keeps that margin.
     *
     * @return array<string, mixed>
     */
    public static function gold(): array
    {
        $since  = CarbonImmutable::now(BalanceInterest::ZONE)->subDays(30)->utc();
        $recent = BusinessTransaction::archived()->where('type', 'gold')->whereNull('system_key')
            ->where('price_gold', '>', 0)->whereNotNull('price_rate')
            ->where('archived_at', '>=', $since)->latest('archived_at')->get();
        if ($recent->count() < 5) {
            $recent = BusinessTransaction::archived()->where('type', 'gold')->whereNull('system_key')
                ->where('price_gold', '>', 0)->whereNotNull('price_rate')
                ->latest('archived_at')->take(20)->get();
        }

        $weighted = function (Collection $rows, string $rate, string $weight) {
            $w = (float) $rows->sum(fn ($t) => $t->{$rate} ? (float) $t->{$weight} : 0);

            return $w > 0 ? $rows->sum(fn ($t) => $t->{$rate} ? (float) $t->{$rate} * (float) $t->{$weight} : 0) / $w : null;
        };
        $sellRate = $weighted($recent, 'price_rate', 'price_gold');
        $buyRate  = $weighted($recent->filter(fn ($t) => (float) $t->cost_gold > 0), 'cost_rate', 'cost_gold');
        $margin   = self::margin($recent->map(fn ($t) => ['price_php' => (float) $t->price_php, 'cost_php' => (float) $t->cost_php]));
        // Rates drift, so the latest 5 sales say more about today's sell rate than the month
        $nowRate  = $weighted($recent->take(5), 'price_rate', 'price_gold');
        // Your usual gap between buy and sell rate, e.g. buy at 91% of the sell rate
        $ratio    = $sellRate && $buyRate ? $buyRate / $sellRate : null;

        return [
            'sales'          => $recent->count(),
            'sell_rate'      => $sellRate !== null ? round($sellRate, 4) : null,
            'recent_sell_rate' => $nowRate !== null ? round($nowRate, 4) : null,
            'buy_rate'       => $buyRate !== null ? round($buyRate, 4) : null,
            'usual_margin'   => $margin !== null ? round($margin * 100, 1) : null,
            'usual_spread'   => $ratio !== null ? round((1 - $ratio) * 100, 1) : null,
            // The most to pay per 1M G to keep your usual spread at today's sell rate
            'max_buy_rate'   => $nowRate !== null && $ratio !== null ? round($nowRate * $ratio, 4) : null,
        ];
    }

    /**
     * Sold accounts with their ₱ price / cost, level, class and days to sell.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function soldAccounts(): Collection
    {
        $pricing = BusinessTransaction::archived()->where('type', 'account')->whereNotNull('account_id')
            ->get(['account_id', 'price_php', 'cost_php'])->keyBy('account_id');

        return RucoyAccount::archived()->get()->map(function (RucoyAccount $a) use ($pricing) {
            $tx = $pricing[$a->id] ?? null;

            return [
                'id'           => $a->id,
                'description'  => $a->description,
                'level'        => self::levelOf($a),
                'class'        => self::classOf($a),
                'melee'        => $a->melee,
                'distance'     => $a->distance,
                'magic'        => $a->magic,
                'defense'      => $a->defense,
                'price_php'    => $tx?->price_php !== null ? (float) $tx->price_php : null,
                'cost_php'     => $tx?->cost_php !== null ? (float) $tx->cost_php : null,
                'price_gold'   => $a->isCash() ? null : $a->price,
                'cost_gold'    => $a->isCash() ? null : $a->cost,
                'days_to_sell' => $a->listed_at && $a->archived_at
                    ? max(0, round($a->listed_at->diffInHours($a->archived_at) / 24, 1))
                    : null,
                'sold_on'      => $a->archived_at?->setTimezone(BalanceInterest::ZONE)->format('Y-m-d'),
            ];
        })->values();
    }

    /** The level from the stats, or the number in the name ("Leblanc 583 Dist" → 583). */
    public static function levelOf(RucoyAccount $a): ?int
    {
        if ($a->level) {
            return $a->level;
        }

        return preg_match('/\b(\d{2,3})\b/', (string) $a->description, $m) ? (int) $m[1] : null;
    }

    /** melee / distance / magic: the highest skill, or a word in the name ("Dist", "Mage"). */
    public static function classOf(RucoyAccount $a): ?string
    {
        $skills = array_filter(['melee' => $a->melee, 'distance' => $a->distance, 'magic' => $a->magic], fn ($v) => $v !== null);
        if ($skills && max($skills) > 0) {
            return array_search(max($skills), $skills, true);
        }
        $name = strtolower((string) $a->description);

        return match (true) {
            (bool) preg_match('/\b(dist|distance|archer|ranged?)\b/', $name) => 'distance',
            (bool) preg_match('/\b(mage|magic|wizard)\b/', $name)            => 'magic',
            (bool) preg_match('/\b(melee|knight|warrior)\b/', $name)         => 'melee',
            default                                                          => null,
        };
    }

    /** Profit ÷ price over rows with both, e.g. 0.32 for 32%. */
    private static function margin(Collection $rows): ?float
    {
        $priced = $rows->filter(fn ($r) => ($r['price_php'] ?? 0) > 0 && ($r['cost_php'] ?? null) !== null);
        $price  = (float) $priced->sum('price_php');

        return $price > 0 ? ($price - (float) $priced->sum('cost_php')) / $price : null;
    }

    private static function median(array $values): ?float
    {
        if (! $values) {
            return null;
        }
        sort($values);
        $n = count($values);

        return $n % 2 ? (float) $values[intdiv($n, 2)] : ((float) $values[$n / 2 - 1] + (float) $values[$n / 2]) / 2;
    }
}
