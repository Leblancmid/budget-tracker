<?php

namespace Tests\Feature;

use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Opened through Tailscale Serve (https://….ts.net), which forwards requests from the same machine. */
class TrustedProxyTest extends TestCase
{
    use RefreshDatabase;

    private const FORWARDED = ['X-Forwarded-Proto' => 'https', 'X-Forwarded-Host' => 'desktop.tail1.ts.net', 'X-Forwarded-Port' => '443'];

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
        RucoyAccount::create(['description' => 'Leblanc 600 Dist', 'email' => 'a@x.com', 'screenshot' => 'accounts/a.png']);
    }

    private function screenshotFrom(string $ip): string
    {
        return collect($this->withServerVariables(['REMOTE_ADDR' => $ip])->withHeaders(self::FORWARDED)
            ->getJson('/api/v1/rucoy/accounts')->assertOk()->json())->flatten()
            ->first(fn ($v) => is_string($v) && str_ends_with($v, 'accounts/a.png'));
    }

    public function test_links_use_the_https_address_when_tailscale_forwards_the_request(): void
    {
        $this->assertSame('https://desktop.tail1.ts.net/storage/accounts/a.png', $this->screenshotFrom('127.0.0.1'));
    }

    public function test_forwarded_headers_from_anyone_else_are_ignored(): void
    {
        $this->assertStringStartsWith('http://localhost', $this->screenshotFrom('100.64.0.9'));
    }
}
