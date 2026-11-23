<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Tells the monitoring service this PC and its scheduler are alive (HEARTBEAT_URL). Scheduled every
 * 5 minutes; when the pings stop, the service messages you. Sends nothing but the ping.
 */
class HeartbeatPing extends Command
{
    protected $signature = 'heartbeat:ping';

    protected $description = 'Tell the monitoring service this server is alive (HEARTBEAT_URL)';

    public function handle(): int
    {
        $url = trim((string) config('monitoring.heartbeat_url'));
        if (! str_starts_with($url, 'https://')) {
            $this->line('No HEARTBEAT_URL set; skipped.');

            return self::SUCCESS;
        }

        try {
            $res = Http::timeout(10)->retry(2, 2000, throw: false)->get($url);
            if ($res->successful()) {
                $this->info('Pinged the monitoring service.');

                return self::SUCCESS;
            }
            // The link itself is a secret: never logged
            Log::warning('Heartbeat ping refused: HTTP ' . $res->status());
            $this->error('The monitoring service refused the ping (HTTP ' . $res->status() . '): check HEARTBEAT_URL.');
        } catch (Throwable $e) {
            Log::warning('Heartbeat ping failed: ' . class_basename($e));
            $this->error("Couldn't reach the monitoring service.");
        }

        return self::FAILURE;
    }
}
