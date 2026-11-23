<?php

use App\Services\BalanceInterest;
use App\Services\DiscordAutoPost;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-export database daily at 2:00 AM
Schedule::command('db:export --keep=2')->twiceDaily(2, 14);

// Copy the newest export off this PC, encrypted: to the Google Drive folder (BACKUP_FOLDER) and/or
// Cloudflare R2 (survives losing this PC). 03:00 UTC = 11:00 Manila, an hour after the 02:00 export.
Schedule::command('backup:offsite')->dailyAt('03:00')->withoutOverlapping();
// The uploaded files (account screenshots, profile pictures) to the Drive folder: weekly, Sunday
// 11:30 Manila (03:30 UTC). They aren't in the database backup.
Schedule::command('backup:files')->weeklyOn(0, '03:30')->withoutOverlapping();

// Daily interest on Balance accounts with a rate. Hourly is safe (each day is credited once)
// and catches up quickly after the PC was off.
Schedule::command('balance:interest')->hourly()->withoutOverlapping();

// Recurring daily transactions (bills, allowances): posted on their dates, missed ones caught up
Schedule::command('recurring:post')->hourly()->withoutOverlapping();

// Remove login tokens that expired more than a day ago
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// Undo history older than 90 days, and account images nothing uses any more
Schedule::command('operations:prune')->dailyAt('04:00')->withoutOverlapping();

// "Still alive" ping to the monitoring service (HEARTBEAT_URL): it messages you when the pings stop
Schedule::command('heartbeat:ping')->everyFiveMinutes()->withoutOverlapping();

// Alerts (bell + phone): new website leads, checked every minute
Schedule::command('leads:watch')->everyMinute()->withoutOverlapping();
// Morning alerts at 09:00 Manila (01:00 UTC): trades and payments due, Monday's weekly brief
Schedule::command('business:alerts')->dailyAt('01:00')->withoutOverlapping();
// Discord auto-post (when on in the Listing Kit): the saved listing image at 10:00 AM and 10:00 PM Manila
Schedule::command('listings:discord-auto')->twiceDaily(...DiscordAutoPost::HOURS)->timezone(BalanceInterest::ZONE)->withoutOverlapping();
// Monthly backup check: restore the newest off-site backup into a scratch database and compare it
// with the live one (1st of the month, 13:00 Manila = 05:00 UTC, after the 11:00 upload)
Schedule::command('backup:verify')->monthlyOn(1, '05:00')->withoutOverlapping();
