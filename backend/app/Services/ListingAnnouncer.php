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

    public static function configured(): bool
    {
        return str_starts_with((string) config('listing.discord_webhook'), 'https://');
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

    /** Post the image (PNG or JPEG bytes) with the caption. False if it didn't go through. */
    public static function postImage(string $contents, string $filename, string $caption): bool
    {
        if (! self::configured()) {
            return false;
        }
        try {
            $res = Http::timeout(30)
                ->attach('files[0]', $contents, $filename)
                ->post((string) config('listing.discord_webhook'), [
                    'payload_json' => json_encode(['content' => mb_substr($caption, 0, self::CAPTION_MAX)]),
                ]);
            if ($res->successful()) {
                return true;
            }
            Log::warning('Discord listings post failed: HTTP ' . $res->status() . ' ' . mb_substr($res->body(), 0, 300));
        } catch (Throwable $e) {
            Log::warning('Discord listings post failed: ' . $e->getMessage());
        }

        return false;
    }
}
