<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use Illuminate\Support\Collection;

/**
 * The people you sell to, from "Sold to" on sold accounts and gold trades: how often each one
 * buys, how much, and when last. Names are matched ignoring case, spaces and punctuation, so "Kai"
 * and "kai " are one buyer (shown with the spelling used most recently).
 */
class Buyers
{
    /** How many past purchases each buyer row lists */
    public const RECENT_ITEMS = 5;

    /** @return Collection<int, array<string, mixed>> newest buyer activity first */
    public static function all(): Collection
    {
        $sales = BusinessTransaction::archived()
            ->whereIn('type', ['account', 'gold'])
            ->whereNotNull('sold_to')->where('sold_to', '!=', '')
            ->orderByDesc('archived_at')
            ->get(['id', 'type', 'description', 'sold_to', 'price_php', 'profit_php', 'archived_at']);

        return $sales
            ->groupBy(fn (BusinessTransaction $t) => self::key($t->sold_to))
            ->map(function (Collection $rows) {
                $first = $rows->last();
                $last  = $rows->first();

                return [
                    'name'       => trim($last->sold_to),
                    'purchases'  => $rows->count(),
                    'accounts'   => $rows->where('type', 'account')->count(),
                    'golds'      => $rows->where('type', 'gold')->count(),
                    'total_php'  => round((float) $rows->sum('price_php'), 2),
                    'profit_php' => round((float) $rows->sum('profit_php'), 2),
                    'first_on'   => self::day($first->archived_at),
                    'last_on'    => self::day($last->archived_at),
                    'items'      => $rows->take(self::RECENT_ITEMS)->map(fn (BusinessTransaction $t) => [
                        'id'          => $t->id,
                        'type'        => $t->type,
                        'description' => $t->description,
                        'price_php'   => $t->price_php !== null ? (float) $t->price_php : null,
                        'sold_on'     => self::day($t->archived_at),
                    ])->values()->all(),
                ];
            })
            ->sortByDesc('last_on')
            ->values();
    }

    /**
     * Totals across all buyers: how many, how many came back, and how much of your sales they brought.
     *
     * @return array{buyers: int, repeat: int, repeat_share: ?float, repeat_sales_php: float, total_php: float}
     */
    public static function summary(Collection $buyers): array
    {
        $repeat = $buyers->where('purchases', '>=', 2);
        $total  = (float) $buyers->sum('total_php');
        $fromRepeat = (float) $repeat->sum('total_php');

        return [
            'buyers'           => $buyers->count(),
            'repeat'           => $repeat->count(),
            'repeat_share'     => $buyers->count() ? round($repeat->count() / $buyers->count(), 3) : null,
            'repeat_sales_php' => round($fromRepeat, 2),
            'total_php'        => round($total, 2),
        ];
    }

    /**
     * One buyer however the name was typed: "  Kai ", "KAI", "Dark Knight", "darkknight" and
     * "Dark.Knight" match (case, spaces and punctuation ignored; letters and digits count).
     */
    public static function key(string $name): string
    {
        return mb_strtolower(preg_replace('/[^\p{L}\p{N}]+/u', '', $name));
    }

    private static function day($at): ?string
    {
        return $at?->setTimezone(BalanceInterest::ZONE)->toDateString();
    }
}
