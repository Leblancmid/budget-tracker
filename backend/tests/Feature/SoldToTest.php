<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Who a sale was sold to: set when marking it sold or selling gold, editable, suggested next time. */
class SoldToTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
    }

    private function account(): BusinessTransaction
    {
        return BusinessTransaction::create(['type' => 'account', 'amount' => 100, 'date' => '2026-11-01', 'price_php' => 1000, 'cost_php' => 900, 'description' => 'Lv 700 Dist']);
    }

    private function goldTrade(): BusinessTransaction
    {
        return BusinessTransaction::create(['type' => 'gold', 'amount' => 100, 'date' => '2026-11-01', 'price_gold' => 1000, 'cost_gold' => 800, 'price_php' => 1000, 'cost_php' => 800, 'profit_php' => 200]);
    }

    public function test_marking_sold_can_say_who_bought_it_and_restoring_clears_it(): void
    {
        $tx = $this->account();

        $this->postJson("/api/v1/business/transactions/{$tx->id}/archive", ['sold_to' => '  Kai (Discord)  '])
            ->assertOk()->assertJsonPath('sold_to', 'Kai (Discord)');
        $this->postJson("/api/v1/business/transactions/{$tx->id}/unarchive")->assertOk()->assertJsonPath('sold_to', null);

        // Optional: leaving it out still marks it sold
        $this->postJson("/api/v1/business/transactions/{$tx->id}/archive")->assertOk()->assertJsonPath('sold_to', null);
        $this->assertNotNull($tx->fresh()->archived_at);

        $this->postJson("/api/v1/business/transactions/{$this->account()->id}/archive", ['sold_to' => str_repeat('x', 101)])
            ->assertUnprocessable()->assertJsonValidationErrors('sold_to');
    }

    public function test_selling_gold_records_the_buyer_on_the_sold_part_only(): void
    {
        $tx = $this->goldTrade();

        $res = $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 400, 'sold_to' => 'Mia'])->assertOk();
        $this->assertSame('Mia', $res->json('sold.sold_to'));
        $this->assertNull($res->json('remaining.sold_to'));

        $full = $this->goldTrade();
        $this->postJson("/api/v1/business/transactions/{$full->id}/sell", ['amount' => 1000, 'sold_to' => 'Kai'])->assertOk()->assertJsonPath('sold.sold_to', 'Kai');
    }

    public function test_the_buyer_can_be_corrected_and_past_buyers_are_suggested_newest_first(): void
    {
        $a = $this->account();
        $this->postJson("/api/v1/business/transactions/{$a->id}/archive", ['sold_to' => 'Kia'])->assertOk();
        $this->travel(1)->minutes();
        $b = $this->account();
        $this->postJson("/api/v1/business/transactions/{$b->id}/archive", ['sold_to' => 'Mia'])->assertOk();
        $this->travel(1)->minutes();
        $c = $this->account();
        $this->postJson("/api/v1/business/transactions/{$c->id}/archive", ['sold_to' => 'Mia'])->assertOk();

        $this->assertSame(['Mia', 'Kia'], $this->getJson('/api/v1/business/transactions/buyers')->assertOk()->json());

        $this->putJson("/api/v1/business/transactions/{$a->id}", ['sold_to' => 'Kai'])->assertOk();
        $this->assertSame('Kai', $a->fresh()->sold_to);
    }

    public function test_marking_an_account_sold_records_the_buyer_on_its_sale_and_its_card(): void
    {
        // As the Sales page does: the account, then its sale linked to it
        $id = $this->postJson('/api/v1/rucoy/accounts', ['description' => 'Lv 650 Melee', 'email' => 'x@example.com', 'level' => 650])->assertCreated()->json('id');
        BusinessTransaction::create(['type' => 'account', 'account_id' => $id, 'amount' => 100, 'date' => '2026-11-01', 'price_php' => 1000, 'cost_php' => 900]);

        $this->postJson("/api/v1/rucoy/accounts/{$id}/archive", ['sold_to' => 'Noor'])->assertOk()->assertJsonPath('sold_to', 'Noor');
        $this->assertSame('Noor', collect($this->getJson('/api/v1/rucoy/accounts/archived')->json())->firstWhere('id', $id)['sold_to']);

        $this->postJson("/api/v1/rucoy/accounts/{$id}/unarchive")->assertOk();
        $this->assertNull(BusinessTransaction::where('account_id', $id)->value('sold_to'));
    }

    public function test_only_people_with_trading_see_buyers(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->getJson('/api/v1/business/transactions/buyers')->assertForbidden();
    }
}
