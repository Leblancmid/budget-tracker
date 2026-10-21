<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\MiddlemanFee;
use App\Models\RucoyAccount;
use App\Models\Trade;
use App\Models\User;
use App\Services\MiddlemanFeeTrade;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RucoyTest extends TestCase
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

    private function mmTradeGold(): float
    {
        return (float) BusinessTransaction::where('system_key', MiddlemanFeeTrade::KEY)->value('price_gold');
    }

    public function test_add_sell_adjust_and_cancel_gold(): void
    {
        $this->postJson('/api/v1/rucoy/golds', ['amount' => 1000, 'description' => 'big'])->assertCreated();
        $this->postJson('/api/v1/rucoy/golds', ['amount' => 200, 'description' => 'small'])->assertCreated();
        $this->assertSame(2, GoldLog::where('type', 'add')->count());

        // Sells come out of the largest entry first
        $this->postJson('/api/v1/rucoy/golds/sell', ['amount' => 300, 'description' => 'sold'])->assertOk();
        $this->assertEquals(700, Gold::where('description', 'big')->value('amount'));
        $this->assertEquals(200, Gold::where('description', 'small')->value('amount'));
        $this->assertEquals(900, $this->stash());

        // Overselling leaves a negative entry so the total stays right
        $this->postJson('/api/v1/rucoy/golds/sell', ['amount' => 1000])->assertOk();
        $this->assertEquals(-100, $this->stash());

        $this->postJson('/api/v1/rucoy/golds/adjust', ['actual' => 500])->assertOk()
            ->assertJson(['previous' => -100, 'delta' => 600, 'stash' => 500]);

        $sell = GoldLog::where('type', 'sell')->where('description', 'sold')->firstOrFail();
        $this->postJson("/api/v1/rucoy/gold-logs/{$sell->id}/cancel")->assertOk()->assertJsonPath('id', $sell->id);
        $this->assertEquals(800, $this->stash());
        $this->assertDatabaseHas('golds', ['description' => 'Cancelled: sold', 'amount' => 300]);
        $this->postJson("/api/v1/rucoy/gold-logs/{$sell->id}/cancel")->assertStatus(422);

        $this->getJson('/api/v1/rucoy/gold-logs')->assertOk()->assertJsonCount(5);
    }

    public function test_gold_with_trades_cannot_be_deleted(): void
    {
        $gold = Gold::create(['amount' => 10]);
        Trade::create(['gold_id' => $gold->id, 'status' => 'cash', 'amount' => 1]);
        $this->deleteJson("/api/v1/rucoy/golds/{$gold->id}")->assertStatus(422);

        $this->putJson("/api/v1/rucoy/golds/{$gold->id}", ['amount' => 20])->assertOk()->assertJsonPath('amount', '20.00');
    }

    public function test_kks_trade_middleman_fee_follows_the_trade(): void
    {
        $this->getJson('/api/v1/business/transactions')->assertOk(); // creates the pinned Middleman Fee trade

        $id = $this->postJson('/api/v1/rucoy/trades', ['status' => 'kks', 'amount' => 5000, 'middleman_fee' => 100, 'description' => 'T1'])
            ->assertCreated()->json('id');
        $this->assertEquals(100, $this->stash());
        $this->assertDatabaseHas('gold_logs', ['type' => 'fee', 'amount' => 100, 'description' => 'T1']);
        $this->assertEquals(100, MiddlemanFee::where('trade_id', $id)->value('amount'));
        $this->assertEquals(100, $this->mmTradeGold());

        $this->putJson("/api/v1/rucoy/trades/{$id}", ['middleman_fee' => 150])->assertOk();
        $this->assertEquals(150, $this->stash());
        $this->assertDatabaseHas('golds', ['description' => 'MM Fee adjusted: T1', 'amount' => 50]);
        $this->assertEquals(150, $this->mmTradeGold());

        $this->putJson("/api/v1/rucoy/trades/{$id}", ['middleman_fee' => null])->assertOk();
        $this->assertEquals(0, $this->stash());
        $this->assertDatabaseMissing('middleman_fees', ['trade_id' => $id]);
        $this->assertEquals(0, $this->mmTradeGold());

        $this->getJson('/api/v1/rucoy/dashboard')->assertOk()
            ->assertJsonPath('kks_gold', 5000)->assertJsonPath('trade_count', 1);

        $this->postJson("/api/v1/rucoy/trades/{$id}/archive")->assertOk();
        $this->getJson('/api/v1/rucoy/trades/archived')->assertOk()->assertJsonCount(1);
        $this->postJson("/api/v1/rucoy/trades/{$id}/unarchive")->assertOk();
        $this->deleteJson("/api/v1/rucoy/trades/{$id}")->assertOk();
    }

    public function test_first_fee_is_counted_once_when_the_pinned_trade_is_created(): void
    {
        // No pinned trade yet: the fee itself triggers its creation
        $this->assertNull(BusinessTransaction::where('system_key', MiddlemanFeeTrade::KEY)->first());

        $this->postJson('/api/v1/rucoy/middleman-fees', ['amount' => 40])->assertCreated();
        $this->assertEquals(40, $this->mmTradeGold());

        $this->postJson('/api/v1/rucoy/middleman-fees', ['amount' => 10])->assertCreated();
        $this->assertEquals(50, $this->mmTradeGold());
    }

    public function test_cash_trades_have_no_middleman_fee(): void
    {
        $this->postJson('/api/v1/rucoy/trades', ['status' => 'cash', 'amount' => 10, 'middleman_fee' => 5])->assertCreated();
        $this->assertSame(0, MiddlemanFee::count());
        $this->assertEquals(0, $this->stash());
    }

    public function test_manual_middleman_fee_goes_into_stash_and_pinned_trade(): void
    {
        $this->getJson('/api/v1/business/transactions')->assertOk();

        $id = $this->postJson('/api/v1/rucoy/middleman-fees', ['amount' => 40, 'description' => 'fee'])
            ->assertCreated()->json('id');
        $this->assertEquals(40, $this->stash());
        $this->assertEquals(40, $this->mmTradeGold());
        $this->getJson('/api/v1/rucoy/middleman-fees')->assertOk()->assertJsonPath('total', 40);

        $this->deleteJson("/api/v1/rucoy/middleman-fees/{$id}")->assertOk();
        $this->assertEquals(0, $this->mmTradeGold());
    }

    public function test_selling_an_account_adds_its_price_to_the_stash(): void
    {
        $id = $this->postJson('/api/v1/rucoy/accounts', ['email' => 'a@b.c', 'description' => 'Acc1', 'price' => 2000, 'cost' => 1500, 'payment_status' => 'not_paid'])
            ->assertCreated()->assertJsonPath('profit', 500)->json('id');
        $tx = BusinessTransaction::create(['type' => 'account', 'account_id' => $id, 'amount' => 1, 'date' => '2026-10-01']);

        $this->getJson('/api/v1/rucoy/dashboard')->assertOk()->assertJsonPath('accounts_to_pay', 1500);

        $this->postJson("/api/v1/rucoy/accounts/{$id}/archive")->assertOk();
        $this->assertNotNull($tx->fresh()->archived_at);
        $this->assertEquals(2000, $this->stash());
        $this->assertDatabaseHas('gold_logs', ['type' => 'add', 'description' => 'Sold: Acc1']);
        $this->getJson('/api/v1/rucoy/accounts/archived')->assertOk()->assertJsonCount(1);

        $this->postJson("/api/v1/rucoy/accounts/{$id}/unarchive")->assertOk();
        $this->assertNull($tx->fresh()->archived_at);
        $this->assertEquals(0, $this->stash());
        $this->assertDatabaseMissing('gold_logs', ['description' => 'Sold: Acc1']);

        $this->putJson("/api/v1/rucoy/accounts/{$id}", ['price' => 2500])->assertOk()->assertJsonPath('profit', 1000);
        $this->deleteJson("/api/v1/rucoy/accounts/{$id}")->assertOk();
        $this->assertNull(RucoyAccount::find($id));
    }
}
