<?php

namespace App\Services;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
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

    /**
     * Link buttons under the image: the accounts on the website, and buying gold / selling to you
     * straight on your Discord profile (to message you there).
     */
    public static function buttons(): array
    {
        $site    = rtrim((string) config('listing.site_url'), '/');
        $profile = (string) config('listing.discord_profile');

        return [['type' => 1, 'components' => [
            ['type' => 2, 'style' => 5, 'label' => 'Browse accounts', 'emoji' => ['name' => '🛒'], 'url' => "{$site}/for-sale"],
            ['type' => 2, 'style' => 5, 'label' => 'Buy gold', 'emoji' => ['name' => '💰'], 'url' => $profile ?: "{$site}/gold-calculator"],
            ['type' => 2, 'style' => 5, 'label' => 'Sell to Leblanc', 'emoji' => ['name' => '🤝'], 'url' => $profile ?: "{$site}/for-sale#sell"],
        ]]];
    }

    /**
     * Post the image (PNG or JPEG bytes) to every channel: just the image, full size, with the
     * link buttons under it. If a channel won't take buttons (Discord only allows them on some
     * webhooks), it gets the image with a one-line link instead, so buyers can still reach the site.
     *
     * All channels are posted to at the same time, so ten servers take about as long as one.
     *
     * @return array{sent: int, total: int, failed: list<int>} how many channels it reached, of
     *                                                         how many, and the numbers of those it didn't
     */
    public static function postImage(string $contents, string $filename): array
    {
        $hooks   = self::webhooks();
        $site    = rtrim((string) config('listing.site_url'), '/');
        $buttons = ['components' => self::buttons()];
        $plain   = ['content' => "🛒 {$site}/for-sale"];
        $request = fn ($http, string $url, array $payload) => $http->timeout(30)
            ->attach('files[0]', $contents, $filename)
            ->post($url, ['payload_json' => json_encode($payload)]);
        $all = fn (array $urls, array $payload) => $urls === [] ? [] : Http::pool(fn (Pool $pool) => array_map(
            fn ($i) => $request($pool->as((string) $i), $urls[$i], $payload),
            array_keys($urls),
        ));

        $withButtons = array_map(fn ($url) => $url . (str_contains($url, '?') ? '&' : '?') . 'with_components=true', $hooks);
        $results     = $all($withButtons, $buttons);
        // Channels that won't take buttons get the image with a link instead
        $noButtons = array_filter($hooks, fn ($i) => self::status($results[(string) $i] ?? null) === 400, ARRAY_FILTER_USE_KEY);
        foreach ($all($noButtons, $plain) as $i => $res) {
            $results[$i] = $res;
        }

        $failed = [];
        foreach (array_keys($hooks) as $i) {
            $res = $results[(string) $i] ?? null;
            if ($res instanceof Response && $res->successful()) {
                continue;
            }
            $failed[] = $i + 1;
            // Logged as "channel 2", never the link itself (it's a secret)
            Log::warning('Discord listings post failed (channel ' . ($i + 1) . '): ' . ($res instanceof Response
                ? 'HTTP ' . $res->status() . ' ' . mb_substr($res->body(), 0, 300)
                : ($res instanceof Throwable ? $res->getMessage() : 'no answer')));
        }

        return ['sent' => count($hooks) - count($failed), 'total' => count($hooks), 'failed' => $failed];
    }

    /** A pooled answer's HTTP status, or null when the request itself failed */
    private static function status(mixed $res): ?int
    {
        return $res instanceof Response ? $res->status() : null;
    }
}
