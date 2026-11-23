<?php

namespace App\Console\Commands;

use App\Services\Backup\BackupCrypto;
use App\Services\Backup\BackupFolder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use PharData;
use Throwable;

/**
 * Weekly: the uploaded files (account screenshots, profile pictures: storage/app/public), which
 * aren't in the database backup, packed into one .tar, encrypted with BACKUP_PASSWORD and saved to
 * the Drive folder (BACKUP_FOLDER/files). Keeps the last BACKUP_KEEP_FILES copies.
 *
 * To open one: php artisan backup:decrypt <file> gives a .tar that Windows opens (or tar -xf).
 */
class BackupFiles extends Command
{
    public const LAST_SUCCESS = 'backup_files_last_success';

    protected $signature = 'backup:files';

    protected $description = 'Copy the uploaded files (screenshots, profile pictures) to the Drive backup folder, encrypted';

    public function handle(): int
    {
        if (! BackupFolder::configured()) {
            $this->info('No backup folder (BACKUP_FOLDER is empty); skipped.');

            return self::SUCCESS;
        }

        $tar = tempnam(sys_get_temp_dir(), 'budget-files') . '.tar';
        try {
            $password = (string) config('backup.password');
            BackupCrypto::checkPassword($password);

            $source = (string) config('backup.files_path');
            $files  = File::isDirectory($source) ? File::allFiles($source) : [];
            $pack   = new PharData($tar);
            foreach ($files as $f) {
                $pack->addFile($f->getPathname(), str_replace('\\', '/', $f->getRelativePathname()));
            }
            unset($pack); // closes the .tar

            $name = 'budget_files_' . now()->format('Y-m-d_H-i-s') . '.tar.gz.enc';
            $data = BackupCrypto::encrypt(count($files) ? File::get($tar) : '', $password);
            $path = BackupFolder::put(BackupFolder::FILES, $name, $data, (int) config('backup.keep_files', 4));
            $this->info('Saved ' . $path . ' (' . count($files) . ' files, ' . round(strlen($data) / 1048576, 1) . ' MB, encrypted)');

            Cache::forever(self::LAST_SUCCESS, now()->toIso8601String());

            return self::SUCCESS;
        } catch (Throwable $e) {
            Log::error('Files backup failed: ' . $e->getMessage());
            $this->error($e->getMessage());

            return self::FAILURE;
        } finally {
            @unlink($tar);
            @unlink(substr($tar, 0, -4));
        }
    }
}
