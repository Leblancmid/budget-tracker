<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-export database daily at 2:00 AM
Schedule::command('db:export --keep=2')->twiceDaily(2, 14);

// Daily interest on Balance accounts with a rate. Hourly is safe (each day is credited once)
// and catches up quickly after the PC was off.
Schedule::command('balance:interest')->hourly()->withoutOverlapping();

// Remove login tokens that expired more than a day ago
Schedule::command('sanctum:prune-expired --hours=24')->daily();
