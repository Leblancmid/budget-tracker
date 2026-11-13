<?php

namespace App\Services\Backup;

use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Throwable;

/**
 * Proves the off-site backups can be restored: downloads the newest one from R2, decrypts it,
 * loads it into a scratch database, compares it with the live one, and drops the scratch database.
 * Never touches the live database. The result is kept (Cache) for the weekly brief.
 */
class RestoreCheck
{
    public const LAST_RESULT = 'backup_verify_last';

    /** The records that matter: each must be in the backup, with about as many rows as now */
    public const KEY_TABLES = [
        'users', 'categories', 'transactions', 'budgets', 'business_transactions', 'rucoy_accounts',
        'golds', 'gold_logs', 'trades', 'balance_accounts', 'balance_entries', 'activity_logs',
    ];

    /** A backup older than this (days) is itself a problem: the daily upload has stopped */
    public const MAX_AGE_DAYS = 3;

    /** Overridable in tests: (sql, database) => void, loads the SQL into that database */
    public static ?Closure $loader = null;

    /**
     * @return array{ok: bool, checked_at: string, file: ?string, problems: list<string>, tables: array<string, array{live: int, backup: ?int}>}
     */
    public static function run(): array
    {
        $result = ['ok' => false, 'checked_at' => now()->toIso8601String(), 'file' => null, 'problems' => [], 'tables' => []];
        $scratch = (string) config('backup.verify_database');

        try {
            if ($scratch === '' || $scratch === config('database.connections.mysql.database')) {
                throw new RuntimeException('The restore check needs its own scratch database (BACKUP_VERIFY_DATABASE), never the live one.');
            }
            $password = (string) config('backup.password');
            BackupCrypto::checkPassword($password);
            $r2 = R2Client::fromConfig();

            $objects = $r2->list((string) config('backup.prefix'));
            if (! $objects) {
                throw new RuntimeException('There are no backups in R2 yet.');
            }
            $newest = end($objects)['key'];
            $result['file'] = $newest;

            $sql = BackupCrypto::decrypt($r2->get($newest), $password);
            self::load($sql, $scratch);

            $result['tables'] = self::counts($scratch);
            $result['problems'] = [...self::ageProblem($newest), ...self::compare($result['tables'])];
            $result['ok'] = $result['problems'] === [];
        } catch (Throwable $e) {
            $result['problems'][] = $e->getMessage();
        } finally {
            self::dropScratch($scratch);
        }

        Cache::forever(self::LAST_RESULT, $result);

        return $result;
    }

    /**
     * What looks wrong, comparing live row counts with the backup's. A backup is up to a day old, so
     * small differences are normal; a missing table or a big drop is not.
     *
     * @param  array<string, array{live: int, backup: ?int}>  $tables
     * @return list<string>
     */
    public static function compare(array $tables): array
    {
        $problems = [];
        foreach ($tables as $name => ['live' => $live, 'backup' => $backup]) {
            if ($backup === null) {
                $problems[] = "The backup has no {$name} table.";
            } elseif ($live >= 20 && $backup < $live * 0.5) {
                $problems[] = "The backup has only {$backup} {$name} rows (now: {$live}).";
            } elseif ($live > 0 && $backup === 0) {
                $problems[] = "The backup's {$name} table is empty (now: {$live} rows).";
            }
        }

        return $problems;
    }

    /** @return list<string> */
    public static function ageProblem(string $key, ?CarbonImmutable $now = null): array
    {
        // budget/budget_tracker_2026-11-09_02-00-00.sql.gz.enc
        if (! preg_match('/(\d{4}-\d{2}-\d{2})_\d{2}-\d{2}-\d{2}/', $key, $m)) {
            return [];
        }
        $days = (int) CarbonImmutable::parse($m[1])->diffInDays($now ?? CarbonImmutable::now(), true);

        return $days > self::MAX_AGE_DAYS ? ["The newest backup is {$days} days old: the daily upload has stopped."] : [];
    }

    /** @return array<string, array{live: int, backup: ?int}> */
    private static function counts(string $scratch): array
    {
        config(['database.connections.restore_check' => [...config('database.connections.mysql'), 'database' => $scratch]]);
        DB::purge('restore_check');

        $out = [];
        foreach (self::KEY_TABLES as $table) {
            $out[$table] = [
                'live'   => Schema::hasTable($table) ? DB::table($table)->count() : 0,
                'backup' => Schema::connection('restore_check')->hasTable($table) ? DB::connection('restore_check')->table($table)->count() : null,
            ];
        }
        DB::purge('restore_check');

        return $out;
    }

    /** Load the SQL into a fresh scratch database with the mysql client. */
    private static function load(string $sql, string $scratch): void
    {
        self::admin()->statement('DROP DATABASE IF EXISTS `' . str_replace('`', '', $scratch) . '`');
        self::admin()->statement('CREATE DATABASE `' . str_replace('`', '', $scratch) . '`');

        if (self::$loader) {
            (self::$loader)($sql, $scratch);

            return;
        }

        $file = tempnam(sys_get_temp_dir(), 'restore');
        File::put($file, $sql);
        try {
            $c = config('database.connections.mysql');
            $mysql = config('backup.mysql_path') ?: self::mysqlNextToDump();
            $pass = $c['password'] ? '-p"' . $c['password'] . '"' : '';
            exec("\"{$mysql}\" -h {$c['host']} -P {$c['port']} -u {$c['username']} {$pass} {$scratch} < \"{$file}\" 2>&1", $output, $code);
            if ($code !== 0) {
                // mysql's own message, without the command line (it holds the password)
                throw new RuntimeException('Loading the backup failed: ' . mb_strimwidth(implode(' ', $output), 0, 200, '…'));
            }
        } finally {
            @unlink($file);
        }
    }

    /**
     * Its own connection for creating and dropping the scratch database: in MySQL those statements
     * commit whatever the connection has open, so they stay off the app's main connection.
     */
    private static function admin(): Connection
    {
        config(['database.connections.restore_check_admin' => config('database.connections.mysql')]);

        return DB::connection('restore_check_admin');
    }

    private static function mysqlNextToDump(): string
    {
        $dump = (string) config('database.mysqldump_path');
        $dir = dirname($dump);

        return $dir === '.' ? 'mysql' : $dir . DIRECTORY_SEPARATOR . (PHP_OS_FAMILY === 'Windows' ? 'mysql.exe' : 'mysql');
    }

    private static function dropScratch(string $scratch): void
    {
        if ($scratch === '' || $scratch === config('database.connections.mysql.database')) {
            return;
        }
        try {
            self::admin()->statement('DROP DATABASE IF EXISTS `' . str_replace('`', '', $scratch) . '`');
        } catch (Throwable) {
            // Nothing to drop
        }
    }
}
