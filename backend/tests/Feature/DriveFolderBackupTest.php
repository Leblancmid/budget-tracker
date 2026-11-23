<?php

namespace Tests\Feature;

use App\Console\Commands\BackupFiles;
use App\Console\Commands\BackupOffsite;
use App\Services\Backup\BackupCrypto;
use App\Services\BusinessBrief;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use PharData;
use Tests\TestCase;

/** Encrypted backups to a Google Drive folder (BACKUP_FOLDER): the database daily, uploaded files weekly. */
class DriveFolderBackupTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'correct horse battery staple';

    /** Stands in for the Google Drive folder */
    private string $drive;

    /** Stands in for storage/app/public (the uploaded files) */
    private string $uploads;

    /** The export db:export made */
    private string $export;

    protected function setUp(): void
    {
        parent::setUp();
        $this->drive   = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'budget-drive-' . uniqid();
        $this->uploads = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'budget-uploads-' . uniqid();
        File::ensureDirectoryExists($this->drive);
        File::ensureDirectoryExists($this->uploads . '/accounts');
        config([
            'backup.folder' => $this->drive, 'backup.files_path' => $this->uploads,
            'backup.r2.account_id' => null, 'backup.password' => self::PASSWORD, 'backup.keep' => 2, 'backup.keep_files' => 2,
        ]);
        Cache::flush();
        File::ensureDirectoryExists(storage_path('app/backups'));
        $this->export = storage_path('app/backups/budget_tracker_2099-01-03_02-00-00.sql');
        File::put($this->export, 'CREATE TABLE x (id int);');
        touch($this->export, time() + 60); // the newest
        Http::fake();
    }

    protected function tearDown(): void
    {
        File::delete($this->export);
        File::deleteDirectory($this->drive);
        File::deleteDirectory($this->uploads);
        parent::tearDown();
    }

    public function test_the_newest_export_goes_to_the_drive_folder_encrypted_keeping_the_last_few(): void
    {
        File::ensureDirectoryExists($this->drive . '/database');
        foreach (['2099-01-01', '2099-01-02'] as $day) {
            File::put($this->drive . "/database/budget_tracker_{$day}_02-00-00.sql.gz.enc", 'old');
        }

        $this->artisan('backup:offsite')->expectsOutputToContain('Saved')->assertSuccessful();

        $saved = array_map('basename', glob($this->drive . '/database/*'));
        sort($saved);
        // keep = 2: the oldest went, nothing half-written is left
        $this->assertSame(['budget_tracker_2099-01-02_02-00-00.sql.gz.enc', 'budget_tracker_2099-01-03_02-00-00.sql.gz.enc'], $saved);
        $blob = File::get($this->drive . '/database/budget_tracker_2099-01-03_02-00-00.sql.gz.enc');
        $this->assertStringNotContainsString('CREATE TABLE', $blob);
        $this->assertSame('CREATE TABLE x (id int);', BackupCrypto::decrypt($blob, self::PASSWORD));
        $this->assertNotNull(Cache::get(BackupOffsite::LAST_SUCCESS));
        Http::assertNothingSent(); // no R2
    }

    public function test_a_folder_that_cant_be_reached_fails_clearly_and_the_brief_says_so(): void
    {
        config(['backup.folder' => 'G:\\My Drive\\no-such-folder-' . uniqid()]);

        $this->artisan('backup:offsite')->expectsOutputToContain('Mirror files')->assertFailed();

        $insight = collect(BusinessBrief::build()['insights'])->firstWhere('key', 'backup');
        $this->assertSame(['Off-site backup has never run', 'bad'], [$insight['title'], $insight['level']]);
    }

    public function test_the_brief_counts_the_drive_folder_as_off_site(): void
    {
        config(['backup.folder' => null]);
        $this->assertSame('Off-site backup isn\'t set up', collect(BusinessBrief::build()['insights'])->firstWhere('key', 'backup')['title']);

        // Set up and working, but the screenshots haven't been copied yet
        config(['backup.folder' => $this->drive]);
        Cache::forever(BackupOffsite::LAST_SUCCESS, now()->toIso8601String());
        $this->assertSame('Your screenshots haven\'t been backed up yet', collect(BusinessBrief::build()['insights'])->firstWhere('key', 'backup')['title']);

        Cache::forever(BackupFiles::LAST_SUCCESS, now()->toIso8601String());
        $this->assertNull(collect(BusinessBrief::build()['insights'])->firstWhere('key', 'backup'), 'all good: nothing to say');
    }

    public function test_uploaded_files_are_packed_encrypted_and_come_back_with_backup_decrypt(): void
    {
        File::put($this->uploads . '/accounts/lv650.jpg', 'screenshot bytes');
        File::put($this->uploads . '/avatar.png', 'avatar bytes');

        $this->artisan('backup:files')->expectsOutputToContain('2 files')->assertSuccessful();
        $this->artisan('backup:files')->assertSuccessful();
        $this->travel(1)->seconds();
        $this->artisan('backup:files')->assertSuccessful();

        $saved = glob($this->drive . '/files/*.tar.gz.enc');
        $this->assertCount(2, $saved, 'keep_files = 2');
        $this->assertNotNull(Cache::get(BackupFiles::LAST_SUCCESS));

        // Restore: decrypt to a .tar, which holds the files as they were
        $enc = end($saved);
        $this->artisan('backup:decrypt', ['file' => $enc])->assertSuccessful();
        $tar = substr($enc, 0, -strlen('.gz.enc'));
        $this->assertStringEndsWith('.tar', $tar);
        $out = $this->uploads . '-restored';
        (new PharData($tar))->extractTo($out);
        $this->assertSame('screenshot bytes', File::get($out . '/accounts/lv650.jpg'));
        $this->assertSame('avatar bytes', File::get($out . '/avatar.png'));
        File::deleteDirectory($out);
    }

    public function test_without_a_folder_the_files_backup_is_skipped(): void
    {
        config(['backup.folder' => null]);
        $this->artisan('backup:files')->expectsOutputToContain('skipped')->assertSuccessful();
        $this->assertNull(Cache::get(BackupFiles::LAST_SUCCESS));
    }
}
