<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Models\SiteSetting;
use Carbon\CarbonImmutable;
use Throwable;

/**
 * What the website shows besides the listings, published with them:
 *   gold.json        your gold rates (set in Listing Kit)
 *   site-stats.json  trust numbers worked out from your own sales, the accounts sold lately, and
 *                    how fast you usually answer website requests
 */
class WebsiteContent
{
    public const GOLD_KEY = 'gold';

    /** @return array{rates: list<array{method: string, currency: string, per_kk: float}>, min_order_kk: ?int, note: ?string} */
    public static function gold(): array
    {
        $saved = SiteSetting::read(self::GOLD_KEY, []);

        return [
            'rates'        => array_values(array_map(fn ($r) => [
                'method'   => (string) $r['method'],
                'currency' => (string) $r['currency'],
                'per_kk'   => (float) $r['per_kk'],
            ], $saved['rates'] ?? [])),
            'min_order_kk' => isset($saved['min_order_kk']) ? (int) $saved['min_order_kk'] : null,
            'note'         => $saved['note'] ?? null,
        ];
    }

    public static function saveGold(array $data): void
    {
        SiteSetting::write(self::GOLD_KEY, [
            'rates'        => array_values($data['rates'] ?? []),
            'min_order_kk' => $data['min_order_kk'] ?? null,
            'note'         => $data['note'] ?? null,
        ]);
    }

    /** Trust numbers from your own sales (counts only: no prices, profits or buyers). */
    public static function stats(): array
    {
        $accountsSold = RucoyAccount::archived()->count();
        $goldSold     = BusinessTransaction::archived()->where('type', 'gold')->whereNull('system_key')->count();
        $days         = PriceGuide::soldAccounts()->pluck('days_to_sell')->filter(fn ($d) => $d !== null);
        $first        = collect([
            RucoyAccount::archived()->min('archived_at'),
            BusinessTransaction::archived()->whereIn('type', ['account', 'gold'])->min('archived_at'),
        ])->filter()->min();

        return [
            'accounts_sold'    => $accountsSold,
            'gold_trades'      => $goldSold,
            'avg_days_to_sell' => $days->count() ? round($days->avg()) : null,
            // Month the records start (the app has been tracking since then)
            'tracking_since'   => $first ? CarbonImmutable::parse($first)->setTimezone(BalanceInterest::ZONE)->format('Y-m') : null,
            'recent_sold'      => self::recentSold(),
            'reply_minutes'    => self::replyMinutes(),
        ];
    }

    /** How many sold accounts the "Recently sold" strip shows, and how far back it looks */
    public const RECENT_SOLD = 8;

    public const RECENT_DAYS = 90;

    /**
     * Accounts sold lately: level, build and the day only. Never the price or who bought it.
     *
     * @return list<array{level: int, category: string, sold_on: string}>
     */
    public static function recentSold(): array
    {
        $names = ['melee' => 'Melee', 'distance' => 'Distance', 'magic' => 'Magic'];

        return RucoyAccount::archived()
            ->where('archived_at', '>=', now()->subDays(self::RECENT_DAYS))
            ->orderByDesc('archived_at')
            ->limit(self::RECENT_SOLD * 2) // some may lack a level or build
            ->get()
            ->map(function (RucoyAccount $a) use ($names) {
                $level = PriceGuide::levelOf($a);
                $class = PriceGuide::classOf($a);

                return $level && $class ? [
                    'level'    => $level,
                    'category' => $names[$class],
                    'sold_on'  => $a->archived_at->setTimezone(BalanceInterest::ZONE)->toDateString(),
                ] : null;
            })
            ->filter()
            ->take(self::RECENT_SOLD)
            ->values()
            ->all();
    }

    /** Fewer replies than this and the website shows no reply time (too little to go on) */
    public const MIN_REPLIES = 3;

    /**
     * Typical time (median, in minutes) from a website request arriving to you marking it
     * "Messaged", over the last 90 days. Null when the website isn't connected or there are too
     * few replies. The reply time comes from this app's activity log; the arrival from the website.
     */
    public static function replyMinutes(): ?int
    {
        $replied = [];
        ActivityLog::where('module', 'business')
            ->where('description', 'like', 'Lead #%: marked contacted')
            ->where('created_at', '>=', now()->subDays(self::RECENT_DAYS))
            ->orderBy('created_at')
            ->get(['description', 'created_at'])
            ->each(function (ActivityLog $log) use (&$replied) {
                if (preg_match('/^Lead #(\d+):/', $log->description, $m)) {
                    $replied[(int) $m[1]] ??= $log->created_at->getTimestampMs();
                }
            });
        if (count($replied) < self::MIN_REPLIES || ! WebsiteStats::configured()) {
            return null;
        }

        try {
            $arrived = collect(WebsiteStats::leads())->pluck('created_at', 'id');
        } catch (Throwable) {
            return null; // the website is down: publish without it
        }

        $minutes = collect($replied)
            ->map(fn ($at, $id) => isset($arrived[$id]) ? ($at - (int) $arrived[$id]) / 60000 : null)
            ->filter(fn ($m) => $m !== null && $m >= 0)
            ->sort()
            ->values();

        return $minutes->count() >= self::MIN_REPLIES ? (int) round($minutes->median()) : null;
    }
}
