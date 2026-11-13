<?php

namespace App\Console\Commands;

use App\Notifications\AppAlert;
use App\Services\Alerts;
use App\Services\Backup\RestoreCheck;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Monthly: restores the newest off-site backup into a scratch database and checks it. If something
 * is wrong, admins get an alert (bell + phone) and the weekly brief says so.
 */
class BackupVerify extends Command
{
    protected $signature = 'backup:verify';

    protected $description = 'Restore the newest off-site backup into a scratch database and check it';

    public function handle(): int
    {
        if (! config('backup.r2.account_id')) {
            $this->info('Off-site backup is not set up; nothing to check.');

            return self::SUCCESS;
        }

        $this->line('Restoring the newest backup into a scratch database…');
        $r = RestoreCheck::run();

        foreach ($r['tables'] as $name => $t) {
            $this->line(sprintf('  %-22s now %7d   backup %s', $name, $t['live'], $t['backup'] === null ? 'missing' : sprintf('%7d', $t['backup'])));
        }

        if ($r['ok']) {
            $this->info('Backup restores fine: ' . $r['file']);

            return self::SUCCESS;
        }

        foreach ($r['problems'] as $p) {
            $this->error($p);
        }
        Log::error('Backup restore check failed: ' . implode(' ', $r['problems']));
        Alerts::toAdmins(new AppAlert(
            'backup', 'Backup check failed', $r['problems'][0] ?? 'The newest backup could not be restored.',
            '/business', key: 'backup-' . now()->format('Y-m-d'),
        ));

        return self::FAILURE;
    }
}
