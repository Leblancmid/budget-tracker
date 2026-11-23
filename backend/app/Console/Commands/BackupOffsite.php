<?php

namespace App\Console\Commands;

use App\Services\Backup\BackupCrypto;
use App\Services\Backup\BackupFolder;
use App\Services\Backup\R2Client;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Copy the newest database export (storage/app/backups, made by db:export) off this PC,
 * compressed and encrypted: to a Google Drive folder (BACKUP_FOLDER), to Cloudflare R2, or both.
 * Each keeps only the last BACKUP_KEEP copies.
 */
class BackupOffsite extends Command
{
    public const LAST_SUCCESS = 'backup_offsite_last_success';

    protected $signature = 'backup:offsite';

    protected $description = 'Copy the newest database export off this PC (Google Drive folder and/or R2, encrypted), keeping the last BACKUP_KEEP';

    /** Is any off-site place set up (a Drive folder or R2)? */
    public static function configured(): bool
    {
        return BackupFolder::configured() || (bool) config('backup.r2.account_id');
    }

    public function handle(): int
    {
        // Not set up yet (see docs/BACKUP.md): skip quietly instead of logging an error every day
        if (! self::configured()) {
            $this->info('Off-site backup is not set up (BACKUP_FOLDER and BACKUP_R2_ACCOUNT_ID are empty); skipped.');

            return self::SUCCESS;
        }

        try {
            $password = (string) config('backup.password');
            BackupCrypto::checkPassword($password);

            $latest = collect(File::files(storage_path('app/backups')))
                ->filter(fn ($f) => str_ends_with($f->getFilename(), '.sql') && $f->getSize() > 0)
                ->sortByDesc(fn ($f) => $f->getMTime())
                ->first();
            if (! $latest) {
                throw new RuntimeException('No database export found in storage/app/backups (run db:export first).');
            }
            $name = $latest->getFilename() . '.gz.enc';
            $data = BackupCrypto::encrypt(File::get($latest->getPathname()), $password);
            $size = round(strlen($data) / 1024, 1) . ' KB, encrypted';
            $keep = (int) config('backup.keep', 30);

            // Each place on its own: one failing doesn't stop the other
            $failed = [];
            if (BackupFolder::configured()) {
                try {
                    $path = BackupFolder::put(BackupFolder::DATABASE, $name, $data, $keep);
                    $this->info("Saved {$path} ({$size})");
                } catch (RuntimeException $e) {
                    $failed[] = 'Drive folder: ' . $e->getMessage();
                }
            }
            if (config('backup.r2.account_id')) {
                try {
                    $this->toR2($name, $data, $keep);
                    $this->info('Uploaded ' . config('backup.prefix') . $name . " to R2 ({$size})");
                } catch (RuntimeException $e) {
                    $failed[] = 'R2: ' . $e->getMessage();
                }
            }
            if ($failed !== []) {
                throw new RuntimeException(implode(' ', $failed));
            }

            Cache::forever(self::LAST_SUCCESS, now()->toIso8601String());

            return self::SUCCESS;
        } catch (RuntimeException $e) {
            Log::error('Off-site backup failed: ' . $e->getMessage());
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }

    private function toR2(string $name, string $data, int $keep): void
    {
        $r2     = R2Client::fromConfig();
        $prefix = (string) config('backup.prefix');
        $r2->put($prefix . $name, $data);

        // Keep the newest N (names start with the date, so they sort oldest first)
        $objects = $r2->list($prefix);
        foreach (array_slice($objects, 0, max(0, count($objects) - $keep)) as $old) {
            $r2->delete($old['key']);
            $this->line('Removed old backup ' . $old['key']);
        }
    }
}
