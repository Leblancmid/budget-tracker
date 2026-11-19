<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Posts the Listing Kit image (all accounts for sale in one picture, drawn in the app) with its
 * caption to your Discord listings channel, through the webhook in LISTING_DISCORD_WEBHOOK.
 * Publish posts it when what's for sale changed; "Post to Discord" posts it any time.
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

    /**
     * Post the image (PNG or JPEG bytes) with the caption to every channel.
     *
     * @return array{sent: int, total: int} how many channels it reached, of how many
     */
    public static function postImage(string $contents, string $filename, string $caption): array
    {
        $hooks = self::webhooks();
        $sent  = 0;
        foreach ($hooks as $i => $url) {
            // Logged as "channel 2", never the link itself (it's a secret)
            $which = 'channel ' . ($i + 1);
            try {
                $res = Http::timeout(30)
                    ->attach('files[0]', $contents, $filename)
                    ->post($url, ['payload_json' => json_encode(['content' => mb_substr($caption, 0, self::CAPTION_MAX)])]);
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
