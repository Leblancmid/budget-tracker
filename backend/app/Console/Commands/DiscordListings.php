<?php

namespace App\Console\Commands;

use App\Services\ListingAnnouncer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Check the Discord listings channels (LISTING_DISCORD_WEBHOOK, one link per server, separated
 * by commas) with a test message to each:
 *   php artisan listings:discord
 * The Listing Kit image itself is drawn in the app: post it with "Post image to Discord" there.
 */
class DiscordListings extends Command
{
    protected $signature = 'listings:discord';

    protected $description = 'Send a test message to each Discord listings channel';

    public function handle(): int
    {
        $hooks = ListingAnnouncer::webhooks();
        if ($hooks === []) {
            $this->error('LISTING_DISCORD_WEBHOOK has no https:// webhook link in the settings this app is using.');
            $this->line('Add it to backend/.env (several? separate them with commas), then run the after-deploy script (the settings are cached until you do).');

            return self::FAILURE;
        }

        $ok = 0;
        foreach ($hooks as $i => $url) {
            $which = 'Channel ' . ($i + 1) . ' of ' . count($hooks); // never print the link: it's a secret
            try {
                $res = Http::timeout(15)->post($url, [
                    'content' => '✅ Leblanc listings are connected: the Listing Kit image is posted here when what\'s for sale changes.',
                ]);
                if ($res->successful()) {
                    $ok++;
                    $this->info("{$which}: test message sent.");
                } else {
                    $this->error("{$which}: Discord refused it (HTTP {$res->status()}). Copy that link again from the channel's Integrations > Webhooks.");
                }
            } catch (Throwable $e) {
                $this->error("{$which}: couldn't reach Discord ({$e->getMessage()}).");
            }
        }
        $this->line("{$ok} of " . count($hooks) . ' worked. Check each channel. To post the Listing Kit image, use "Post image to Discord" in the Listing Kit.');

        return $ok === count($hooks) ? self::SUCCESS : self::FAILURE;
    }
}
