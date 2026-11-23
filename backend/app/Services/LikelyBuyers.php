<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use Illuminate\Support\Collection;
use RuntimeException;

/**
 * Who to message first about an account you're selling: people who bought a similar one before
 * (same build, level within LEVEL_RANGE), from "Sold to" on sold accounts and on gold trades made
 * from an account ("To Gold"). Regulars close faster than strangers from ads.
 */
class LikelyBuyers
{
    /** Levels apart that still count as similar */
    public const LEVEL_RANGE = 40;

    /** Buyers shown per account */
    public const LIMIT = 5;

    /**
     * For each account: the likely buyers, best first (most similar purchases, then the closest
     * level, then the most recent), with their contact from the website when they've sent a request.
     *
     * @param  Collection<int, RucoyAccount>  $accounts
     * @return array<int, list<array<string, mixed>>> by account id
     */
    public static function forAccounts(Collection $accounts): array
    {
        $sales    = self::pastSales();
        $contacts = $sales->isEmpty() ? [] : self::contacts();

        return $accounts->mapWithKeys(fn (RucoyAccount $a) => [
            $a->id => self::match(PriceGuide::levelOf($a), PriceGuide::classOf($a), $sales, $contacts),
        ])->all();
    }

    /** Past buyers of an account of this level and build (e.g. one you're thinking of buying). */
    public static function forLevel(int $level, string $class): array
    {
        $sales = self::pastSales();

        return self::match($level, $class, $sales, $sales->isEmpty() ? [] : self::contacts());
    }

    /** @param Collection<int, array<string, mixed>> $sales */
    private static function match(?int $level, ?string $class, Collection $sales, array $contacts): array
    {
        if (! $level || ! $class) {
            return [];
        }
        $similar = $sales->filter(fn ($s) => $s['class'] === $class && abs($s['level'] - $level) <= self::LEVEL_RANGE);

        return $similar->groupBy('buyer')->map(function (Collection $bought, string $buyer) use ($level, $contacts) {
            $closest = $bought->sortBy(fn ($s) => abs($s['level'] - $level))->first();
            $latest  = $bought->sortByDesc('sold_on')->first();

            return [
                'name'      => $latest['name'],
                'similar'   => $bought->count(),
                'closest'   => ['description' => $closest['description'], 'level' => $closest['level'], 'sold_on' => $closest['sold_on'], 'price_php' => $closest['price_php']],
                'last_on'   => $latest['sold_on'],
                'contact'   => $contacts[$buyer] ?? null,
                '_distance' => abs($closest['level'] - $level),
            ];
        })->sortBy([['similar', 'desc'], ['_distance', 'asc'], ['last_on', 'desc']])
            ->take(self::LIMIT)
            ->map(fn ($b) => array_diff_key($b, ['_distance' => true]))
            ->values()->all();
    }

    /**
     * Every sold account with a buyer, as level + build: marked sold, or sold for gold with "To Gold"
     * (the gold trade keeps the account's name, e.g. "Lv 688 Dist").
     *
     * @return Collection<int, array{buyer: string, name: string, level: int, class: string, description: string, sold_on: ?string, price_php: ?float}>
     */
    private static function pastSales(): Collection
    {
        $rows = BusinessTransaction::archived()
            ->whereNotNull('sold_to')->where('sold_to', '!=', '')
            ->where(fn ($q) => $q->where('type', 'account')
                ->orWhere(fn ($q) => $q->where('type', 'gold')->where('notes', 'like', WebsiteContent::CONVERTED_NOTE . '%')))
            ->get(['id', 'type', 'account_id', 'description', 'sold_to', 'price_php', 'archived_at']);
        $accounts = RucoyAccount::whereIn('id', $rows->pluck('account_id')->filter())->get()->keyBy('id');

        return $rows->map(function (BusinessTransaction $t) use ($accounts) {
            // The account itself when it's still on file (its stats), else what the trade's name says
            $a = $accounts->get($t->account_id) ?? new RucoyAccount(['description' => $t->description]);
            $level = PriceGuide::levelOf($a);
            $class = PriceGuide::classOf($a);

            return $level && $class ? [
                'buyer'       => Buyers::key($t->sold_to),
                'name'        => trim($t->sold_to),
                'level'       => $level,
                'class'       => $class,
                'description' => $t->description ?: ($a->description ?: "Lv {$level}"),
                'sold_on'     => $t->archived_at?->setTimezone(BalanceInterest::ZONE)->toDateString(),
                'price_php'   => $t->price_php !== null ? (float) $t->price_php : null,
            ] : null;
        })->filter()->values();
    }

    /**
     * How to reach a buyer, from the newest website request sent under the same name.
     *
     * @return array<string, array{method: string, contact: string}> by buyer key
     */
    private static function contacts(): array
    {
        if (! WebsiteStats::configured()) {
            return [];
        }
        try {
            $leads = WebsiteStats::rawLeads();
        } catch (RuntimeException) {
            return [];
        }

        return collect($leads)
            ->filter(fn ($l) => is_string($l['name'] ?? null) && is_string($l['contact'] ?? null) && $l['contact'] !== '')
            ->sortBy('created_at') // newest last, so it wins
            ->mapWithKeys(fn ($l) => [Buyers::key($l['name']) => ['method' => (string) ($l['method'] ?? ''), 'contact' => $l['contact']]])
            ->all();
    }
}
