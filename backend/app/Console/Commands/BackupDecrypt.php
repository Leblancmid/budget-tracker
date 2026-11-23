<?php

namespace App\Console\Commands;

use App\Services\Backup\BackupCrypto;
use Illuminate\Console\Command;
use RuntimeException;

/**
 * Restore step 1: turn a backup from the Drive folder or R2 back into a plain file:
 * *.sql.gz.enc → .sql (import it with mysql), *.tar.gz.enc → .tar (the uploaded files: Windows
 * opens it, or tar -xf). See the restore notes in docs/BACKUP.md.
 */
class BackupDecrypt extends Command
{
    protected $signature = 'backup:decrypt {file : The .sql.gz.enc or .tar.gz.enc backup} {--out= : Where to write it (default: next to it)}';

    protected $description = 'Decrypt a backup back into a .sql (database) or .tar (uploaded files) file (asks for BACKUP_PASSWORD if it is not in .env)';

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
