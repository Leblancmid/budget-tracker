<?php

namespace Tests\Feature;

use App\Models\RucoyAccount;
use App\Models\User;
use App\Services\BusinessBrief;
use App\Services\WebsiteStats;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Visitor stats and "Notify me" matches from the website, with the website faked. */
class WebsiteStatsTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'test-token-0123456789abcdef0123456789';

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
        Cache::flush();
        config(['listing.site_url' => 'https://site.test', 'listing.site_token' => self::TOKEN]);
    }

    private function fakeSite(array $listingViews = [], int $status = 200): void
    {
        Http::fake(['site.test/api/stats' => Http::response($status === 200 ? [
            'online' => 3, 'online_pages' => [], 'today' => ['visitors' => 12, 'pageviews' => 40],
            'last7' => ['visitors' => 80, 'pageviews' => 300], 'last30' => ['visitors' => 250, 'pageviews' => 900],
            'all_time' => ['unique_visitors' => 400, 'pageviews' => 1500], 'daily' => [],
            'listing_views' => $listingViews, 'alerts' => [],
        ] : ['message' => 'Not allowed.'], $status)]);
    }

    public function test_stats_come_from_the_website_with_each_listing_named(): void
    {
        $a = RucoyAccount::create(['description' => 'Leblanc 721 Dist', 'email' => 'a@x.com']);
        $this->fakeSite([['listing_id' => "acc-{$a->id}", 'total' => 25, 'last7' => 6], ['listing_id' => 'acc-999', 'total' => 2, 'last7' => 0]]);

        $this->getJson('/api/v1/business/website-stats')->assertOk()
            ->assertJsonPath('configured', true)->assertJsonPath('online', 3)->assertJsonPath('today.visitors', 12)
            ->assertJsonPath('listing_views.0.name', 'Leblanc 721 Dist')->assertJsonPath('listing_views.0.sold', false)
            ->assertJsonPath('listing_views.1.name', 'acc-999');

        Http::assertSent(fn ($r) => $r->url() === 'https://site.test/api/stats' && $r->hasHeader('Authorization', 'Bearer ' . self::TOKEN));
    }

    public function test_a_wrong_token_or_no_token_is_explained(): void
    {
        $this->fakeSite(status: 401);
        $this->getJson('/api/v1/business/website-stats')->assertStatus(502)
            ->assertJsonPath('message', "The website didn't accept the token: LISTING_SITE_TOKEN must match STATS_TOKEN in Cloudflare.");

        config(['listing.site_token' => null]);
        $this->getJson('/api/v1/business/website-stats')->assertOk()->assertJsonPath('configured', false);
    }

    public function test_publishing_sends_the_listings_for_notify_me_matches(): void
    {
        Http::fake(['site.test/api/alerts/dispatch' => Http::response(['matched' => 2])]);

        $this->assertSame(2, WebsiteStats::dispatchAlerts([['id' => 'acc-1', 'category' => 'Distance', 'level' => 688, 'image' => '/x.jpg', '_screenshot' => 's.jpg']]));
        Http::assertSent(fn ($r) => $r->url() === 'https://site.test/api/alerts/dispatch'
            && $r['listings'] === [['id' => 'acc-1', 'category' => 'Distance', 'level' => 688]]);

        config(['listing.site_token' => null]);
        $this->assertNull(WebsiteStats::dispatchAlerts([]));
    }

    public function test_the_brief_uses_views_to_explain_a_slow_listing(): void
    {
        $sold = RucoyAccount::create(['description' => 'Sold one', 'email' => 's@x.com', 'listed_at' => now()->subDays(10)]);
        $sold->forceFill(['archived_at' => now()->subDays(5)])->save();
        $popular = RucoyAccount::create(['description' => 'Popular 700 Dist', 'email' => 'p@x.com', 'listed_at' => now()->subDays(30)]);
        $quiet   = RucoyAccount::create(['description' => 'Quiet 600 Melee', 'email' => 'q@x.com', 'listed_at' => now()->subDays(30)]);
        $this->fakeSite([['listing_id' => "acc-{$popular->id}", 'total' => 40, 'last7' => 9], ['listing_id' => "acc-{$quiet->id}", 'total' => 2, 'last7' => 0]]);

        $insights = collect(BusinessBrief::build()['insights'])->keyBy('key');

        $this->assertStringContainsString('Viewed 40 times', $insights["slow_listing:{$popular->id}"]['detail']);
        $this->assertStringContainsString('Only 2 website views', $insights["slow_listing:{$quiet->id}"]['detail']);
    }
}
