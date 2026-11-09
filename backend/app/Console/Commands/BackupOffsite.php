<?php

namespace App\Console\Commands;

use App\Services\Backup\BackupCrypto;
use App\Services\Backup\R2Client;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Copy the newest database export (storage/app/backups, made by db:export) to Cloudflare R2,
 * compressed and encrypted, and keep only the last BACKUP_KEEP copies there.
 */
class BackupOffsite extends Command
{
    public const LAST_SUCCESS = 'backup_offsite_last_success';

    protected $signature = 'backup:offsite';

    protected $description = 'Upload the newest database export to Cloudflare R2 (encrypted), keeping the last BACKUP_KEEP';

    public function handle(): int
    {
        // Not set up yet (see docs/BACKUP.md): skip quietly instead of logging an error every day
        if (! config('backup.r2.account_id')) {
            $this->info('Off-site backup is not set up (BACKUP_R2_ACCOUNT_ID is empty); skipped.');

            return self::SUCCESS;
        }

        try {
            $password = (string) config('backup.password');
            BackupCrypto::checkPassword($password);
            $r2 = R2Client::fromConfig();

            $latest = collect(File::files(storage_path('app/backups')))
                ->filter(fn ($f) => str_ends_with($f->getFilename(), '.sql') && $f->getSize() > 0)
                ->sortByDesc(fn ($f) => $f->getMTime())
                ->first();
            if (! $latest) {
                throw new RuntimeException('No database export found in storage/app/backups (run db:export first).');
            }

            $prefix = (string) config('backup.prefix');
            $key    = $prefix . $latest->getFilename() . '.gz.enc';
            $data   = BackupCrypto::encrypt(File::get($latest->getPathname()), $password);
            $r2->put($key, $data);
            $this->info('Uploaded ' . $key . ' (' . round(strlen($data) / 1024, 1) . ' KB, encrypted)');

            // Keep the newest N (names start with the date, so they sort oldest first)
            $objects = $r2->list($prefix);
            foreach (array_slice($objects, 0, max(0, count($objects) - (int) config('backup.keep', 30))) as $old) {
                $r2->delete($old['key']);
                $this->line('Removed old backup ' . $old['key']);
            }

            Cache::forever(self::LAST_SUCCESS, now()->toIso8601String());

            return self::SUCCESS;
        } catch (RuntimeException $e) {
            Log::error('Off-site backup failed: ' . $e->getMessage());
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }
}
