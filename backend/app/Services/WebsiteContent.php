<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Models\SiteSetting;
use Carbon\CarbonImmutable;

/**
 * What the website shows besides the listings, published with them:
 *   gold.json        your gold rates (set in Listing Kit)
 *   site-stats.json  trust numbers worked out from your own sales
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
        ];
    }
}
