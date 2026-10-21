<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\MiddlemanFee;
use App\Models\User;
use App\Services\MiddlemanFeeTrade;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BusinessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    private function stash(): float
    {
        return (float) Gold::sum('amount');
    }

    /** 1.2M / 700K gold at $0.20 per 1M and ₱60 per $ → ₱14.40 / ₱8.40. */
    private function goldTrade(array $overrides = []): BusinessTransaction
    {
        $id = $this->postJson('/api/v1/business/transactions', [
            'type' => 'gold', 'description' => 'G1', 'date' => '2026-10-01',
            'price_gold' => 1_200_000, 'cost_gold' => 700_000,
            'price_rate' => 0.2, 'cost_rate' => 0.2, 'php_rate' => 60,
            'price_php' => 14.4, 'cost_php' => 8.4, 'amount' => 6,
            ...$overrides,
        ])->assertCreated()->json('id');

        return BusinessTransaction::findOrFail($id);
    }

    public function test_store_derives_profit_and_tracks_inventory(): void
    {
        $tx = $this->goldTrade(['add_to_inventory' => true]);
        $this->assertEquals(6, $tx->profit_php);
        $this->assertEquals(1_200_000, $tx->inventory_gold);
        $this->assertEquals(1_200_000, $this->stash());
        $this->assertDatabaseHas('golds', ['description' => 'Added: G1']);

        $this->putJson("/api/v1/business/transactions/{$tx->id}", ['price_gold' => 1_500_000])->assertOk();
        $this->assertEquals(1_500_000, $this->stash());
        $this->assertDatabaseHas('golds', ['description' => 'Adjusted: G1', 'amount' => 300_000]);

        $this->deleteJson("/api/v1/business/transactions/{$tx->id}")->assertOk();
        $this->assertEquals(0, $this->stash());
        $this->assertDatabaseHas('golds', ['description' => 'Removed: G1']);
    }

    public function test_untracked_trade_leaves_inventory_alone(): void
    {
        $tx = $this->goldTrade();
        $this->assertNull($tx->inventory_gold);
        $this->assertEquals(0, $this->stash());
    }

    public function test_partial_sell_reduces_cost_by_the_same_gold(): void
    {
        $tx = $this->goldTrade(['add_to_inventory' => true]);

        $res = $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 200_000, 'description' => 'to Bob'])
            ->assertOk()->json();

        $this->assertEquals(200_000, $res['sold']['price_gold']);
        $this->assertEquals(200_000, $res['sold']['cost_gold']);
        $this->assertEquals(2.4, $res['sold']['price_php']);
        $this->assertEquals(2.4, $res['sold']['cost_php']);
        $this->assertNotNull($res['sold']['archived_at']);
        $this->assertNull($res['sold']['inventory_gold']);
        $this->assertStringContainsString('Partial sale of 200,000 / 1,200,000 G — to Bob', $res['sold']['notes']);

        $this->assertEquals(1_000_000, $res['remaining']['price_gold']);
        $this->assertEquals(500_000, $res['remaining']['cost_gold']);
        $this->assertEquals(12, $res['remaining']['price_php']);
        $this->assertEquals(6, $res['remaining']['cost_php']);
        $this->assertEquals(6, $res['remaining']['profit_php']);
        $this->assertEquals(1_000_000, $res['remaining']['inventory_gold']);

        $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 5_000_000])
            ->assertStatus(422)->assertJsonValidationErrors('amount');
    }

    public function test_full_sell_archives_and_can_deduct_inventory(): void
    {
        Gold::create(['amount' => 2_000_000]);
        $tx = $this->goldTrade();

        $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 1_200_000, 'deduct_inventory' => true])
            ->assertOk()->assertJsonPath('remaining', null);

        $this->assertNotNull($tx->fresh()->archived_at);
        $this->assertEquals(800_000, $this->stash());
        $this->assertDatabaseHas('gold_logs', ['type' => 'sell', 'description' => 'Sold: G1']);

        $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 1])->assertStatus(422);

        $this->getJson('/api/v1/business/transactions/summary?month=' . now()->month . '&year=' . now()->year)
            ->assertOk()->assertJson(['income' => 14.4, 'expense' => 8.4, 'profit' => 6]);
    }

    public function test_cannot_sell_a_trade_without_rates(): void
    {
        $tx = $this->goldTrade(['price_php' => null, 'cost_php' => null]);
        $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 1])->assertStatus(422);
    }

    public function test_add_gold_tops_up_price_and_cost(): void
    {
        $tx = $this->goldTrade(['add_to_inventory' => true]);

        $this->postJson("/api/v1/business/transactions/{$tx->id}/add-gold", ['price_gold' => 100_000, 'cost_gold' => 50_000, 'description' => 'top up'])
            ->assertOk()
            ->assertJsonPath('price_gold', '1300000')
            ->assertJsonPath('price_php', '15.60')
            ->assertJsonPath('cost_php', '9.00')
            ->assertJsonPath('profit_php', '6.60');

        $this->assertEquals(1_300_000, $tx->fresh()->inventory_gold);
        $this->assertEquals(1_300_000, $this->stash());

        $this->postJson("/api/v1/business/transactions/{$tx->id}/add-gold", [])
            ->assertStatus(422)->assertJsonValidationErrors('price_gold');
    }

    public function test_pinned_middleman_fee_trade_is_permanent(): void
    {
        $this->getJson('/api/v1/business/transactions')->assertOk();
        $mm = BusinessTransaction::where('system_key', MiddlemanFeeTrade::KEY)->firstOrFail();

        $this->deleteJson("/api/v1/business/transactions/{$mm->id}")->assertStatus(422);
        $this->postJson("/api/v1/business/transactions/{$mm->id}/archive")->assertStatus(422);

        // Price gold added here is recorded as a middleman fee
        $this->postJson("/api/v1/business/transactions/{$mm->id}/add-gold", ['price_gold' => 300])->assertOk()
            ->assertJsonPath('price_gold', '300');
        $this->assertSame(1, MiddlemanFee::count());
        $this->assertEquals(300, $this->stash());
    }

    public function test_archive_and_unarchive(): void
    {
        $tx = $this->goldTrade();
        $this->postJson("/api/v1/business/transactions/{$tx->id}/archive")->assertOk();
        $this->getJson('/api/v1/business/transactions/archived')->assertOk()->assertJsonCount(1);
        $this->postJson("/api/v1/business/transactions/{$tx->id}/unarchive")->assertOk()->assertJsonPath('archived_at', null);
    }

    public function test_dashboards_and_reports_respond(): void
    {
        $tx = $this->goldTrade();
        $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 1_200_000])->assertOk();
        $month = now()->month;
        $year  = now()->year;

        $this->getJson("/api/v1/business/dashboard?month={$month}&year={$year}")->assertOk()
            ->assertJsonPath('total_profit', 6)
            ->assertJsonPath('sold_count', 1);

        foreach (['weekly', 'monthly', 'yearly'] as $period) {
            $this->getJson("/api/v1/reports/business?period={$period}&month={$month}&year={$year}")->assertOk()
                ->assertJsonPath('totals.profit', 6);
            $this->getJson("/api/v1/reports/daily-expenses?period={$period}&month={$month}&year={$year}")->assertOk();
        }

        $this->getJson('/api/v1/master/dashboard')->assertOk()
            ->assertJsonPath('business_profit', 6)
            ->assertJsonPath('monthly_business_profit', 6);
    }
}
