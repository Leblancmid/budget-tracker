<?php

namespace App\Console\Commands;

use App\Services\ListingAnnouncer;
use App\Services\ListingPublisher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Check the Discord listings channel (LISTING_DISCORD_WEBHOOK):
 *   php artisan listings:discord            send a test message
 *   php artisan listings:discord --latest=3 post the 3 most recently listed accounts again
 */
class DiscordListings extends Command
{
    protected $signature = 'listings:discord {--latest= : Post this many of the newest listings instead of a test message}';

    protected $description = 'Test the Discord listings channel, or post the newest listings to it';

    public function handle(): int
    {
        if (! ListingAnnouncer::configured()) {
            $this->error('LISTING_DISCORD_WEBHOOK is empty (or not a https:// link) in the settings this app is using.');
            $this->line('Add it to backend/.env, then run the after-deploy script (the settings are cached until you do).');

            return self::FAILURE;
        }

        $latest = (int) $this->option('latest');
        if ($latest > 0) {
            $listings = collect((new ListingPublisher)->build()['listings'])
                ->sortByDesc(fn ($l) => $l['listed_at'] ?? '')
                ->take(min($latest, ListingAnnouncer::MAX_POSTS))
                ->values();
            if ($listings->isEmpty()) {
                $this->warn('No accounts are ready to list (they need a screenshot, level and build).');

                return self::SUCCESS;
            }
            $posts = $listings->map(fn ($l) => ['kind' => 'new', 'listing' => array_diff_key($l, ['_screenshot' => true])])->all();
            $sent  = ListingAnnouncer::post($posts, $listings->pluck('_screenshot', 'id')->all());
            $this->info("Posted {$sent} of {$listings->count()}." . ($sent < $listings->count() ? ' See storage/logs/laravel.log for why the rest failed.' : ''));

            return $sent === $listings->count() ? self::SUCCESS : self::FAILURE;
        }

        try {
            $res = Http::timeout(15)->post((string) config('listing.discord_webhook'), [
                'content' => '✅ Leblanc listings are connected: new accounts and price drops will appear here after each publish.',
            ]);
        } catch (Throwable $e) {
            $this->error("Couldn't reach Discord: " . $e->getMessage());

            return self::FAILURE;
        }
        if (! $res->successful()) {
            $this->error('Discord refused it (HTTP ' . $res->status() . '). Check the webhook link: copy it again from the channel\'s Integrations > Webhooks.');

            return self::FAILURE;
        }
        $this->info('Test message sent: check the channel.');

        return self::SUCCESS;
    }
}
