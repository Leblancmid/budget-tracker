<?php

namespace Tests\Feature;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BalanceTransfer;
use App\Models\User;
use App\Services\BalanceInterest;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BalanceTransferAndInterestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
        BalanceAccount::create(['code' => 'GCASH', 'name' => 'GCash', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'smartphone']);
    }

    private function balance(string $code): float
    {
        return BalanceInterest::balanceAt($code, '2999-12-31');
    }

    private function deposit(string $code, float $amount, string $date = '2026-11-01'): void
    {
        BalanceEntry::create(['account' => $code, 'type' => 'add', 'amount' => $amount, 'date' => $date]);
    }

    public function test_transfer_moves_money_with_an_optional_fee(): void
    {
        $this->deposit('MARIBANK', 10_000);

        $id = $this->postJson('/api/v1/master/balance-transfers', [
            'from_account' => 'MARIBANK', 'to_account' => 'GCASH', 'amount' => 3000, 'fee' => 15, 'date' => '2026-11-04', 'note' => 'load',
        ])->assertCreated()->assertJsonPath('received', '3000.00')->json('id');

        $this->assertEquals(10_000 - 3000 - 15, $this->balance('MARIBANK'));
        $this->assertEquals(3000, $this->balance('GCASH'));
        $this->assertSame(3, BalanceEntry::where('balance_transfer_id', $id)->count());
        $this->assertDatabaseHas('balance_entries', ['account' => 'GCASH', 'description' => 'Transfer from Maribank · load']);

        // Deleting any side undoes the whole transfer
        $in = BalanceEntry::where('balance_transfer_id', $id)->where('account', 'GCASH')->sole();
        $this->putJson("/api/v1/master/balance-entries/{$in->id}", ['account' => 'GCASH', 'type' => 'add', 'amount' => 1, 'date' => '2026-11-04'])->assertStatus(422);
        $this->deleteJson("/api/v1/master/balance-entries/{$in->id}")->assertOk();
        $this->assertEquals(10_000, $this->balance('MARIBANK'));
        $this->assertEquals(0, $this->balance('GCASH'));
        $this->assertSame(0, BalanceTransfer::count());
    }

    public function test_transfer_across_currencies_needs_what_arrived(): void
    {
        $this->deposit('PAYPAL', 100);
        $payload = ['from_account' => 'PAYPAL', 'to_account' => 'GCASH', 'amount' => 50, 'date' => '2026-11-04'];

        $this->postJson('/api/v1/master/balance-transfers', $payload)->assertStatus(422)->assertJsonValidationErrors(['received']);
        $this->postJson('/api/v1/master/balance-transfers', [...$payload, 'received' => 2850])->assertCreated();

        $this->assertEquals(50, $this->balance('PAYPAL'));
        $this->assertEquals(2850, $this->balance('GCASH'));
    }

    public function test_transfer_is_validated(): void
    {
        $this->postJson('/api/v1/master/balance-transfers', ['from_account' => 'GCASH', 'to_account' => 'GCASH', 'amount' => 1, 'date' => '2026-11-04'])
            ->assertStatus(422)->assertJsonValidationErrors(['to_account']);
        $this->postJson('/api/v1/master/balance-transfers', ['from_account' => 'NOPE', 'to_account' => 'GCASH', 'amount' => 0, 'date' => 'x'])
            ->assertStatus(422)->assertJsonValidationErrors(['from_account', 'amount', 'date']);
    }

    public function test_interest_is_credited_daily_after_tax_and_catches_up(): void
    {
        // ₱100,000 at 3.65% a year = ₱10 a day, minus 20% tax = ₱8.00
        $this->travelTo(CarbonImmutable::parse('2026-11-04 09:00', 'Asia/Manila'));
        $this->deposit('MARIBANK', 100_000, '2026-11-01');
        $id = BalanceAccount::where('code', 'MARIBANK')->value('id');
        $this->putJson("/api/v1/master/balance-accounts/{$id}", ['interest_rate' => 3.65])->assertOk()
            ->assertJsonPath('interest_credited_through', '2026-11-03');

        // Nothing until today is over
        $this->artisan('balance:interest')->assertSuccessful();
        $this->assertSame(0, BalanceEntry::where('kind', 'interest')->count());

        // Three days later (PC was off): Nov 4, 5 and 6 are credited, each once
        $this->travelTo(CarbonImmutable::parse('2026-11-07 08:00', 'Asia/Manila'));
        $this->artisan('balance:interest')->assertSuccessful();
        $this->artisan('balance:interest')->assertSuccessful();

        $credits = BalanceEntry::where('kind', 'interest')->orderBy('date')->get();
        $this->assertSame(['2026-11-04', '2026-11-05', '2026-11-06'], $credits->map(fn ($e) => $e->date->format('Y-m-d'))->all());
        $this->assertEquals(8.00, (float) $credits[0]->amount);
        $this->assertStringContainsString('3.65% a year, 20% tax withheld', $credits[0]->description);
        $this->assertEquals(100_024, $this->balance('MARIBANK'));
    }

    public function test_interest_is_optional_and_can_be_switched_off(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-04 09:00', 'Asia/Manila'));
        $this->deposit('GCASH', 50_000);
        $id = BalanceAccount::where('code', 'GCASH')->value('id');

        // No rate: never earns
        $this->travelTo(CarbonImmutable::parse('2026-11-10 09:00', 'Asia/Manila'));
        $this->artisan('balance:interest')->assertSuccessful();
        $this->assertSame(0, BalanceEntry::where('kind', 'interest')->count());

        $this->putJson("/api/v1/master/balance-accounts/{$id}", ['interest_rate' => 2, 'interest_tax' => 0])->assertOk();
        $this->putJson("/api/v1/master/balance-accounts/{$id}", ['interest_rate' => null])->assertOk()
            ->assertJsonPath('interest_rate', null)->assertJsonPath('interest_credited_through', null);
        $this->putJson("/api/v1/master/balance-accounts/{$id}", ['interest_rate' => 101])->assertStatus(422);
    }
}
