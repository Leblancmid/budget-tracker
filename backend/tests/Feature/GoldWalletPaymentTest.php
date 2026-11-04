<?php

namespace Tests\Feature;

use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GoldWalletPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    private function balance(string $code): float
    {
        return (float) BalanceEntry::where('account', $code)->where('type', 'add')->sum('amount')
             - (float) BalanceEntry::where('account', $code)->where('type', 'sell')->sum('amount');
    }

    /** Buy 540KK at 0.17 $/M × 63.4 ₱/$ = $91.80 / ₱5,820.12, as the Add Gold dialog sends it. */
    private function buy(array $overrides = [])
    {
        return $this->postJson('/api/v1/business/transactions', [
            'type' => 'gold', 'description' => 'Gold from Kai', 'date' => '2026-11-04',
            'price_gold' => 540_000_000, 'cost_gold' => 540_000_000,
            'cost_rate' => 0.17, 'cost_php_rate' => 63.4, 'php_rate' => 63.4,
            'cost_php' => 5820.12, 'amount' => 0.01, 'add_to_inventory' => true,
            ...$overrides,
        ]);
    }

    public function test_buying_gold_deducts_its_cost_from_a_peso_wallet(): void
    {
        $id = $this->buy(['balance_account' => 'MARIBANK'])->assertCreated()->json('id');

        $this->assertEquals(-5820.12, $this->balance('MARIBANK'));
        $entry = BalanceEntry::sole();
        $this->assertSame($id, $entry->business_transaction_id);
        $this->assertSame('2026-11-04', $entry->date->format('Y-m-d'));
        $this->assertStringContainsString('540,000,000 G', $entry->description);
    }

    public function test_a_peso_wallet_pays_the_peso_cost_that_was_typed(): void
    {
        // "₱ paid" entry: 540KK × 0.17 = $91.80, paid ₱5,830 → PHP rate worked out as 63.5076
        $this->buy(['balance_account' => 'MARIBANK', 'cost_php' => 5830, 'cost_php_rate' => 63.5076])->assertCreated();

        $this->assertEquals(-5830, $this->balance('MARIBANK'));
    }

    public function test_a_dollar_wallet_pays_the_dollar_cost(): void
    {
        $this->buy(['balance_account' => 'BINANCE'])->assertCreated();

        $this->assertEquals(-91.80, $this->balance('BINANCE'));
    }

    public function test_no_wallet_leaves_balance_alone(): void
    {
        $this->buy()->assertCreated();

        $this->assertSame(0, BalanceEntry::count());
    }

    public function test_paying_needs_a_priced_cost_and_a_real_wallet(): void
    {
        $this->buy(['balance_account' => 'MARIBANK', 'cost_rate' => null, 'cost_php' => null])
            ->assertStatus(422)->assertJsonValidationErrors(['balance_account']);
        $this->buy(['balance_account' => 'MARIBANK', 'cost_php_rate' => null, 'php_rate' => null, 'cost_php' => null])
            ->assertStatus(422)->assertJsonValidationErrors(['balance_account']);
        $this->buy(['balance_account' => 'BINANCE', 'cost_rate' => null])
            ->assertStatus(422)->assertJsonValidationErrors(['balance_account']);
        $this->buy(['balance_account' => 'MARIBANK', 'price_gold' => 0, 'cost_gold' => 0, 'cost_php' => null])
            ->assertStatus(422)->assertJsonValidationErrors(['balance_account']);
        $this->buy(['balance_account' => 'NOPE'])
            ->assertStatus(422)->assertJsonValidationErrors(['balance_account']);
        $this->buy(['balance_account' => 'MARIBANK', 'type' => 'expense'])
            ->assertStatus(422)->assertJsonValidationErrors(['balance_account']);

        $this->assertSame(0, BalanceEntry::count());
    }

    public function test_topping_up_the_cost_pays_for_the_added_gold_only(): void
    {
        $id = $this->buy(['balance_account' => 'MARIBANK'])->json('id');

        // 100KK more at the trade's rates: 100 × 0.17 × 63.4 = ₱1,077.80
        $this->postJson("/api/v1/business/transactions/{$id}/add-gold", [
            'price_gold' => 100_000_000, 'cost_gold' => 100_000_000, 'balance_account' => 'MARIBANK',
        ])->assertOk();

        $this->assertEquals(-(5820.12 + 1077.80), $this->balance('MARIBANK'));
        $this->assertSame(2, BusinessTransaction::findOrFail($id)->walletEntries()->count());

        // Only price gold added: nothing bought, so nothing to pay
        $this->postJson("/api/v1/business/transactions/{$id}/add-gold", ['price_gold' => 5, 'balance_account' => 'MARIBANK'])
            ->assertStatus(422)->assertJsonValidationErrors(['balance_account']);
    }

    public function test_the_trade_lists_its_wallet_payments(): void
    {
        $id = $this->buy(['balance_account' => 'MARIBANK'])->json('id');

        $trade = collect($this->getJson('/api/v1/business/transactions')->assertOk()->json())->firstWhere('id', $id);
        $this->assertSame('MARIBANK', $trade['wallet_entries'][0]['account']);
        $this->assertEquals(5820.12, (float) $trade['wallet_entries'][0]['amount']);
    }

    public function test_deleting_a_pending_trade_refunds_the_wallet_but_a_sold_one_does_not(): void
    {
        $id = $this->buy(['balance_account' => 'MARIBANK'])->json('id');
        $this->deleteJson("/api/v1/business/transactions/{$id}")->assertOk();
        $this->assertEquals(0, $this->balance('MARIBANK'));

        $sold = $this->buy(['balance_account' => 'MARIBANK'])->json('id');
        $this->postJson("/api/v1/business/transactions/{$sold}/archive")->assertOk();
        $this->deleteJson("/api/v1/business/transactions/{$sold}")->assertOk();
        $this->assertEquals(-5820.12, $this->balance('MARIBANK'));
    }

    /** "₱ paid": 540KK bought at 0.17 $/M for ₱5,830, no gold paid out (Cost 0 G). */
    private function buyWithPesos(array $overrides = []): BusinessTransaction
    {
        $id = $this->buy(['cost_gold' => 0, 'cost_php' => 5830, 'cost_php_rate' => null, 'php_rate' => null, ...$overrides])
            ->assertCreated()->json('id');

        return BusinessTransaction::findOrFail($id);
    }

    public function test_peso_paid_gold_charges_the_pesos_or_the_dollar_value(): void
    {
        $this->buyWithPesos(['balance_account' => 'MARIBANK']);
        $this->assertEquals(-5830, $this->balance('MARIBANK'));

        // A dollar wallet pays the gold bought (the price gold) × cost rate: 540 × 0.17
        $this->buyWithPesos(['balance_account' => 'BINANCE']);
        $this->assertEquals(-91.80, $this->balance('BINANCE'));
    }

    public function test_selling_peso_paid_gold_takes_its_share_of_the_pesos(): void
    {
        $tx = $this->buyWithPesos(['price_rate' => 0.2, 'price_php' => 6858, 'php_rate' => 63.5]);
        $this->assertTrue($tx->costPaidInPhp());

        $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 270_000_000])->assertOk();

        $sold = BusinessTransaction::archived()->sole();
        $this->assertEquals(2915, (float) $sold->cost_php);
        $this->assertEquals(2915, (float) $tx->fresh()->cost_php);
        $this->assertEquals(0, (float) $tx->fresh()->cost_gold);
    }

    public function test_adding_to_peso_paid_gold_adds_pesos_not_cost_gold(): void
    {
        $tx = $this->buyWithPesos();

        $this->postJson("/api/v1/business/transactions/{$tx->id}/add-gold", [
            'price_gold' => 100_000_000, 'cost_php' => 1000, 'balance_account' => 'MARIBANK',
        ])->assertOk();
        $tx->refresh();
        $this->assertEquals(640_000_000, (float) $tx->price_gold);
        $this->assertEquals(6830, (float) $tx->cost_php);
        $this->assertEquals(-1000, $this->balance('MARIBANK'));

        $this->postJson("/api/v1/business/transactions/{$tx->id}/add-gold", ['cost_gold' => 5])
            ->assertStatus(422)->assertJsonValidationErrors(['cost_gold']);
        $gold = $this->buy()->json('id');
        $this->postJson("/api/v1/business/transactions/{$gold}/add-gold", ['cost_php' => 5])
            ->assertStatus(422)->assertJsonValidationErrors(['cost_php']);
    }

    public function test_peso_wallet_payments_show_as_business_expenses_in_daily(): void
    {
        $id = $this->buy(['balance_account' => 'MARIBANK'])->json('id');

        $daily = Transaction::with('category')->sole();
        $this->assertSame('business', $daily->scope);
        $this->assertSame('expense', $daily->type);
        $this->assertEquals(5820.12, (float) $daily->amount);
        $this->assertSame('Rucoy', $daily->category->name);
        // One Balance deduction, owned by the daily expense and linked to the trade
        $this->assertEquals(-5820.12, $this->balance('MARIBANK'));
        $this->assertSame($daily->id, BalanceEntry::sole()->transaction_id);
        $this->getJson('/api/v1/transactions?scope=business')->assertOk()->assertJsonPath('data.0.id', $daily->id);

        // A second purchase reuses the category; dollar wallets stay out of Daily (it's in ₱)
        $this->buy(['balance_account' => 'MARIBANK']);
        $this->buy(['balance_account' => 'BINANCE']);
        $this->assertSame(2, Transaction::count());
        $this->assertSame(1, Category::where('name', 'Rucoy')->count());

        // Deleting the pending trade removes its daily expense too
        $this->deleteJson("/api/v1/business/transactions/{$id}")->assertOk();
        $this->assertSame(1, Transaction::count());
    }
}
