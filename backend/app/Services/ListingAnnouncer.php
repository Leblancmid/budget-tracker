<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Posts the Listing Kit image (all accounts for sale in one picture, drawn in the app) to your
 * Discord listings channels (LISTING_DISCORD_WEBHOOK), with buttons that send buyers to the
 * website. Publish posts it when what's for sale changed; "Post image to Discord" any time.
 */
class ListingAnnouncer
{
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

    /** Link buttons under the image: to the accounts, gold, and selling to you */
    public static function buttons(): array
    {
        $site = rtrim((string) config('listing.site_url'), '/');

        return [['type' => 1, 'components' => [
            ['type' => 2, 'style' => 5, 'label' => 'Browse accounts', 'emoji' => ['name' => '🛒'], 'url' => "{$site}/for-sale"],
            ['type' => 2, 'style' => 5, 'label' => 'Buy gold', 'emoji' => ['name' => '💰'], 'url' => "{$site}/gold-calculator"],
            ['type' => 2, 'style' => 5, 'label' => 'Sell to Leblanc', 'emoji' => ['name' => '🤝'], 'url' => "{$site}/for-sale#sell"],
        ]]];
    }

    /**
     * Post the image (PNG or JPEG bytes) to every channel: just the image, full size, with the
     * link buttons under it. If a channel won't take buttons (Discord only allows them on some
     * webhooks), it gets the image with a one-line link instead, so buyers can still reach the site.
     *
     * @return array{sent: int, total: int} how many channels it reached, of how many
     */
    public static function postImage(string $contents, string $filename): array
    {
        $hooks = self::webhooks();
        $sent  = 0;
        $site  = rtrim((string) config('listing.site_url'), '/');
        $send  = fn (string $url, array $payload) => Http::timeout(30)
            ->attach('files[0]', $contents, $filename)
            ->post($url, ['payload_json' => json_encode($payload)]);

        foreach ($hooks as $i => $url) {
            // Logged as "channel 2", never the link itself (it's a secret)
            $which = 'channel ' . ($i + 1);
            try {
                $res = $send($url . (str_contains($url, '?') ? '&' : '?') . 'with_components=true', ['components' => self::buttons()]);
                if ($res->status() === 400) {
                    $res = $send($url, ['content' => "🛒 {$site}/for-sale"]);
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
