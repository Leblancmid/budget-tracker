<?php

namespace App\Console\Commands;

use App\Services\DiscordAutoPost;
use Illuminate\Console\Command;

/**
 * Auto-post the saved Listing Kit image to the Discord listings channels (when switched on in the
 * Listing Kit). Scheduled at 10:00 AM and 10:00 PM Manila; run by hand to post now:
 *   php artisan listings:discord-auto
 */
class DiscordAutoPostCommand extends Command
{
    protected $signature = 'listings:discord-auto';

    protected $description = 'Post the saved Listing Kit image to Discord (auto-post)';

    public function handle(): int
    {
        $this->line(DiscordAutoPost::run());

        return self::SUCCESS;
    }
}
