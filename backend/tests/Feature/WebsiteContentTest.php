<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Models\User;
use App\Services\BusinessBrief;
use App\Services\WebsiteContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Gold rates and trust numbers for the website, and website leads in the app. */
class WebsiteContentTest extends TestCase
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

    public function test_gold_rates_are_saved_and_validated(): void
    {
        $this->getJson('/api/v1/business/website-gold')->assertOk()->assertJsonPath('gold.rates', []);

        $this->putJson('/api/v1/business/website-gold', [
            'rates' => [['method' => 'Binance', 'currency' => 'USD', 'per_kk' => 0.195], ['method' => 'GCash', 'currency' => 'PHP', 'per_kk' => 12.5]],
            'min_order_kk' => 100, 'note' => 'Delivered within 30 minutes',
        ])->assertOk()->assertJsonPath('gold.rates.0.per_kk', 0.195)->assertJsonPath('gold.min_order_kk', 100);

        $this->assertSame('GCash', WebsiteContent::gold()['rates'][1]['method']);

        $this->putJson('/api/v1/business/website-gold', [
            'rates' => [['method' => 'Binance', 'currency' => 'EUR', 'per_kk' => 0], ['method' => 'Binance', 'currency' => 'USD', 'per_kk' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors(['rates.0.currency', 'rates.0.per_kk', 'rates.0.method']);

        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->putJson('/api/v1/business/website-gold', ['rates' => []])->assertForbidden();
    }

    public function test_trust_numbers_count_sales_only(): void
    {
        $a = RucoyAccount::create(['description' => 'Sold', 'email' => 'a@x.com', 'listed_at' => now()->subDays(12)]);
        $a->forceFill(['archived_at' => now()->subDays(2)])->save();
        RucoyAccount::create(['description' => 'Still listed', 'email' => 'b@x.com']);
        BusinessTransaction::create(['type' => 'gold', 'price_gold' => 1, 'amount' => 1, 'date' => '2026-01-01', 'archived_at' => now()]);
        BusinessTransaction::create(['type' => 'gold', 'price_gold' => 1, 'amount' => 1, 'date' => '2026-01-01', 'archived_at' => now(), 'system_key' => 'middleman_fee']);

        $stats = WebsiteContent::stats();

        $this->assertSame(1, $stats['accounts_sold']);
        $this->assertSame(1, $stats['gold_trades']);  // the middleman-fee trade isn't a sale
        $this->assertEquals(10, $stats['avg_days_to_sell']);
        $this->assertSame(['accounts_sold', 'gold_trades', 'avg_days_to_sell', 'tracking_since'], array_keys($stats)); // no prices or profit
    }

    public function test_leads_come_from_the_website_with_the_price_guide_for_offers(): void
    {
        $listed = RucoyAccount::create(['description' => 'Leblanc 688 Dist', 'email' => 'c@x.com']);
        Http::fake(['site.test/api/leads' => Http::response(['leads' => [
            ['id' => 2, 'type' => 'sell', 'status' => 'new', 'name' => 'Mia', 'method' => 'whatsapp', 'contact' => '+63 912', 'listing_id' => null,
                'details' => ['level' => 650, 'category' => 'Distance', 'asking' => '2KKK'], 'created_at' => 2, 'updated_at' => 2],
            ['id' => 1, 'type' => 'account', 'status' => 'contacted', 'name' => 'Kai', 'method' => 'discord', 'contact' => 'kai', 'listing_id' => "acc-{$listed->id}",
                'details' => ['title' => 'Lv 688 Distance'], 'created_at' => 1, 'updated_at' => 1],
        ]])]);

        $this->getJson('/api/v1/business/leads')->assertOk()
            ->assertJsonPath('configured', true)
            ->assertJsonPath('leads.0.guide.sales', 0)                // no sold Distance accounts to compare yet
            ->assertJsonPath('leads.1.account_name', 'Leblanc 688 Dist')
            ->assertJsonPath('leads.1.account_sold', false);
    }

    public function test_a_lead_status_can_be_changed(): void
    {
        Http::fake(['site.test/api/leads/5' => Http::response(['ok' => true])]);

        $this->patchJson('/api/v1/business/leads/5', ['status' => 'won'])->assertOk();
        Http::assertSent(fn ($r) => $r->method() === 'PATCH' && $r['status'] === 'won' && $r->hasHeader('Authorization', 'Bearer ' . self::TOKEN));

        $this->patchJson('/api/v1/business/leads/5', ['status' => 'maybe'])->assertStatus(422);
    }

    public function test_the_brief_says_when_leads_are_waiting(): void
    {
        Http::fake(['site.test/api/stats' => Http::response([
            'online' => 0, 'listing_views' => [], 'alerts' => [],
            'leads_new' => ['count' => 2, 'oldest' => now()->subHours(30)->getTimestampMs()],
        ])]);

        $lead = collect(BusinessBrief::build()['insights'])->firstWhere('key', 'leads');

        $this->assertSame('2 website leads waiting for a reply', $lead['title']);
        $this->assertSame('bad', $lead['level']); // over a day old
    }
}
