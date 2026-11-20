<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Posts the Listing Kit image (all accounts for sale in one picture, drawn in the app) to your
 * Discord listings channels (LISTING_DISCORD_WEBHOOK), inside a card that sends buyers to the
 * website. Publish posts it when what's for sale changed; "Post image to Discord" any time.
 */
class ListingAnnouncer
{
    /** Discord's limit for a message's text */
    public const CAPTION_MAX = 2000;

    /**
     * The channels to post to: LISTING_DISCORD_WEBHOOK holds one webhook link per server's
     * channel, separated by commas. Anything that isn't a https:// link is ignored.
     *
     * @return list<string>
     */
    public static function webhooks(): array
    {
        return collect(preg_split('/[\s,]+/', (string) config('listing.discord_webhook')) ?: [])
            ->filter(fn ($url) => str_starts_with($url, 'https://'))
            ->unique()
            ->values()
            ->all();
    }

    public static function configured(): bool
    {
        return self::webhooks() !== [];
    }

    /**
     * Did what's for sale change since the website was last published: an account added or
     * removed (sold), or a price changed? Other updates (stats, rates) don't count.
     */
    public static function listingsChanged(array $listings, array $published): bool
    {
        $key = fn (array $list) => collect($list)
            ->filter(fn ($l) => is_array($l) && isset($l['id']))
            ->mapWithKeys(fn ($l) => [$l['id'] => $l['price'] ?? null])
            ->sortKeys()
            ->all();

        return $key($listings) !== $key($published);
    }

    /** Gold, the card's side bar */
    public const COLOR = 0xD4A54A;

    /** Listed this recently counts as new (same as the website's "New" badge) */
    public const NEW_DAYS = 7;

    /**
     * The card around the Listing Kit image: who's selling, what's for sale at a glance (how many,
     * from what price, per build, what's new or cheaper), your promo lines, and a big link to the
     * website. The image shows full size underneath.
     *
     * @param  list<array<string, mixed>>  $listings  what's on the website (with price_dropped_at)
     * @param  string  $caption  the Listing Kit caption: its first line is the headline, its ✅ lines the promos
     */
    public static function embed(array $listings, string $caption, ?int $replyMinutes, string $imageName, ?string $today = null): array
    {
        $site  = rtrim((string) config('listing.site_url'), '/');
        $today ??= now(BalanceInterest::ZONE)->toDateString();
        $lines = preg_split('/\R/u', $caption) ?: [];
        $headline = trim((string) collect($lines)->first(fn ($l) => trim($l) !== '' && ! str_starts_with(trim($l), '•') && ! str_starts_with(trim($l), '✅'))) ?: 'Rucoy accounts for sale';
        $promos = collect($lines)->map('trim')->filter(fn ($l) => str_starts_with($l, '✅'))->values();

        $count = count($listings);
        // Cheapest gold price, for "from 650KK"
        $from = collect($listings)
            ->map(fn ($l) => isset($l['price']) ? [ListingPublisher::priceValue((string) $l['price']), $l['price']] : null)
            ->filter(fn ($p) => $p && $p[0] && $p[0][0] === 'G')
            ->sortBy(fn ($p) => $p[0][1])
            ->first()[1] ?? null;
        $builds = collect(['Melee' => '🗡️', 'Distance' => '🏹', 'Magic' => '🔮'])
            ->map(fn ($icon, $build) => [$icon, $build, collect($listings)->where('category', $build)->count()])
            ->filter(fn ($b) => $b[2] > 0)
            ->map(fn ($b) => "{$b[0]} {$b[1]} **{$b[2]}**")
            ->join(' · ');
        $days = fn (?string $date) => $date ? CarbonImmutable::parse($date)->diffInDays(CarbonImmutable::parse($today)) : null;
        $new  = collect($listings)->filter(fn ($l) => ($d = $days($l['listed_at'] ?? null)) !== null && $d < self::NEW_DAYS)->count();
        $drops = collect($listings)->filter(fn ($l) => ($d = $days($l['price_dropped_at'] ?? null)) !== null && $d < ListingPublisher::PRICE_DROP_DAYS)->count();

        $description = collect([
            "**{$count} account" . ($count === 1 ? '' : 's') . '** ready to trade' . ($from ? " · from **{$from}**" : ''),
            $builds ?: null,
            collect([$new ? "🆕 **{$new}** new this week" : null, $drops ? "📉 **{$drops}** price drop" . ($drops === 1 ? '' : 's') : null])->filter()->join(' · ') ?: null,
            $promos->isNotEmpty() ? '' : null,
            ...$promos->all(),
            '',
            "### [👉 See every account, stats & prices]({$site}/for-sale)",
        ])->filter(fn ($l) => $l !== null)->join("\n");

        $fields = [['name' => '🛒 How to buy', 'value' => 'Open a listing → **I want this**', 'inline' => true]];
        if ($reply = self::replyLabel($replyMinutes)) {
            $fields[] = ['name' => '⚡ Replies', 'value' => $reply, 'inline' => true];
        }
        $fields[] = ['name' => '🛡️ Safe trades', 'value' => 'Leblanc middles every deal', 'inline' => true];

        return [
            'author'      => ['name' => 'Leblanc · Rucoy middleman', 'url' => $site, 'icon_url' => "{$site}/leblancmid.png"],
            'title'       => mb_substr("🛒 {$headline}", 0, 250),
            'url'         => "{$site}/for-sale",
            'description' => mb_substr($description, 0, 4000),
            'color'       => self::COLOR,
            'fields'      => $fields,
            'image'       => ['url' => 'attachment://' . $imageName],
            'footer'      => ['text' => preg_replace('#^https?://#', '', $site) . ' · tap the title or a button below', 'icon_url' => "{$site}/leblancmid.png"],
            'timestamp'   => now()->toIso8601String(),
        ];
    }

    /** Link buttons under the post: to the accounts, gold, and selling to you */
    public static function buttons(): array
    {
        $site = rtrim((string) config('listing.site_url'), '/');

        return [['type' => 1, 'components' => [
            ['type' => 2, 'style' => 5, 'label' => 'Browse accounts', 'emoji' => ['name' => '🛒'], 'url' => "{$site}/for-sale"],
            ['type' => 2, 'style' => 5, 'label' => 'Buy gold', 'emoji' => ['name' => '💰'], 'url' => "{$site}/gold-calculator"],
            ['type' => 2, 'style' => 5, 'label' => 'Sell to Leblanc', 'emoji' => ['name' => '🤝'], 'url' => "{$site}/for-sale#sell"],
        ]]];
    }

    /** "within 2 hours" (same wording as the website), or null */
    private static function replyLabel(?int $minutes): ?string
    {
        return match (true) {
            $minutes === null || $minutes < 0 => null,
            $minutes <= 60                    => 'within an hour',
            $minutes < 24 * 60                => 'within ' . (int) ceil($minutes / 60) . ' hours',
            default                           => 'within ' . (int) ceil($minutes / 1440) . ' days',
        };
    }

    /**
     * Post the image (PNG or JPEG bytes) to every channel: inside the card ($embed) when given,
     * with link buttons; otherwise with the caption as plain text. If a channel won't take the
     * buttons (Discord only allows them on some webhooks), it's sent again without them.
     *
     * @return array{sent: int, total: int} how many channels it reached, of how many
     */
    public static function postImage(string $contents, string $filename, string $caption, ?array $embed = null): array
    {
        $hooks = self::webhooks();
        $sent  = 0;
        $send  = fn (string $url, array $payload) => Http::timeout(30)
            ->attach('files[0]', $contents, $filename)
            ->post($url, ['payload_json' => json_encode($payload)]);

        foreach ($hooks as $i => $url) {
            // Logged as "channel 2", never the link itself (it's a secret)
            $which = 'channel ' . ($i + 1);
            try {
                if ($embed) {
                    $res = $send($url . (str_contains($url, '?') ? '&' : '?') . 'with_components=true', ['embeds' => [$embed], 'components' => self::buttons()]);
                    if ($res->status() === 400) {
                        $res = $send($url, ['embeds' => [$embed]]); // no buttons there: the links are in the card anyway
                    }
                } else {
                    $res = $send($url, ['content' => mb_substr($caption, 0, self::CAPTION_MAX)]);
                }
                if ($res->successful()) {
                    $sent++;
                } else {
                    Log::warning("Discord listings post failed ({$which}): HTTP " . $res->status() . ' ' . mb_substr($res->body(), 0, 300));
                }
            } catch (Throwable $e) {
                Log::warning("Discord listings post failed ({$which}): " . $e->getMessage());
            }
        }

        return ['sent' => $sent, 'total' => count($hooks)];
    }
}
