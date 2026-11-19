<?php

namespace App\Console\Commands;

use App\Services\ListingAnnouncer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Check the Discord listings channel (LISTING_DISCORD_WEBHOOK) with a test message:
 *   php artisan listings:discord
 * The Listing Kit image itself is drawn in the app: post it with "Post to Discord" there.
 */
class DiscordListings extends Command
{
    protected $signature = 'listings:discord';

    protected $description = 'Send a test message to the Discord listings channel';

    public function handle(): int
    {
        if (! ListingAnnouncer::configured()) {
            $this->error('LISTING_DISCORD_WEBHOOK is empty (or not a https:// link) in the settings this app is using.');
            $this->line('Add it to backend/.env, then run the after-deploy script (the settings are cached until you do).');

            return self::FAILURE;
        }

        try {
            $res = Http::timeout(15)->post((string) config('listing.discord_webhook'), [
                'content' => '✅ Leblanc listings are connected: the Listing Kit image is posted here when what\'s for sale changes.',
            ]);
        } catch (Throwable $e) {
            $this->error("Couldn't reach Discord: " . $e->getMessage());

            return self::FAILURE;
        }
        if (! $res->successful()) {
            $this->error('Discord refused it (HTTP ' . $res->status() . '). Check the webhook link: copy it again from the channel\'s Integrations > Webhooks.');

            return self::FAILURE;
        }
        $this->info('Test message sent: check the channel. To post the Listing Kit image, use "Post to Discord" in the Listing Kit.');

        return self::SUCCESS;
    }
}
