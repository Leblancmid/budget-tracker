<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CashDealTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    private function cashAccount(array $overrides = []): RucoyAccount
    {
        $id = $this->postJson('/api/v1/rucoy/accounts', [
            'description' => 'Lv 650 Melee', 'email' => 'acc@example.com',
            'deal_type' => 'cash', 'cash_currency' => 'PHP', 'price_cash' => 8000, 'cost_cash' => 5000,
            ...$overrides,
        ])->assertCreated()->assertJsonPath('deal_type', 'cash')->json('id');

        return RucoyAccount::findOrFail($id);
    }

    private function priceRow(RucoyAccount $a, array $values = []): BusinessTransaction
    {
        $this->postJson('/api/v1/business/transactions', [
            'type' => 'account', 'account_id' => $a->id, 'date' => '2026-11-04', 'amount' => 0.01,
            // Whatever the browser sends, the server works the ₱ out from the cash amounts
            'price_php' => 1, 'cost_php' => 1, 'price_rate' => 0.2, 'cost_rate' => 0.2,
            ...$values,
        ])->assertCreated();

        return BusinessTransaction::where('account_id', $a->id)->sole();
    }

    public function test_peso_deal_uses_the_cash_amounts(): void
    {
        $tx = $this->priceRow($this->cashAccount());

        $this->assertEquals(8000, (float) $tx->price_php);
        $this->assertEquals(5000, (float) $tx->cost_php);
        $this->assertEquals(3000, (float) $tx->profit_php);
        $this->assertNull($tx->price_rate);
    }

    public function test_dollar_deal_converts_each_side_at_its_own_rate(): void
    {
        $account = $this->cashAccount(['cash_currency' => 'USD', 'price_cash' => 150, 'cost_cash' => 100]);
        $tx = $this->priceRow($account, ['php_rate' => 58, 'cost_php_rate' => 57]);

        $this->assertEquals(8700, (float) $tx->price_php);
        $this->assertEquals(5700, (float) $tx->cost_php);
        $this->assertEquals(3000, (float) $tx->profit_php);
    }

    public function test_editing_the_cash_amounts_re_prices_the_sale(): void
    {
        $account = $this->cashAccount();
        $tx = $this->priceRow($account);

        $this->putJson("/api/v1/rucoy/accounts/{$account->id}", ['price_cash' => 9000])->assertOk();

        $this->assertEquals(4000, (float) $tx->fresh()->profit_php);
    }

    public function test_net_worth_counts_accounts_bought_with_cash_at_their_peso_cost(): void
    {
        // Cash deal (₱5,000) and a gold deal paid in ₱ (0 G cost, ₱5,700) count in ₱
        $this->priceRow($this->cashAccount());
        $peso = RucoyAccount::create(['description' => 'Lv 583', 'email' => 'p@example.com', 'price' => 700_000_000, 'cost' => 0]);
        $this->priceRow($peso, ['cost_php' => 5700, 'cost_rate' => 0.19]);
        // A gold-cost account is already counted in G, not here
        $gold = RucoyAccount::create(['description' => 'Lv 621', 'email' => 'g@example.com', 'cost' => 1_000_000_000]);
        $this->priceRow($gold, ['cost_php' => 12000]);

        $this->getJson('/api/v1/master/dashboard')->assertOk()
            ->assertJsonPath('accounts_cash_cost_php', 10700)
            ->assertJsonPath('total_price', 1_000_000_000);
    }

    public function test_cash_currency_is_required_and_validated(): void
    {
        $this->postJson('/api/v1/rucoy/accounts', ['description' => 'X', 'email' => 'x@example.com', 'deal_type' => 'cash'])
            ->assertStatus(422)->assertJsonValidationErrors(['cash_currency']);
        $this->postJson('/api/v1/rucoy/accounts', ['description' => 'X', 'email' => 'x@example.com', 'deal_type' => 'barter', 'cash_currency' => 'EUR'])
            ->assertStatus(422)->assertJsonValidationErrors(['deal_type', 'cash_currency']);
    }

    public function test_a_deal_is_gold_or_cash_never_both(): void
    {
        // Switching to cash clears the gold price, so selling it adds nothing to the stash
        $id = $this->postJson('/api/v1/rucoy/accounts', ['description' => 'Gold one', 'email' => 'g@example.com', 'price' => 700_000_000])
            ->assertCreated()->assertJsonPath('deal_type', 'gold')->json('id');
        $this->putJson("/api/v1/rucoy/accounts/{$id}", ['deal_type' => 'cash', 'cash_currency' => 'PHP', 'price_cash' => 8000])
            ->assertOk()->assertJsonPath('price', null);

        $this->postJson("/api/v1/rucoy/accounts/{$id}/archive")->assertOk();
        $this->assertEquals(0, (float) Gold::sum('amount'));
    }

    public function test_cash_deals_take_no_gold_payments_and_paid_accounts_stay_gold(): void
    {
        $cash = $this->cashAccount();
        $this->postJson("/api/v1/rucoy/accounts/{$cash->id}/payments", [
            'method' => 'cash', 'balance_account' => 'MAYA', 'cash_amount' => 100, 'gold' => 1, 'date' => '2026-11-04',
        ])->assertStatus(422)->assertJsonValidationErrors(['method']);

        $gold = RucoyAccount::create(['description' => 'Paid', 'email' => 'p@example.com', 'cost' => 1_000_000]);
        $this->postJson("/api/v1/rucoy/accounts/{$gold->id}/payments", [
            'method' => 'cash', 'balance_account' => 'MAYA', 'cash_amount' => 100, 'gold' => 1_000_000, 'date' => '2026-11-04',
        ])->assertCreated();
        $this->putJson("/api/v1/rucoy/accounts/{$gold->id}", ['deal_type' => 'cash', 'cash_currency' => 'PHP'])
            ->assertStatus(422)->assertJsonValidationErrors(['deal_type']);
    }
}
