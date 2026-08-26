<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ExportDatabase extends Command
{
    protected $signature   = 'db:export {--keep=30 : Number of recent backups to keep}';
    protected $description = 'Export the MySQL database to a timestamped SQL file in storage/app/backups';

    public function handle(): int
    {
        $host     = config('database.connections.mysql.host');
        $port     = config('database.connections.mysql.port');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $backupDir = storage_path('app/backups');
        File::ensureDirectoryExists($backupDir);

        $filename = $database . '_' . now()->format('Y-m-d_H-i-s') . '.sql';
        $filepath = $backupDir . DIRECTORY_SEPARATOR . $filename;

        $mysqldump = env('MYSQLDUMP_PATH', 'mysqldump');

        $passwordFlag = $password ? "-p\"{$password}\"" : '';
        $command = "\"{$mysqldump}\" -h {$host} -P {$port} -u {$username} {$passwordFlag} --single-transaction --routines {$database}";

        $output = [];
        $exitCode = 0;

        // Redirect stderr to stdout so we can capture errors
        exec("{$command} > \"{$filepath}\" 2>&1", $output, $exitCode);

        if ($exitCode !== 0) {
            $this->error("Export failed (exit {$exitCode}). Check {$filepath} for mysqldump error output.");
            // Remove the bad file
            @unlink($filepath);
            return self::FAILURE;
        }

        $sizeKb = round(filesize($filepath) / 1024, 1);
        $this->info("Exported: {$filename} ({$sizeKb} KB)");

        // Prune old backups, keeping the most recent N
        $keep = (int) $this->option('keep');
        $files = collect(File::files($backupDir))
            ->filter(fn ($f) => str_ends_with($f->getFilename(), '.sql'))
            ->sortByDesc(fn ($f) => $f->getMTime())
            ->values();

        $files->slice($keep)->each(function ($f) {
            File::delete($f->getPathname());
            $this->line("Pruned: {$f->getFilename()}");
        });

        return self::SUCCESS;
    }
}
