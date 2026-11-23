<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use RuntimeException;

/**
 * Buyer reviews on the website: a review link per sale, and the reviews to approve.
 *
 * The link (/review?t=…) is signed with the token the app and the website share
 * (LISTING_SITE_TOKEN = STATS_TOKEN), so the website knows it's a real sale and takes one review per
 * sale. The website keeps the reviews; they show there once approved here.
 */
class Reviews
{
    /** How long a review link works */
    public const LINK_DAYS = 60;

    public const STATUSES = ['pending', 'approved', 'hidden'];

    /** The review link for a sold account or gold trade. */
    public static function link(BusinessTransaction $sale): string
    {
        $token = (string) config('listing.site_token');
        if (strlen($token) < 32) {
            throw new RuntimeException('Reviews need the website connection: set LISTING_SITE_TOKEN in the backend .env.');
        }
        if ($sale->archived_at === null || ! in_array($sale->type, ['account', 'gold'], true) || $sale->system_key !== null) {
            throw new RuntimeException('Review links are for sold accounts and gold trades.');
        }

        $payload = self::b64url(json_encode([
            's' => $sale->id,
            'l' => self::label($sale),
            'e' => now()->addDays(self::LINK_DAYS)->getTimestampMs(),
        ]));
        $sig = self::b64url(hash_hmac('sha256', $payload, $token, true));

        return rtrim((string) config('listing.site_url'), '/') . '/review?t=' . $payload . '.' . $sig;
    }

    /** What the buyer got, as the site shows it: "Lv 650 Melee", "500KK gold" (never your notes) */
    public static function label(BusinessTransaction $sale): string
    {
        if ($sale->type === 'gold') {
            return $sale->price_gold > 0 ? ListingPublisher::goldShort((float) $sale->price_gold) . ' gold' : 'Gold';
        }
        $a = ($sale->account_id ? RucoyAccount::find($sale->account_id) : null) ?? new RucoyAccount(['description' => $sale->description]);
        $level = PriceGuide::levelOf($a);
        $class = PriceGuide::classOf($a);

        return $level && $class ? "Lv {$level} " . ['melee' => 'Melee', 'distance' => 'Distance', 'magic' => 'Magic'][$class] : 'A Rucoy account';
    }

    /** Sales shown to ask for a review: the last RECENT_DAYS */
    public const RECENT_DAYS = 30;

    /**
     * Accounts and gold sold lately, newest first, to send a review link to; and whether that buyer
     * has already reviewed it.
     *
     * @param  list<array<string, mixed>>  $reviews  from all()
     * @return list<array{id: int, item: string, sold_to: ?string, sold_on: ?string, reviewed: bool}>
     */
    public static function recentSales(array $reviews): array
    {
        $reviewed = collect($reviews)->pluck('sale_id')->map(fn ($id) => (int) $id)->flip();

        return BusinessTransaction::archived()->whereIn('type', ['account', 'gold'])->whereNull('system_key')
            ->where('archived_at', '>=', now()->subDays(self::RECENT_DAYS))
            ->latest('archived_at')->limit(50)->get()
            ->map(fn (BusinessTransaction $t) => [
                'id'       => $t->id,
                'item'     => self::label($t),
                'sold_to'  => $t->sold_to ?: null,
                'sold_on'  => $t->archived_at?->setTimezone(BalanceInterest::ZONE)->toDateString(),
                'reviewed' => $reviewed->has($t->id),
            ])->values()->all();
    }

    /** Every review on the website (to approve or hide), newest first. */
    public static function all(): array
    {
        // As a query parameter: a ?all=1 written into the path is dropped when the request is sent
        return WebsiteStats::callApi('get', '/api/reviews', ['all' => 1])['reviews'] ?? [];
    }

    public static function setStatus(int $id, string $status): void
    {
        WebsiteStats::callApi('patch', '/api/reviews/' . $id, ['status' => $status]);
    }

    private static function b64url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }
}
