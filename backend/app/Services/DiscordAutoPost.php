<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\SiteSetting;
use App\Notifications\AppAlert;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Storage;

/**
 * Auto-post to Discord: the Listing Kit image goes to your listings channels every 12 hours
 * (10:00 AM and 10:00 PM Manila, see routes/console.php).
 *
 * The image is drawn in the app, so the server keeps the latest one: saved each time you post to
 * Discord, publish, or switch auto-post on. With it, what was for sale then (id â†’ price). If that
 * changed since (an account sold, added, or repriced), the old picture would be wrong, so it's
 * not posted and you get an alert to refresh it.
 */
class DiscordAutoPost
{
    public const KEY = 'discord_auto';

    /** The hours it posts at, Manila time */
    public const HOURS = [10, 22];

    private const DIR = 'discord';

    /** @return array{enabled: bool, image_at: ?string, posted_at: ?string, next_at: ?string, stale: bool} */
    public static function status(): array
    {
        $s       = self::settings();
        $enabled = (bool) ($s['enabled'] ?? false);

        return [
            'enabled'   => $enabled,
            // When the saved picture was made, and when it last went out (ISO, for the app to show)
            'image_at'  => self::image() ? ($s['image_at'] ?? null) : null,
            'posted_at' => $s['posted_at'] ?? null,
            'next_at'   => $enabled ? self::nextAt()->toIso8601String() : null,
            'stale'     => self::image() !== null && self::stale(),
        ];
    }

    /** Keep this image (and what's for sale now) for the next auto-posts. */
    public static function remember(array $kitImage): void
    {
        $disk = Storage::disk('local');
        foreach ($disk->files(self::DIR) as $old) {
            $disk->delete($old);
        }
        $disk->put(self::DIR . '/' . $kitImage['name'], $kitImage['contents']);

        self::save([
            'image'    => $kitImage['name'],
            'image_at' => now()->toIso8601String(),
            'listings' => self::forSale(),
        ]);
    }

    public static function setEnabled(bool $enabled): void
    {
        self::save(['enabled' => $enabled]);
    }

    /**
     * Post the saved image, if auto-post is on and the picture still matches what's for sale.
     *
     * @return string what happened (for the command's output)
     */
    public static function run(): string
    {
        $s = self::settings();
        if (! ($s['enabled'] ?? false)) {
            return 'Auto-post is off.';
        }
        if (! ListingAnnouncer::configured()) {
            return 'Discord isn\'t set up (LISTING_DISCORD_WEBHOOK).';
        }
        $image = self::image();
        if ($image === null) {
            return 'No saved image: post or publish once from the Listing Kit.';
        }
        $slot = now(BalanceInterest::ZONE)->format('Y-m-d-H');
        if (self::stale()) {
            Alerts::toEveryoneWith('storefront', new AppAlert(
                'listings', 'Discord auto-post skipped',
                'What\'s for sale changed since the saved picture. Open the Listing Kit and tap "Post image to Discord" (or publish) to refresh it.',
                '/business/listing', key: 'discord-auto-stale-' . $slot,
            ));

            return 'Skipped: what\'s for sale changed since the saved picture (alert sent).';
        }

        ['sent' => $sent, 'total' => $total] = ListingAnnouncer::postImage($image['contents'], $image['name']);
        if ($sent === 0) {
            Alerts::toEveryoneWith('storefront', new AppAlert(
                'listings', 'Discord auto-post failed',
                'Discord refused the listing image. Check the webhook links (php artisan listings:discord tests them).',
                '/business/listing', key: 'discord-auto-failed-' . $slot,
            ));

            return "Discord refused the post (0 of {$total} channels).";
        }
        self::save(['posted_at' => now()->toIso8601String()]);
        ActivityLog::note('business', 'published', "Auto-posted the listing image to Discord ({$sent} of {$total} channels)");

        return "Posted to {$sent} of {$total} channels.";
    }

    /** The next 10:00 or 22:00 in Manila */
    public static function nextAt(): CarbonImmutable
    {
        $now = CarbonImmutable::now(BalanceInterest::ZONE);
        foreach ([0, 1] as $day) {
            foreach (self::HOURS as $hour) {
                $at = $now->addDays($day)->setTime($hour, 0);
                if ($at->greaterThan($now)) {
                    return $at;
                }
            }
        }

        return $now->addDay()->setTime(self::HOURS[0], 0); // not reached
    }

    /** Did an account get sold, added or repriced since the picture was saved? */
    private static function stale(): bool
    {
        return ListingAnnouncer::listingsChanged(self::forSale(), self::settings()['listings'] ?? []);
    }

    /** What's for sale now, as the website lists it: id and price */
    private static function forSale(): array
    {
        return array_map(
            fn (array $l) => ['id' => $l['id'], 'price' => $l['price'] ?? null],
            (new ListingPublisher)->build()['listings'],
        );
    }

    /** @return array{contents: string, name: string}|null */
    private static function image(): ?array
    {
        $name = self::settings()['image'] ?? null;
        $path = self::DIR . '/' . $name;

        return $name && Storage::disk('local')->exists($path)
            ? ['contents' => Storage::disk('local')->get($path), 'name' => $name]
            : null;
    }

    private static function settings(): array
    {
        return (array) SiteSetting::read(self::KEY, []);
    }

    private static function save(array $changes): void
    {
        SiteSetting::write(self::KEY, [...self::settings(), ...$changes]);
    }
}
