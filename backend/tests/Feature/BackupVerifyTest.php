<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Backup\BackupCrypto;
use App\Services\Backup\RestoreCheck;
use App\Services\BusinessBrief;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * The monthly backup check: restores the newest backup from (a fake) R2 into a scratch database and
 * compares it with the live one. (The scratch database is made on its own connection, so this
 * test's rollback still works.)
 */
class BackupVerifyTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'a-long-test-passphrase';
    private const SCRATCH = 'budget_restore_check_test';

    private string $backupFile = 'budget/budget_tracker_2026-11-12_02-00-00.sql.gz.enc';
    private string $encrypted = '';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-13 12:00', 'Asia/Manila'));
        config([
            'backup.r2' => ['account_id' => 'acc', 'key' => 'k', 'secret' => 's', 'bucket' => 'budget-backups'],
            'backup.password' => self::PASSWORD,
            'backup.verify_database' => self::SCRATCH,
        ]);
        Http::fake(fn ($request) => str_contains($request->url(), 'list-type')
            ? Http::response("<ListBucketResult><Contents><Key>budget/budget_tracker_2026-11-01_02-00-00.sql.gz.enc</Key><Size>1</Size></Contents><Contents><Key>{$this->backupFile}</Key><Size>1</Size></Contents></ListBucketResult>")
            : Http::response($this->encrypted));
        // Loads the SQL straight into the scratch database (instead of the mysql client)
        RestoreCheck::$loader = function (string $sql, string $db) {
            config(['database.connections.loader' => [...config('database.connections.mysql'), 'database' => $db]]);
            DB::purge('loader');
            DB::connection('loader')->unprepared($sql);
            DB::purge('loader');
        };
        Cache::forget(RestoreCheck::LAST_RESULT);
        User::factory()->count(3)->create(['role' => 'admin']);
    }

    protected function tearDown(): void
    {
        RestoreCheck::$loader = null;
        parent::tearDown();
    }

    /** A "backup" with these tables and row counts (each table: just an id column) */
    private function backupWith(array $rows, string $password = self::PASSWORD): void
    {
        $sql = collect($rows)->map(fn ($n, $t) => "CREATE TABLE `{$t}` (id INT);" . ($n ? "INSERT INTO `{$t}` VALUES " . implode(',', array_fill(0, $n, '(1)')) . ';' : ''))->implode("\n");
        $this->encrypted = BackupCrypto::encrypt($sql, $password);
    }

    /** A backup with exactly the rows the live database has now (default wallets, categories…) */
    private function fullBackup(array $override = []): array
    {
        $live = collect(RestoreCheck::KEY_TABLES)->mapWithKeys(fn ($t) => [$t => DB::table($t)->count()])->all();

        return [...$live, ...$override];
    }

    private function scratchExists(): bool
    {
        return DB::selectOne('SELECT COUNT(*) AS n FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [self::SCRATCH])->n > 0;
    }

    public function test_a_good_backup_passes_and_the_scratch_database_is_dropped(): void
    {
        $this->backupWith($this->fullBackup());

        $this->artisan('backup:verify')->expectsOutputToContain('Backup restores fine')->assertSuccessful();

        $last = Cache::get(RestoreCheck::LAST_RESULT);
        $this->assertTrue($last['ok']);
        $this->assertSame($this->backupFile, $last['file'], 'the newest backup is the one checked');
        $this->assertSame(['live' => 3, 'backup' => 3], $last['tables']['users']);
        $this->assertFalse($this->scratchExists());
        $this->assertSame(0, User::first()->notifications()->count());
    }

    public function test_a_broken_backup_alerts_admins_and_shows_in_the_brief(): void
    {
        // No trades table, and an empty users table
        $missing = $this->fullBackup();
        unset($missing['trades']);
        $this->backupWith(array_merge($missing, ['users' => 0]));

        $this->artisan('backup:verify')->assertFailed();

        $last = Cache::get(RestoreCheck::LAST_RESULT);
        $this->assertFalse($last['ok']);
        $this->assertContains('The backup has no trades table.', $last['problems']);
        $this->assertContains("The backup's users table is empty (now: 3 rows).", $last['problems']);
        $this->assertSame('Backup check failed', User::first()->notifications()->first()->data['title']);
        $this->assertFalse($this->scratchExists());

        $titles = array_column(BusinessBrief::build(CarbonImmutable::parse('2026-11-13'))['insights'] ?? [], 'title');
        $this->assertContains('The last backup check failed', $titles);
    }

    public function test_a_wrong_password_or_an_old_backup_is_reported(): void
    {
        $this->backupWith($this->fullBackup(), 'another-long-password');
        $this->artisan('backup:verify')->assertFailed();
        $this->assertSame(['Wrong password, or the file is damaged.'], Cache::get(RestoreCheck::LAST_RESULT)['problems']);

        $this->backupFile = 'budget/budget_tracker_2026-11-01_02-00-00.sql.gz.enc';
        $this->backupWith($this->fullBackup());
        $this->artisan('backup:verify')->assertFailed();
        $this->assertSame(['The newest backup is 12 days old: the daily upload has stopped.'], Cache::get(RestoreCheck::LAST_RESULT)['problems']);
    }

    public function test_it_never_uses_the_live_database_as_the_scratch_one(): void
    {
        config(['backup.verify_database' => config('database.connections.mysql.database')]);
        $this->backupWith($this->fullBackup());

        $this->artisan('backup:verify')->assertFailed();

        $this->assertStringContainsString('never the live one', Cache::get(RestoreCheck::LAST_RESULT)['problems'][0]);
        $this->assertTrue(Schema::hasTable('users'), 'the live database is untouched');
        $this->assertSame(3, User::count());
    }

    public function test_the_comparison_rules(): void
    {
        $this->assertSame([], RestoreCheck::compare(['users' => ['live' => 3, 'backup' => 3], 'trades' => ['live' => 30, 'backup' => 28]]));
        $this->assertSame(['The backup has only 10 trades rows (now: 30).'], RestoreCheck::compare(['trades' => ['live' => 30, 'backup' => 10]]));
        $this->assertSame([], RestoreCheck::compare(['trades' => ['live' => 5, 'backup' => 2]]), 'small tables can move a lot in a day');
        $this->assertSame([], RestoreCheck::ageProblem('budget/budget_tracker_2026-11-12_02-00-00.sql.gz.enc', CarbonImmutable::parse('2026-11-13')));
    }

    public function test_without_r2_it_skips_quietly(): void
    {
        config(['backup.r2.account_id' => null]);
        $this->artisan('backup:verify')->expectsOutputToContain('not set up')->assertSuccessful();
    }
}
