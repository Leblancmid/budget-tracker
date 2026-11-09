<?php

namespace App\Console\Commands;

use App\Services\Backup\BackupCrypto;
use Illuminate\Console\Command;
use RuntimeException;

/**
 * Restore step 1: turn a backup downloaded from R2 (*.sql.gz.enc) back into a .sql file.
 * Then import it with mysql (see the restore notes in docs/BACKUP.md).
 */
class BackupDecrypt extends Command
{
    protected $signature = 'backup:decrypt {file : The .sql.gz.enc file downloaded from R2} {--out= : Where to write the .sql (default: next to it)}';

    protected $description = 'Decrypt an off-site backup back into a .sql file (asks for BACKUP_PASSWORD if it is not in .env)';

    public function handle(): int
    {
        $file = (string) $this->argument('file');
        if (! is_file($file)) {
            $this->error("File not found: {$file}");

            return self::FAILURE;
        }
        // On a new server .env may not have it yet: ask instead
        $password = (string) (config('backup.password') ?: $this->secret('BACKUP_PASSWORD'));
        $out      = (string) ($this->option('out') ?: preg_replace('/\.gz\.enc$/', '', $file));
        if ($out === $file) {
            $out .= '.sql';
        }

        try {
            file_put_contents($out, BackupCrypto::decrypt((string) file_get_contents($file), $password));
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }
        $this->info("Decrypted to {$out}");

        return self::SUCCESS;
    }
}
