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

/** "To Gold" on an account: the converted gold trade puts its gold in the stash and history. */
class ConvertToGoldTest extends TestCase
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

    public function test_converting_an_account_with_pricing_adds_its_gold_to_the_stash(): void
    {
        $account = RucoyAccount::create(['description' => '9/100 Gcash', 'email' => 'a@x.com', 'price' => 450_000_000, 'cost' => 400_000_000]);
        $tx = BusinessTransaction::create(['type' => 'account', 'account_id' => $account->id, 'price_gold' => null, 'amount' => 1, 'date' => '2026-11-04']);

        $this->putJson("/api/v1/business/transactions/{$tx->id}", [
            'type' => 'gold', 'account_id' => null, 'amount' => 1, 'date' => '2026-11-04', 'description' => '9/100 Gcash',
            'notes' => 'Converted from account: a@x.com', 'price_gold' => 450_000_000, 'cost_gold' => 400_000_000,
        ])->assertOk();

        $this->assertEquals(450_000_000, $this->stash());
        $this->assertEquals(450_000_000, $tx->fresh()->inventory_gold);
        $this->assertDatabaseHas('gold_logs', ['type' => 'add', 'description' => 'Converted: 9/100 Gcash']);

        // Editing it again doesn't add the gold twice
        $this->putJson("/api/v1/business/transactions/{$tx->id}", ['description' => '9/100 Gcash', 'amount' => 1, 'date' => '2026-11-04', 'type' => 'gold'])->assertOk();
        $this->assertEquals(450_000_000, $this->stash());
    }

    public function test_converting_an_account_without_pricing_adds_its_gold_too(): void
    {
        $this->postJson('/api/v1/business/transactions', [
            'type' => 'gold', 'amount' => 0.01, 'date' => '2026-11-04', 'description' => 'Leblanc 600',
            'notes' => 'Converted from account: b@x.com', 'price_gold' => 300_000_000, 'cost_gold' => 250_000_000, 'add_to_inventory' => true,
        ])->assertCreated();

        $this->assertEquals(300_000_000, $this->stash());
    }

    public function test_the_repair_migration_tracks_trades_converted_before_the_fix(): void
    {
        $old = BusinessTransaction::create(['type' => 'gold', 'price_gold' => 450_000_000, 'cost_gold' => 400_000_000, 'amount' => 1,
            'date' => '2026-11-04', 'description' => '9/100 Gcash', 'notes' => 'Converted from account: a@x.com']);
        $migration = require database_path('migrations/2026_11_05_000002_track_gold_trades_converted_from_accounts.php');

        $migration->up();
        $migration->up(); // running twice is harmless
        $this->assertEquals(450_000_000, $this->stash());
        $this->assertEquals(450_000_000, $old->fresh()->inventory_gold);

        $migration->down();
        $this->assertEquals(0, $this->stash());
        $this->assertNull($old->fresh()->inventory_gold);
        $this->assertSame(2, GoldLog::count());
    }
}
