<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * After a publish, posts what's new on the website to your Discord listings channel (a webhook
 * set in LISTING_DISCORD_WEBHOOK): accounts listed since the last publish, and price drops, each
 * with its screenshot and a link to it on the website. Never stops a publish: a failure is logged.
 */
class ListingAnnouncer
{
    /** At most this many posts per publish (the rest show on the website anyway) */
    public const MAX_POSTS = 5;

    public static function configured(): bool
    {
        return str_starts_with((string) config('listing.discord_webhook'), 'https://');
    }

    /**
     * What to announce: listings that weren't on the website before, and ones whose price dropped
     * today. Nothing on the very first publish (everything would look new).
     *
     * @param  list<array<string, mixed>>  $listings   what's being published (with price_dropped_at)
     * @param  list<array<string, mixed>>  $published  what the website had before
     * @return list<array{kind: 'new'|'drop', listing: array<string, mixed>}>
     */
    public static function plan(array $listings, array $published, string $today): array
    {
        if ($published === []) {
            return [];
        }
        $before = collect($published)->filter(fn ($l) => is_array($l) && isset($l['id']))->keyBy('id');

        $posts = [];
        foreach ($listings as $l) {
            $old = $before->get($l['id']);
            if (! $old) {
                $posts[] = ['kind' => 'new', 'listing' => $l];
            } elseif (($l['price_dropped_at'] ?? null) === $today && ($old['price'] ?? null) !== ($l['price'] ?? null)) {
                $posts[] = ['kind' => 'drop', 'listing' => $l];
            }
        }

        return array_slice($posts, 0, self::MAX_POSTS);
    }

    /**
     * Post them. $screenshots maps a listing id to its screenshot on the public disk.
     *
     * @param  array<string, string>  $screenshots
     * @return int how many were posted
     */
    public static function post(array $posts, array $screenshots): int
    {
        if (! self::configured()) {
            return 0;
        }
        $sent = 0;
        foreach ($posts as $p) {
            $l    = $p['listing'];
            $file = $screenshots[$l['id']] ?? null;
            $name = basename((string) ($l['image'] ?? $l['id'] . '.jpg'));
            $embed = self::embed($p['kind'], $l, $file ? $name : null);
            try {
                $request = Http::timeout(15)->asMultipart();
                if ($file && Storage::disk('public')->exists($file)) {
                    $request = $request->attach('files[0]', Storage::disk('public')->get($file), $name);
                }
                $res = $request->post((string) config('listing.discord_webhook'), ['payload_json' => json_encode(['embeds' => [$embed]])]);
                if ($res->successful()) {
                    $sent++;
                } else {
                    Log::warning('Discord listing post failed: HTTP ' . $res->status());
                }
            } catch (Throwable $e) {
                Log::warning('Discord listing post failed: ' . $e->getMessage());
            }
        }

        return $sent;
    }

    /** The Discord embed for one listing. */
    public static function embed(string $kind, array $l, ?string $imageName): array
    {
        $title = "Lv {$l['level']} {$l['category']}";
        $price = $l['price'] ?? null;
        $stats = isset($l['stats'])
            ? collect(['melee' => 'Melee', 'distance' => 'Distance', 'magic' => 'Magic', 'defense' => 'Defense'])
                ->map(fn ($label, $k) => "{$label} {$l['stats'][$k]}")->join(' · ')
            : null;

        return array_filter([
            'title'       => $kind === 'drop' ? "📉 Price dropped: {$title}" : "🆕 {$title} for sale",
            'url'         => config('listing.site_url') . '/for-sale?listing=' . rawurlencode($l['id']),
            'description' => $kind === 'drop'
                ? '~~' . ($l['price_was'] ?? '') . '~~ → **' . $price . '**'
                : ($price ? "Price: **{$price}**" : 'Price on request'),
            'color'  => $kind === 'drop' ? 0xF43F5E : 0xD4A54A,
            'fields' => $stats ? [['name' => 'Skills', 'value' => $stats]] : null,
            'image'  => $imageName ? ['url' => 'attachment://' . $imageName] : null,
            'footer' => ['text' => 'Leblanc · tap the title to see it on the website'],
        ], fn ($v) => $v !== null);
    }
}
