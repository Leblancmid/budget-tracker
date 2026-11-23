<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Money in stock: unsold accounts and gold, their cost, age and likely value. */
class StockAgingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-23 12:00', 'Asia/Manila'));
        Sanctum::actingAs(User::factory()->create(['role' => 'trader']));
    }

    private function day(int $ago): string
    {
        return now('Asia/Manila')->subDays($ago)->toDateString();
    }

    /** A sold account (for the price guide): bought $boughtAgo days before it sold */
    private function soldAccount(string $name, float $price, float $cost, int $daysToSell = 10): void
    {
        $a = RucoyAccount::create(['description' => $name, 'email' => uniqid() . '@x.com', 'listed_at' => now()->subDays(5 + $daysToSell)]);
        $a->forceFill(['archived_at' => now()->subDays(5)])->save();
        BusinessTransaction::create(['type' => 'account', 'account_id' => $a->id, 'description' => $name, 'price_php' => $price, 'cost_php' => $cost, 'amount' => 1, 'date' => $this->day(5 + $daysToSell)])
            ->forceFill(['archived_at' => now()->subDays(5)])->save();
    }

    private function forSale(string $name, int $boughtAgo, ?float $cost, ?float $price = null): BusinessTransaction
    {
        $a = RucoyAccount::create(['description' => $name, 'email' => uniqid() . '@x.com']);

        return BusinessTransaction::create(['type' => 'account', 'account_id' => $a->id, 'description' => $name, 'cost_php' => $cost, 'price_php' => $price, 'amount' => 1, 'date' => $this->day($boughtAgo)]);
    }

    public function test_unsold_stock_with_its_age_cost_and_likely_value(): void
    {
        foreach ([4000, 4200, 4400] as $p) {
            $this->soldAccount('Lv 650 Melee', $p, 3000);
        }
        // Recent gold sales for the gold rate: $0.20 per 1M at ₱58
        foreach (range(1, 5) as $i) {
            BusinessTransaction::create(['type' => 'gold', 'description' => "Sold {$i}", 'price_gold' => 100_000_000, 'price_rate' => 0.20, 'php_rate' => 58, 'price_php' => 1160, 'cost_php' => 1000, 'amount' => 1, 'date' => $this->day(3)])
                ->forceFill(['archived_at' => now()->subDays(3)])->save();
        }

        $this->forSale('Lv 652 Melee', 70, 3100);            // no price yet: the guide (similar sold for ₱4,200)
        $this->forSale('Lv 900 Magic', 20, 9000, 12000);     // your price
        $this->forSale('Mystery', 3, 500);                   // nothing to go on
        BusinessTransaction::create(['type' => 'gold', 'description' => '500KK', 'price_gold' => 500_000_000, 'cost_php' => 5000, 'amount' => 1, 'date' => $this->day(40)]);
        BusinessTransaction::create(['type' => 'gold', 'system_key' => 'middleman_fee', 'description' => 'Fees', 'price_gold' => 1, 'amount' => 1, 'date' => $this->day(90)]); // not stock

        $res = $this->getJson('/api/v1/business/stock')->assertOk()->json();

        // Oldest first
        $this->assertSame(['Lv 652 Melee', '500KK', 'Lv 900 Magic', 'Mystery'], array_column($res['items'], 'name'));
        $this->assertSame([70, 40, 20, 3], array_column($res['items'], 'held_days'));
        $this->assertSame([4200, 5800, 12000, null], array_map(fn ($v) => $v === null ? null : (int) round($v), array_column($res['items'], 'value_php')));
        $this->assertSame(['guide', 'guide', 'price', null], array_column($res['items'], 'value_from'));
        $this->assertEquals(10, $res['items'][0]['usual_days']); // similar ones sold in 10 days

        $this->assertSame(4, $res['totals']['count']);
        $this->assertEquals(17600, $res['totals']['cost_php']);
        $this->assertEquals(22000, $res['totals']['value_php']);
        $this->assertEquals(4200 - 3100 + 5800 - 5000 + 12000 - 9000, $res['totals']['profit_php']);
        $this->assertSame([1, 70, 1], [$res['totals']['unvalued'], $res['totals']['oldest_days'], $res['totals']['overdue']]);

        // Money by age
        $this->assertSame(
            [['fresh', 1, 500], ['weeks', 1, 9000], ['month', 1, 5000], ['old', 1, 3100]],
            array_map(fn ($b) => [$b['key'], $b['count'], (int) $b['cost_php']], $res['buckets']),
        );
    }

    public function test_nothing_in_stock(): void
    {
        $res = $this->getJson('/api/v1/business/stock')->assertOk()->json();
        $this->assertSame([[], 0, null], [$res['items'], $res['totals']['count'], $res['totals']['oldest_days']]);
    }

    public function test_only_traders_see_it(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->getJson('/api/v1/business/stock')->assertForbidden();
    }
}
