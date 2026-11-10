<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-export database daily at 2:00 AM
Schedule::command('db:export --keep=2')->twiceDaily(2, 14);

// Copy the newest export to Cloudflare R2, encrypted (off-site: survives losing this PC). 03:00 UTC = 11:00 Manila,
// an hour after the 02:00 export.
Schedule::command('backup:offsite')->dailyAt('03:00')->withoutOverlapping();

// Daily interest on Balance accounts with a rate. Hourly is safe (each day is credited once)
// and catches up quickly after the PC was off.
Schedule::command('balance:interest')->hourly()->withoutOverlapping();

// Recurring daily transactions (bills, allowances): posted on their dates, missed ones caught up
Schedule::command('recurring:post')->hourly()->withoutOverlapping();

// Remove login tokens that expired more than a day ago
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// Undo history older than 90 days, and account images nothing uses any more
Schedule::command('operations:prune')->dailyAt('04:00')->withoutOverlapping();
