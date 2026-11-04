<?php

namespace Tests\Feature;

use App\Models\RucoyAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PullScreenshotsTest extends TestCase
{
    use RefreshDatabase;

    private const SERVER = 'http://server.test:8080';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function account(string $screenshot): void
    {
        RucoyAccount::create(['description' => 'Acc', 'email' => 'a@example.com', 'screenshot' => $screenshot]);
    }

    private function jpeg(): string
    {
        return UploadedFile::fake()->image('x.jpg')->getContent();
    }

    public function test_downloads_only_the_missing_screenshots(): void
    {
        $have = 'screenshots/' . str_repeat('a', 40) . '.jpg';
        $miss = 'screenshots/' . str_repeat('b', 40) . '.jpg';
        $this->account($have);
        $this->account($miss);
        Storage::disk('public')->put($have, 'already here');

        Http::fake([self::SERVER . '/storage/*' => Http::response($this->jpeg(), 200, ['Content-Type' => 'image/jpeg'])]);

        $this->artisan('screenshots:pull', ['--from' => self::SERVER])->assertSuccessful();

        Storage::disk('public')->assertExists($miss);
        $this->assertSame('already here', Storage::disk('public')->get($have));
        Http::assertSentCount(1);
        Http::assertSent(fn ($req) => $req->url() === self::SERVER . "/storage/{$miss}");
    }

    public function test_rejects_responses_that_are_not_images(): void
    {
        $path = 'screenshots/' . str_repeat('c', 40) . '.jpg';
        $this->account($path);

        // e.g. the server answers with its React page instead of the file
        Http::fake(['*' => Http::response('<!doctype html><html></html>', 200, ['Content-Type' => 'image/jpeg'])]);

        $this->artisan('screenshots:pull', ['--from' => self::SERVER])->assertFailed();
        Storage::disk('public')->assertMissing($path);
    }

    public function test_never_requests_unsafe_paths(): void
    {
        $this->account('../../.env');
        Http::fake();

        $this->artisan('screenshots:pull', ['--from' => self::SERVER])->assertFailed();
        Http::assertNothingSent();
    }

    public function test_needs_a_server_url(): void
    {
        config(['services.screenshots.source_url' => null]);

        $this->artisan('screenshots:pull')->assertFailed();
    }
}
