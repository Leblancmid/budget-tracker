<?php

namespace Tests\Feature;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Credit cards as Balance accounts: a limit, no interest, and a balance that goes below zero. */
class CreditCardAccountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    private function card(array $extra = []): array
    {
        return $this->postJson('/api/v1/master/balance-accounts', [
            'name' => 'BPI Visa', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'credit-card',
            'kind' => 'credit', 'credit_limit' => 50000, ...$extra,
        ])->assertCreated()->json();
    }

    public function test_a_credit_card_is_created_with_its_limit_and_no_interest(): void
    {
        $card = $this->card(['interest_rate' => 4]);

        $this->assertSame('credit', $card['kind']);
        $this->assertEquals(50000, $card['credit_limit']);
        $this->assertNull($card['interest_rate']);
        $this->assertNull($card['interest_credited_through']);
    }

    public function test_a_credit_card_needs_a_positive_limit_and_a_known_kind(): void
    {
        $base = ['name' => 'Card', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'credit-card'];
        $this->postJson('/api/v1/master/balance-accounts', [...$base, 'kind' => 'credit'])
            ->assertStatus(422)->assertJsonValidationErrors('credit_limit');
        $this->postJson('/api/v1/master/balance-accounts', [...$base, 'kind' => 'credit', 'credit_limit' => 0])
            ->assertStatus(422)->assertJsonValidationErrors('credit_limit');
        $this->postJson('/api/v1/master/balance-accounts', [...$base, 'kind' => 'loan'])
            ->assertStatus(422)->assertJsonValidationErrors('kind');
    }

    public function test_wallets_stay_wallets_by_default_and_ignore_a_limit(): void
    {
        $wallet = $this->postJson('/api/v1/master/balance-accounts', [
            'name' => 'GCash', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'smartphone', 'credit_limit' => 999,
        ])->assertCreated()->json();

        $this->assertSame('wallet', BalanceAccount::find($wallet['id'])->kind);
        $this->assertNull(BalanceAccount::find($wallet['id'])->credit_limit);
    }

    public function test_spending_on_a_card_shows_as_owed_and_paying_it_brings_it_back(): void
    {
        $card = $this->card();

        // Spend 12,000 on the card, then pay 5,000 of the bill from the bank
        BalanceEntry::create(['account' => $card['code'], 'type' => 'sell', 'amount' => 12000, 'date' => '2026-11-02']);
        BalanceEntry::create(['account' => 'MARIBANK', 'type' => 'add', 'amount' => 30000, 'date' => '2026-11-01']);
        $this->postJson('/api/v1/master/balance-transfers', [
            'from_account' => 'MARIBANK', 'to_account' => $card['code'], 'amount' => 5000, 'date' => '2026-11-05',
        ])->assertCreated();

        $accounts = collect($this->getJson('/api/v1/master/balance-accounts')->assertOk()->json())->keyBy('code');
        $this->assertEquals(-7000, $accounts[$card['code']]['balance']);
        $this->assertEquals(25000, $accounts['MARIBANK']['balance']);
    }

    public function test_switching_a_card_back_to_a_wallet_drops_the_limit(): void
    {
        $card = $this->card();

        $this->putJson("/api/v1/master/balance-accounts/{$card['id']}", ['kind' => 'wallet'])->assertOk()
            ->assertJsonPath('kind', 'wallet')->assertJsonPath('credit_limit', null);

        // And a card can't be given interest by editing it
        $this->putJson("/api/v1/master/balance-accounts/{$card['id']}", ['kind' => 'credit', 'credit_limit' => 30000])->assertOk();
        $this->putJson("/api/v1/master/balance-accounts/{$card['id']}", ['interest_rate' => 5])->assertOk()
            ->assertJsonPath('interest_rate', null);
    }
}
