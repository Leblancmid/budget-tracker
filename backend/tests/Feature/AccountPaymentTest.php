<?php

namespace Tests\Feature;

use App\Models\AccountPayment;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountPaymentTest extends TestCase
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

    /** A pending gold purchase, added to the stash like the Add Gold dialog does. */
    private function goldTrade(float $gold, float $costRate, float $phpRate): BusinessTransaction
    {
        $costPhp = round($gold / 1_000_000 * $costRate * $phpRate, 2);
        $id = $this->postJson('/api/v1/business/transactions', [
            'type' => 'gold', 'description' => "Gold @ {$costRate}", 'date' => '2026-11-01',
            'price_gold' => $gold, 'cost_gold' => $gold,
            'cost_rate' => $costRate, 'cost_php_rate' => $phpRate, 'php_rate' => $phpRate,
            'cost_php' => $costPhp, 'amount' => 0.01, 'add_to_inventory' => true,
        ])->assertCreated()->json('id');

        return BusinessTransaction::findOrFail($id);
    }

    /** A 1B account whose typed cost rates differ from the gold actually used. */
    private function account(): RucoyAccount
    {
        $id = $this->postJson('/api/v1/rucoy/accounts', [
            'description' => 'Lv 721 Distance', 'email' => 'acc@example.com', 'cost' => 1_000_000_000,
        ])->assertCreated()->json('id');
        $this->postJson('/api/v1/business/transactions', [
            'type' => 'account', 'account_id' => $id, 'date' => '2026-11-02', 'amount' => 0.01,
            'cost_rate' => 0.2, 'cost_php_rate' => 60, 'php_rate' => 60,
        ])->assertCreated();

        return RucoyAccount::findOrFail($id);
    }

    private function accountCostPhp(RucoyAccount $a): float
    {
        return (float) BusinessTransaction::where('type', 'account')->where('account_id', $a->id)->value('cost_php');
    }

    private function payWithGold(RucoyAccount $a, BusinessTransaction $trade, float $gold)
    {
        return $this->postJson("/api/v1/rucoy/accounts/{$a->id}/payments", [
            'method' => 'gold_trade', 'source_trade_id' => $trade->id, 'gold' => $gold, 'date' => '2026-11-03',
        ]);
    }

    public function test_two_gold_trades_at_different_rates_give_the_exact_cost(): void
    {
        $a = $this->goldTrade(540_000_000, 0.17, 63.4);   // ₱5,820.12
        $b = $this->goldTrade(600_000_000, 0.1777, 62.53); // ₱6,666.95
        $account = $this->account();
        $this->assertEquals(1_140_000_000, $this->stash());

        $this->payWithGold($account, $a, 540_000_000)->assertCreated()->assertJsonPath('cost_php', 5820.12);
        $this->payWithGold($account, $b, 460_000_000)->assertCreated()->assertJsonPath('cost_php', 5111.33);

        // Exact sum of both payments, not 1B at the typed .2 × 60
        $this->assertEquals(10931.45, $this->accountCostPhp($account));

        // Trade A was used up and removed; trade B keeps the rest, ₱ at its own rate
        $this->assertNull(BusinessTransaction::find($a->id));
        $b->refresh();
        $this->assertEquals(140_000_000, (float) $b->price_gold);
        $this->assertEquals(140_000_000, (float) $b->cost_gold);
        $this->assertEquals(1555.62, (float) $b->cost_php);

        // The paid gold left the stash; no sale was recorded on the trades
        $this->assertEquals(140_000_000, $this->stash());
        $this->assertSame(0, BusinessTransaction::where('type', 'gold')->whereNotNull('archived_at')->count());

        $this->getJson('/api/v1/rucoy/accounts')->assertOk()
            ->assertJsonPath('0.paid_gold', 1_000_000_000)
            ->assertJsonPath('0.paid_cost_php', 10931.45);
    }

    public function test_unpaid_gold_uses_the_typed_rate_until_paid(): void
    {
        $b = $this->goldTrade(600_000_000, 0.1777, 62.53);
        $account = $this->account();

        $this->payWithGold($account, $b, 460_000_000)->assertCreated();
        // 460M exact (5,111.33) + 540M at the typed .2 × 60 (6,480)
        $this->assertEquals(11591.33, $this->accountCostPhp($account));

        // Editing the account afterwards can't overwrite the exact paid cost
        $tx = BusinessTransaction::where('type', 'account')->where('account_id', $account->id)->first();
        $this->putJson("/api/v1/business/transactions/{$tx->id}", ['cost_php' => 99999])->assertOk();
        $this->assertEquals(11591.33, $this->accountCostPhp($account));
    }

    public function test_removing_a_payment_puts_everything_back(): void
    {
        $a = $this->goldTrade(540_000_000, 0.17, 63.4);
        $account = $this->account();
        $paymentId = $this->payWithGold($account, $a, 540_000_000)->json('id');
        $this->assertNull(BusinessTransaction::find($a->id));

        $this->deleteJson("/api/v1/rucoy/accounts/{$account->id}/payments/{$paymentId}")->assertOk();

        // The used-up trade comes back as a pending trade with the same gold, cost and rates
        $back = BusinessTransaction::where('type', 'gold')->whereNull('archived_at')->sole();
        $this->assertEquals(540_000_000, (float) $back->price_gold);
        $this->assertEquals(5820.12, (float) $back->cost_php);
        $this->assertEquals(0.17, (float) $back->cost_rate);
        $this->assertEquals(540_000_000, $this->stash());

        // No payments left: back to 1B at the typed .2 × 60
        $this->assertEquals(12000.0, $this->accountCostPhp($account));
        $this->assertSame(0, AccountPayment::count());
    }

    public function test_partially_used_trade_gets_its_gold_back(): void
    {
        $b = $this->goldTrade(600_000_000, 0.1777, 62.53);
        $account = $this->account();
        $paymentId = $this->payWithGold($account, $b, 460_000_000)->json('id');

        $this->deleteJson("/api/v1/rucoy/accounts/{$account->id}/payments/{$paymentId}")->assertOk();

        $b->refresh();
        $this->assertEquals(600_000_000, (float) $b->price_gold);
        $this->assertEquals(6666.95, (float) $b->cost_php);
        $this->assertEquals(600_000_000, $this->stash());
    }

    public function test_cash_from_a_wallet_is_deducted_and_restored(): void
    {
        $account = $this->account();

        // PHP wallet: the cash is the ₱ cost
        $id = $this->postJson("/api/v1/rucoy/accounts/{$account->id}/payments", [
            'method' => 'cash', 'balance_account' => 'MAYA', 'cash_amount' => 1500, 'gold' => 100_000_000, 'date' => '2026-11-03',
        ])->assertCreated()->assertJsonPath('cost_php', 1500)->json('id');
        $this->assertDatabaseHas('balance_entries', ['account' => 'MAYA', 'type' => 'sell', 'amount' => 1500]);

        // USD wallet: needs the ₱ rate
        $this->postJson("/api/v1/rucoy/accounts/{$account->id}/payments", [
            'method' => 'cash', 'balance_account' => 'PAYPAL', 'cash_amount' => 20, 'gold' => 100_000_000, 'date' => '2026-11-03',
        ])->assertStatus(422)->assertJsonValidationErrors(['php_rate']);
        $this->postJson("/api/v1/rucoy/accounts/{$account->id}/payments", [
            'method' => 'cash', 'balance_account' => 'PAYPAL', 'cash_amount' => 20, 'php_rate' => 58, 'gold' => 100_000_000, 'date' => '2026-11-03',
        ])->assertCreated()->assertJsonPath('cost_php', 1160);

        $this->deleteJson("/api/v1/rucoy/accounts/{$account->id}/payments/{$id}")->assertOk();
        $this->assertDatabaseMissing('balance_entries', ['account' => 'MAYA', 'amount' => 1500]);
    }

    public function test_payments_are_validated(): void
    {
        $small = $this->goldTrade(100_000_000, 0.17, 63.4);
        $account = $this->account();

        // More than the trade has
        $this->payWithGold($account, $small, 200_000_000)->assertStatus(422)->assertJsonValidationErrors(['gold']);

        // More than is owed on the account (1B)
        $big = $this->goldTrade(2_000_000_000, 0.17, 63.4);
        $this->payWithGold($account, $big, 1_500_000_000)->assertStatus(422)->assertJsonValidationErrors(['gold']);

        // A trade without cost rates has no known ₱ cost
        $noRates = BusinessTransaction::create(['type' => 'gold', 'price_gold' => 100, 'cost_gold' => 100, 'amount' => 0.01, 'date' => '2026-11-01']);
        $this->payWithGold($account, $noRates, 50)->assertStatus(422)->assertJsonValidationErrors(['source_trade_id']);

        $this->postJson("/api/v1/rucoy/accounts/{$account->id}/payments", ['method' => 'card'])
            ->assertStatus(422)->assertJsonValidationErrors(['method', 'gold', 'date']);

        // A payment can only be removed through its own account
        $other = RucoyAccount::create(['description' => 'Other', 'email' => 'o@example.com']);
        $paymentId = $this->payWithGold($account, $small, 50_000_000)->assertCreated()->json('id');
        $this->deleteJson("/api/v1/rucoy/accounts/{$other->id}/payments/{$paymentId}")->assertNotFound();
    }

    public function test_daily_only_users_cannot_pay(): void
    {
        $account = $this->account();
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->postJson("/api/v1/rucoy/accounts/{$account->id}/payments", [])->assertForbidden();
    }

    public function test_gold_trade_price_and_cost_are_locked_on_edit(): void
    {
        $trade = $this->goldTrade(540_000_000, 0.17, 63.4);

        $this->putJson("/api/v1/business/transactions/{$trade->id}", ['price_gold' => 600_000_000, 'cost_gold' => 1])
            ->assertStatus(422)->assertJsonValidationErrors(['price_gold', 'cost_gold']);

        // Re-sending the same gold with new rates is fine
        $this->putJson("/api/v1/business/transactions/{$trade->id}", [
            'price_gold' => 540_000_000, 'cost_gold' => 540_000_000, 'price_rate' => 0.21,
        ])->assertOk();
        $this->assertEquals(540_000_000, $this->stash());
    }
}
