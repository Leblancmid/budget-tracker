<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Models\User;
use App\Services\ListingAnnouncer;
use App\Services\ListingPerformance;
use App\Services\PhoneAlerts;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Selling better: how each listing is doing, follow-up and slow-listing alerts, Discord posts for
 * new listings, and the Buyers page.
 */
class StorefrontInsightsTest extends TestCase
{
    use RefreshDatabase;

    private User $trader;

    /** What the fake website answers */
    private array $views = [];

    private array $leads = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->trader = User::factory()->create(['role' => 'trader']);
        Sanctum::actingAs($this->trader);
        Cache::flush();
        Storage::fake('public');
        config(['listing.site_token' => str_repeat('t', 40), 'listing.site_url' => 'https://site.test']);
        config(['services.webpush.public_key' => null]);
        PhoneAlerts::$sender = fn ($devices) => $devices->count();
        Http::fake(function (Request $r) {
            if (str_contains($r->url(), '/api/stats')) {
                return Http::response(['online' => 0, 'listing_views' => $this->views, 'alerts' => []]);
            }
            if (str_contains($r->url(), '/api/leads')) {
                return Http::response(['leads' => $this->leads]);
            }
            if (str_contains($r->url(), 'discord.test')) {
                return Http::response(null, 204);
            }

            return Http::response([], 404);
        });
    }

    protected function tearDown(): void
    {
        PhoneAlerts::$sender = null;
        parent::tearDown();
    }

    /** An account on the website, listed $days ago */
    private function listed(string $name, int $days): RucoyAccount
    {
        Storage::disk('public')->put("accounts/{$name}.jpg", 'img');

        return RucoyAccount::create(['description' => $name, 'email' => strtolower(str_replace(' ', '', $name)) . '@x.com', 'screenshot' => "accounts/{$name}.jpg", 'listed_at' => now()->subDays($days)]);
    }

    public function test_each_listing_gets_a_plain_verdict(): void
    {
        $asked  = $this->listed('Lv 690 Dist', 30);
        $early  = $this->listed('Lv 650 Melee', 5);
        $hidden = $this->listed('Lv 640 Mage', 25);
        $priced = $this->listed('Lv 700 Melee', 40);
        RucoyAccount::create(['description' => 'No screenshot', 'email' => 'n@x.com']); // not on the website

        $this->views = [
            ['listing_id' => "acc-{$asked->id}", 'total' => 80, 'last7' => 10],
            ['listing_id' => "acc-{$hidden->id}", 'total' => 12, 'last7' => 1],
            ['listing_id' => "acc-{$priced->id}", 'total' => 140, 'last7' => 20],
        ];
        $this->leads = [['id' => 1, 'type' => 'account', 'status' => 'new', 'listing_id' => "acc-{$asked->id}", 'details' => [], 'created_at' => 1, 'updated_at' => 1]];

        $r = $this->getJson('/api/v1/business/listing-performance')->assertOk()->json();

        $this->assertSame(ListingPerformance::MIN_DAYS, $r['usual_days']); // nothing sold yet
        $this->assertTrue($r['has_stats']);
        $verdicts = collect($r['listings'])->pluck('verdict', 'account_id');
        $this->assertSame('interest', $verdicts[$asked->id]);
        $this->assertSame('early', $verdicts[$early->id]);
        $this->assertSame('reach', $verdicts[$hidden->id]);
        $this->assertSame('price', $verdicts[$priced->id]);
        $this->assertSame($priced->id, $r['listings'][0]['account_id'], 'needs attention first');
        $this->assertCount(4, $r['listings']);
    }

    public function test_a_daily_only_user_cant_see_listing_performance_or_buyers(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->getJson('/api/v1/business/listing-performance')->assertForbidden();
        $this->getJson('/api/v1/business/buyers')->assertForbidden();
    }

    public function test_morning_alerts_for_buyers_to_follow_up_and_slow_listings_once_per_set(): void
    {
        $slow = $this->listed('Lv 700 Melee', 40);
        $this->views = [['listing_id' => "acc-{$slow->id}", 'total' => 140, 'last7' => 20]];
        $old = now()->subDays(4)->getTimestampMs();
        $this->leads = [
            ['id' => 5, 'type' => 'gold', 'status' => 'contacted', 'name' => 'Mia', 'details' => ['amount_kk' => 500, 'payment' => 'GCash'], 'created_at' => $old, 'updated_at' => $old],
            ['id' => 6, 'type' => 'gold', 'status' => 'contacted', 'name' => 'Kai', 'details' => ['amount_kk' => 100], 'created_at' => $old, 'updated_at' => now()->getTimestampMs()], // messaged today
            ['id' => 7, 'type' => 'gold', 'status' => 'won', 'name' => 'Rho', 'details' => [], 'created_at' => $old, 'updated_at' => $old],
        ];

        $this->artisan('business:alerts')->assertSuccessful();
        $this->artisan('business:alerts')->assertSuccessful(); // the same ones the next morning: no repeat

        $alerts = $this->trader->fresh()->notifications()->get()->map(fn ($n) => $n->data);
        $this->assertSame(['Follow up with a buyer', 'A listing is slow to sell'], $alerts->pluck('title')->sort()->values()->reverse()->values()->all());
        $follow = $alerts->firstWhere('title', 'Follow up with a buyer');
        $this->assertStringContainsString('500 KK · GCash', $follow['body']);
        $this->assertStringNotContainsString('Mia', json_encode($alerts)); // never names on the lock screen
        $this->assertStringContainsString('Lv 700 Melee (40 days)', $alerts->firstWhere('title', 'A listing is slow to sell')['body']);
    }

    public function test_new_listings_and_price_drops_are_planned_for_discord_but_not_on_the_first_publish(): void
    {
        $now = [
            ['id' => 'acc-1', 'level' => 690, 'category' => 'Distance', 'price' => '1.8KKK', 'price_was' => '2KKK', 'price_dropped_at' => '2026-11-20'],
            ['id' => 'acc-2', 'level' => 650, 'category' => 'Melee', 'price' => '1KKK'],
            ['id' => 'acc-3', 'level' => 700, 'category' => 'Magic'],
        ];
        $before = [['id' => 'acc-1', 'price' => '2KKK'], ['id' => 'acc-2', 'price' => '1KKK']];

        $plan = ListingAnnouncer::plan($now, $before, '2026-11-20');
        $this->assertSame([['drop', 'acc-1'], ['new', 'acc-3']], array_map(fn ($p) => [$p['kind'], $p['listing']['id']], $plan));
        $this->assertSame([], ListingAnnouncer::plan($now, [], '2026-11-20'), 'the first publish posts nothing');
    }

    public function test_posts_go_to_the_webhook_with_the_screenshot_and_only_when_set_up(): void
    {
        Storage::disk('public')->put('accounts/a.jpg', 'img');
        $post = [['kind' => 'new', 'listing' => ['id' => 'acc-3', 'level' => 700, 'category' => 'Magic', 'price' => '3KKK', 'image' => '/listings/acc-3.jpg',
            'stats' => ['melee' => 50, 'distance' => 60, 'magic' => 640, 'defense' => 500]]]];

        $this->assertSame(0, ListingAnnouncer::post($post, ['acc-3' => 'accounts/a.jpg']), 'no webhook: nothing posted');

        config(['listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc']);
        $this->assertSame(1, ListingAnnouncer::post($post, ['acc-3' => 'accounts/a.jpg']));
        Http::assertSent(function (Request $r) {
            if (! str_contains($r->url(), 'discord.test')) {
                return false;
            }
            $parts = collect($r->data())->keyBy('name');
            $embed = json_decode($parts['payload_json']['contents'], true)['embeds'][0];

            return $parts->has('files[0]')
                && $embed['title'] === '🆕 Lv 700 Magic for sale'
                && $embed['url'] === 'https://site.test/for-sale?listing=acc-3'
                && $embed['image']['url'] === 'attachment://acc-3.jpg'
                && str_contains($embed['fields'][0]['value'], 'Magic 640');
        });
    }

    public function test_the_discord_command_tests_the_webhook_and_can_post_the_newest_listings(): void
    {
        $this->artisan('listings:discord')->assertFailed(); // no webhook set

        config(['listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc']);
        $this->artisan('listings:discord')->expectsOutputToContain('Test message sent')->assertSuccessful();
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'discord.test') && str_contains((string) ($r['content'] ?? ''), 'connected'));

        $a = $this->listed('Lv 690 Dist', 3);
        $a->update(['level' => 690]);
        $this->artisan('listings:discord', ['--latest' => 2])->expectsOutputToContain('Posted 1 of 1')->assertSuccessful();
    }

    public function test_buyers_are_grouped_by_name_with_repeat_buyers_counted(): void
    {
        $sale = fn (string $to, string $type, float $php, int $daysAgo) => BusinessTransaction::create([
            'type' => $type, 'description' => "{$type} sale", 'amount' => 1, 'date' => now()->subDays($daysAgo)->toDateString(),
            'price_php' => $php, 'profit_php' => $php / 10, 'sold_to' => $to, 'archived_at' => now()->subDays($daysAgo),
        ]);
        $sale('Kai', 'account', 20000, 30);
        $sale(' kai ', 'gold', 5000, 2);
        $sale('Mia', 'account', 15000, 10);
        BusinessTransaction::create(['type' => 'gold', 'description' => 'not sold yet', 'amount' => 1, 'date' => now()->toDateString(), 'sold_to' => 'Kai']);

        $r = $this->getJson('/api/v1/business/buyers')->assertOk()->json();

        $this->assertSame(2, $r['total']);
        $this->assertEquals(['buyers' => 2, 'repeat' => 1, 'repeat_share' => 0.5, 'repeat_sales_php' => 25000, 'total_php' => 40000], $r['summary']);
        $kai = $r['data'][0]; // bought most recently
        $this->assertEquals(['kai', 2, 1, 1, 25000], [$kai['name'], $kai['purchases'], $kai['accounts'], $kai['golds'], $kai['total_php']]);
        $this->assertSame('gold', $kai['items'][0]['type']);

        $this->getJson('/api/v1/business/buyers?q=MIA')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.name', 'Mia');
        $this->getJson('/api/v1/business/buyers?sort=total&per_page=5')->assertOk()->assertJsonPath('data.0.name', 'kai');
        $this->getJson('/api/v1/business/buyers?per_page=500')->assertStatus(422);
    }
}
