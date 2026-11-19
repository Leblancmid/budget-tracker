<?php

namespace App\Services;

use App\Models\RucoyAccount;
use Carbon\CarbonImmutable;
use Throwable;

/**
 * How each account on the website is doing: days listed, views, requests, and a plain verdict.
 *
 *   interest  people asked about it
 *   early     listed for less time than you usually take to sell
 *   reach     listed a while, but few people have seen it (share it, feature it)
 *   price     seen plenty, nobody asked: the price is likely too high
 *   slow      listed a while (no website stats to say why)
 *
 * The verdicts reach / price / slow also drive the "slow to sell" morning alert.
 */
class ListingPerformance
{
    /** A listing is never called slow before this many days */
    public const MIN_DAYS = 14;

    /** Fewer total views than this counts as "few people have seen it" */
    public const FEW_VIEWS = 30;

    public const SLOW = ['price', 'reach', 'slow'];

    /** Days you usually take to sell an account (the average so far, at least MIN_DAYS). */
    public static function usualDays(): int
    {
        $days = PriceGuide::soldAccounts()->pluck('days_to_sell')->filter(fn ($d) => $d !== null);

        return max(self::MIN_DAYS, $days->count() ? (int) round($days->avg()) : self::MIN_DAYS);
    }

    /**
     * @return array{usual_days: int, has_stats: bool, listings: list<array<string, mixed>>}
     */
    public static function build(?CarbonImmutable $today = null): array
    {
        $today ??= CarbonImmutable::now(BalanceInterest::ZONE);
        $usual = self::usualDays();

        // From the website; either can be missing (not connected, or down)
        $views = null;
        $asked = null;
        if (WebsiteStats::configured()) {
            try {
                $views = collect(WebsiteStats::fetch()['listing_views'] ?? [])->keyBy('listing_id');
            } catch (Throwable) {
            }
            try {
                $asked = collect(WebsiteStats::rawLeads())->where('type', 'account')->countBy('listing_id');
            } catch (Throwable) {
            }
        }

        // What's on the website: unsold accounts with a screenshot (same rule as the publisher)
        $listings = RucoyAccount::active()->whereNotNull('screenshot')->get()->map(function (RucoyAccount $a) use ($today, $usual, $views, $asked) {
            $id       = 'acc-' . $a->id;
            $since    = $a->listed_at ?? $a->created_at;
            // Calendar days in Manila (listed yesterday = 1 day)
            $days     = $since ? max(0, (int) round(CarbonImmutable::parse($since)->setTimezone(BalanceInterest::ZONE)->startOfDay()->diffInDays($today->startOfDay()))) : 0;
            $seen     = $views ? (int) ($views[$id]['total'] ?? 0) : null;
            $seenWeek = $views ? (int) ($views[$id]['last7'] ?? 0) : null;
            $requests = $asked ? (int) ($asked[$id] ?? 0) : null;

            [$verdict, $advice] = match (true) {
                $requests > 0      => ['interest', $requests === 1 ? '1 person asked about it' : "{$requests} people asked about it"],
                $days < $usual     => ['early', "Listed {$days} day" . ($days === 1 ? '' : 's') . "; you usually sell in about {$usual}"],
                $seen === null     => ['slow', "Listed {$days} days, longer than your usual {$usual}"],
                $seen < self::FEW_VIEWS => ['reach', 'Few people have seen it: share it on Discord, or feature it'],
                default            => ['price', "Seen {$seen} times but nobody asked: the price may be too high"],
            };

            return [
                'account_id' => $a->id,
                'name'       => $a->description ?: $a->email,
                'price'      => ListingPublisher::price($a),
                'days'       => $days,
                'views'      => $seen,
                'views_week' => $seenWeek,
                'requests'   => $requests,
                'verdict'    => $verdict,
                'advice'     => $advice,
            ];
        });

        // Needs attention first (longest listed first), then the rest
        $order = ['price' => 0, 'reach' => 1, 'slow' => 2, 'early' => 3, 'interest' => 4];
        $sorted = $listings->sort(fn ($x, $y) => [$order[$x['verdict']], -$x['days']] <=> [$order[$y['verdict']], -$y['days']])->values()->all();

        return ['usual_days' => $usual, 'has_stats' => $views !== null, 'listings' => $sorted];
    }
}
