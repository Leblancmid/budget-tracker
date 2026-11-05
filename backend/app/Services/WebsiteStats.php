<?php

namespace App\Services;

use App\Models\RucoyAccount;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Talks to the Leblanc website's private API (functions/api on Cloudflare Pages):
 * visitor stats, and "Notify me" matches after a publish. Needs LISTING_SITE_TOKEN.
 */
class WebsiteStats
{
    /** Cache the stats this long, so several pages / refreshes don't each call the website. */
    private const CACHE_SECONDS = 30;

    public static function configured(): bool
    {
        return strlen((string) config('listing.site_token')) >= 32;
    }

    /**
     * Visitor stats, with each listing's views labelled with its account.
     *
     * @return array<string, mixed>
     */
    public static function fetch(bool $fresh = false): array
    {
        if (! self::configured()) {
            throw new RuntimeException('Website stats are off: set LISTING_SITE_TOKEN in the backend .env (the same value as STATS_TOKEN in Cloudflare).');
        }
        if ($fresh) {
            Cache::forget('website_stats');
        }

        $stats = Cache::remember('website_stats', self::CACHE_SECONDS, function () {
            try {
                $res = Http::withToken((string) config('listing.site_token'))->acceptJson()->timeout(8)
                    ->get(config('listing.site_url') . '/api/stats');
            } catch (ConnectionException) {
                throw new RuntimeException("Couldn't reach the website.");
            }
            if (! $res->successful()) {
                throw new RuntimeException($res->status() === 401
                    ? "The website didn't accept the token: LISTING_SITE_TOKEN must match STATS_TOKEN in Cloudflare."
                    : 'The website answered: ' . ($res->json('message') ?? 'error ' . $res->status()));
            }

            return $res->json();
        });

        return [...$stats, 'listing_views' => self::labelViews($stats['listing_views'] ?? [])];
    }

    /** Views per account, "acc-46" → the account's name and whether it's still for sale. */
    private static function labelViews(array $views): array
    {
        $ids = collect($views)->map(fn ($v) => preg_match('/^acc-(\d+)$/', (string) ($v['listing_id'] ?? ''), $m) ? (int) $m[1] : null)->filter();
        $accounts = RucoyAccount::whereIn('id', $ids)->get()->keyBy('id');

        return collect($views)->map(function ($v) use ($accounts) {
            $id = preg_match('/^acc-(\d+)$/', (string) ($v['listing_id'] ?? ''), $m) ? (int) $m[1] : null;
            $a  = $id ? $accounts->get($id) : null;

            return [
                'listing_id' => $v['listing_id'],
                'account_id' => $a?->id,
                'name'       => $a ? ($a->description ?: $a->email) : $v['listing_id'],
                'sold'       => $a ? $a->archived_at !== null : null,
                'total'      => (int) ($v['total'] ?? 0),
                'last7'      => (int) ($v['last7'] ?? 0),
            ];
        })->sortByDesc('total')->values()->all();
    }

    /** Views of one listed account in total, or null when stats aren't available. */
    public static function viewsOf(int $accountId): ?int
    {
        try {
            $row = collect(self::fetch()['listing_views'])->firstWhere('account_id', $accountId);
        } catch (RuntimeException) {
            return null;
        }

        return $row ? $row['total'] : 0;
    }

    /**
     * After a publish: tell the website what's listed, so it can post "Notify me" matches to
     * Discord. Returns how many requests matched, or null if it couldn't be done.
     *
     * @param  list<array<string, mixed>>  $listings
     */
    public static function dispatchAlerts(array $listings): ?int
    {
        if (! self::configured()) {
            return null;
        }
        try {
            $res = Http::withToken((string) config('listing.site_token'))->acceptJson()->timeout(15)
                ->post(config('listing.site_url') . '/api/alerts/dispatch', [
                    'listings' => array_map(fn ($l) => array_intersect_key($l, array_flip(['id', 'category', 'level', 'price'])), $listings),
                ]);
        } catch (ConnectionException) {
            return null;
        }

        return $res->successful() ? (int) $res->json('matched', 0) : null;
    }
}
