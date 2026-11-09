<?php

namespace Tests\Feature;

use App\Console\Commands\BackupOffsite;
use App\Services\Backup\BackupCrypto;
use App\Services\Backup\R2Client;
use App\Services\BusinessBrief;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

/** Encrypted off-site backups to Cloudflare R2, and restoring them. */
class OffsiteBackupTest extends TestCase
{
    use RefreshDatabase;

    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'backup.r2' => ['account_id' => 'acct', 'key' => 'AKID', 'secret' => 'SECRET', 'bucket' => 'budget-backups'],
            'backup.password' => 'correct horse battery staple',
            'backup.keep' => 2,
        ]);
        Cache::flush();
        $this->dir = storage_path('app/backups');
        File::ensureDirectoryExists($this->dir);
    }

    public function test_signature_matches_the_aws_documented_example(): void
    {
        // AWS S3 docs, "Example: GET Object" (Signature Version 4)
        $headers = R2Client::sign(
            'GET', 'examplebucket.s3.amazonaws.com', '/test.txt', [], ['range' => 'bytes=0-9'],
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            'AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', 'us-east-1', '20130524T000000Z',
        );

        $this->assertStringEndsWith('Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41', $headers['authorization']);
    }

    public function test_a_backup_decrypts_back_to_the_same_sql_and_only_with_the_password(): void
    {
        $sql  = "INSERT INTO t VALUES ('₱1,000');\n" . str_repeat('-- filler', 500);
        $blob = BackupCrypto::encrypt($sql, 'correct horse battery staple');

        $this->assertStringNotContainsString('INSERT', $blob);
        $this->assertLessThan(strlen($sql), strlen($blob)); // compressed
        $this->assertSame($sql, BackupCrypto::decrypt($blob, 'correct horse battery staple'));

        $this->expectException(RuntimeException::class);
        BackupCrypto::decrypt($blob, 'wrong password!!');
    }

    public function test_the_newest_export_is_uploaded_and_old_ones_are_removed(): void
    {
        $file = $this->dir . '/budget_tracker_2099-01-01_00-00-00.sql';
        File::put($file, 'CREATE TABLE x (id int);');
        touch($file, time() + 60); // newest
        Http::fake([
            'acct.r2.cloudflarestorage.com/budget-backups/budget/*' => Http::response('', 200),
            'acct.r2.cloudflarestorage.com/budget-backups?*' => Http::response(
                '<ListBucketResult><IsTruncated>false</IsTruncated>'
                . '<Contents><Key>budget/a_2099-01-01.sql.gz.enc</Key><Size>1</Size></Contents>'
                . '<Contents><Key>budget/a_2098-12-31.sql.gz.enc</Key><Size>1</Size></Contents>'
                . '<Contents><Key>budget/a_2098-12-30.sql.gz.enc</Key><Size>1</Size></Contents></ListBucketResult>'),
        ]);

        try {
            $this->artisan('backup:offsite')->assertSuccessful();
        } finally {
            File::delete($file);
        }

        Http::assertSent(function ($r) {
            return $r->method() === 'PUT'
                && $r->url() === 'https://acct.r2.cloudflarestorage.com/budget-backups/budget/budget_tracker_2099-01-01_00-00-00.sql.gz.enc'
                && str_starts_with($r->header('authorization')[0], 'AWS4-HMAC-SHA256 Credential=AKID/')
                && BackupCrypto::decrypt($r->body(), 'correct horse battery staple') === 'CREATE TABLE x (id int);';
        });
        // keep = 2: only the oldest goes
        Http::assertSent(fn ($r) => $r->method() === 'DELETE' && str_ends_with($r->url(), 'a_2098-12-30.sql.gz.enc'));
        Http::assertNotSent(fn ($r) => $r->method() === 'DELETE' && str_ends_with($r->url(), 'a_2099-01-01.sql.gz.enc'));
        $this->assertNotNull(Cache::get(BackupOffsite::LAST_SUCCESS));
    }

    public function test_a_failed_backup_shows_in_the_weekly_brief(): void
    {
        config(['backup.password' => null]);
        $this->artisan('backup:offsite')->assertFailed();

        $this->assertSame('Off-site backup has never run', collect(BusinessBrief::build()['insights'])->firstWhere('key', 'backup')['title']);

        Cache::forever(BackupOffsite::LAST_SUCCESS, now()->toIso8601String());
        $this->assertNull(collect(BusinessBrief::build()['insights'])->firstWhere('key', 'backup'));
    }

    public function test_a_downloaded_backup_can_be_decrypted_for_a_restore(): void
    {
        $enc = $this->dir . '/restore-test.sql.gz.enc';
        File::put($enc, BackupCrypto::encrypt('SELECT 1;', 'correct horse battery staple'));

        try {
            $this->artisan('backup:decrypt', ['file' => $enc])->assertSuccessful();
            $this->assertSame('SELECT 1;', File::get($this->dir . '/restore-test.sql'));
        } finally {
            File::delete([$enc, $this->dir . '/restore-test.sql']);
        }
    }
}
