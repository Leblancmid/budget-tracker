<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GoldHistoryUndoTest extends TestCase
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

    /** 1,000KK bought at 0.17 × 63.4, to sell at 0.205 × 63, with half the price received. */
    private function trade(): BusinessTransaction
    {
        $id = $this->postJson('/api/v1/business/transactions', [
            'type' => 'gold', 'description' => '.17$ binance', 'date' => '2026-11-04',
            'price_gold' => 1_000_000_000, 'cost_gold' => 1_000_000_000,
            'price_rate' => 0.205, 'php_rate' => 63, 'cost_rate' => 0.17, 'cost_php_rate' => 63.4,
            'price_php' => 12915, 'cost_php' => 10778, 'price_gold_received' => 500_000_000,
            'amount' => 2137, 'add_to_inventory' => true,
        ])->assertCreated()->json('id');

        return BusinessTransaction::findOrFail($id);
    }

    private function sell(BusinessTransaction $tx, float $gold): void
    {
        $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => $gold, 'deduct_inventory' => true])->assertOk();
    }

    private function saleLog(): GoldLog
    {
        return GoldLog::where('type', 'sell')->latest('id')->firstOrFail();
    }

    public function test_undoing_a_partial_sale_puts_it_back_on_the_trade(): void
    {
        $tx     = $this->trade();
        $before = $tx->fresh()->only(['price_gold', 'cost_gold', 'price_php', 'cost_php', 'profit_php', 'price_gold_received', 'inventory_gold']);

        $this->sell($tx, 540_000_000);
        $this->assertSame(1, BusinessTransaction::archived()->count());
        $this->assertEquals(460_000_000, $this->stash());

        $this->postJson("/api/v1/rucoy/gold-logs/{$this->saleLog()->id}/cancel")->assertOk()->assertJsonPath('cancelled_at', fn ($v) => $v !== null);

        // Exactly as before the sale: one pending trade, same gold, ₱ and progress, stash back
        $this->assertSame(0, BusinessTransaction::archived()->count());
        $this->assertEquals($before, $tx->fresh()->only(array_keys($before)));
        $this->assertEquals(1_000_000_000, $this->stash());
    }

    public function test_undoing_a_full_sale_makes_the_trade_pending_again(): void
    {
        $tx = $this->trade();
        $this->sell($tx, 1_000_000_000);
        $this->assertNotNull($tx->fresh()->archived_at);

        $this->postJson("/api/v1/rucoy/gold-logs/{$this->saleLog()->id}/cancel")->assertOk();

        $this->assertNull($tx->fresh()->archived_at);
        $this->assertEquals(1_000_000_000, (float) $tx->fresh()->price_gold);
        $this->assertEquals(1_000_000_000, $this->stash());
        // Can't be undone twice
        $this->postJson("/api/v1/rucoy/gold-logs/{$this->saleLog()->id}/cancel")->assertStatus(422);
    }

    public function test_entries_that_are_not_sales_only_reverse_the_stash(): void
    {
        $this->postJson('/api/v1/rucoy/golds/adjust', ['actual' => 5_000_000])->assertOk();
        $log = GoldLog::latest('id')->firstOrFail();

        $this->postJson("/api/v1/rucoy/gold-logs/{$log->id}/cancel")->assertOk();
        $this->assertEquals(0, $this->stash());
    }

    public function test_account_payments_show_on_the_logs_page(): void
    {
        $account = RucoyAccount::create(['description' => 'Leblanc 657 Dist', 'email' => 'l@example.com', 'cost' => 1_000_000]);
        $id = $this->postJson("/api/v1/rucoy/accounts/{$account->id}/payments", [
            'method' => 'cash', 'balance_account' => null, 'cash_amount' => 500, 'gold' => 1_000_000, 'date' => '2026-11-04',
        ])->assertCreated()->json('id');

        $this->getJson('/api/v1/logs')->assertOk()->assertJsonFragment([
            'module' => 'business', 'type' => 'payment',
            'description' => 'Paid for Leblanc 657 Dist: 1,000,000 G paid outside Balance',
        ]);

        $this->deleteJson("/api/v1/rucoy/accounts/{$account->id}/payments/{$id}")->assertOk();
        $this->getJson('/api/v1/logs')->assertOk()->assertJsonFragment([
            'type' => 'removed', 'description' => 'Removed: Paid for Leblanc 657 Dist: 1,000,000 G paid outside Balance',
        ]);
    }
}
