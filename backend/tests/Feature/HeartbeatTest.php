<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/** The "still alive" ping to the monitoring service. */
class HeartbeatTest extends TestCase
{
    public function test_it_pings_every_five_minutes_when_set(): void
    {
        $event = collect(app(Schedule::class)->events())->first(fn ($e) => str_contains($e->command, 'heartbeat:ping'));
        $this->assertSame('*/5 * * * *', $event->expression);

        config(['monitoring.heartbeat_url' => 'https://hc-ping.test/abc-secret']);
        Http::fake(['hc-ping.test/*' => Http::response('OK')]);

        $this->artisan('heartbeat:ping')->expectsOutputToContain('Pinged')->assertSuccessful();
        Http::assertSent(fn ($r) => $r->url() === 'https://hc-ping.test/abc-secret' && $r->method() === 'GET' && $r->body() === '');
    }

    public function test_without_a_link_nothing_is_sent(): void
    {
        config(['monitoring.heartbeat_url' => null]);
        Http::fake();

        $this->artisan('heartbeat:ping')->expectsOutputToContain('skipped')->assertSuccessful();
        Http::assertNothingSent();
    }

    public function test_a_refused_ping_is_logged_without_the_secret_link(): void
    {
        config(['monitoring.heartbeat_url' => 'https://hc-ping.test/abc-secret']);
        Http::fake(['hc-ping.test/*' => Http::response('not found', 404)]);
        Log::spy();

        $this->artisan('heartbeat:ping')->assertFailed();

        Log::shouldHaveReceived('warning')->withArgs(fn ($msg) => str_contains($msg, '404') && ! str_contains($msg, 'abc-secret'));
    }
}
