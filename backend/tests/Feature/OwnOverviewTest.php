<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Master → Overview for someone who isn't an admin: their own expenses and the sales they made,
 * never the business's wallets, gold or anyone else's numbers. ("Today" is 13 Nov 2026, Manila.)
 */
class OwnOverviewTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $sam;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-13 10:00', 'Asia/Manila'));
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->sam = User::factory()->create(['role' => 'trader', 'modules' => ['daily', 'trading', 'master']]);
    }

    private function daily(User $u, string $type, float $amount, string $date): void
    {
        Sanctum::actingAs($u);
        $cat = Category::firstOrCreate(['user_id' => $u->id, 'name' => 'Misc ' . $type, 'type' => $type]);
        Transaction::create(['user_id' => $u->id, 'category_id' => $cat->id, 'type' => $type, 'amount' => $amount, 'date' => $date]);
    }

    /** A sale added by $addedBy and (if given) marked sold by $soldBy, at this Manila time. */
    private function sale(User $addedBy, ?User $soldBy, float $price, float $cost, string $soldAt = '2026-11-05 12:00'): BusinessTransaction
    {
        Sanctum::actingAs($addedBy);
        $tx = BusinessTransaction::create(['type' => 'gold', 'amount' => 1, 'date' => '2026-10-01', 'price_php' => $price, 'cost_php' => $cost]);
        if ($soldBy) {
            Sanctum::actingAs($soldBy);
            $this->travelTo(CarbonImmutable::parse($soldAt, 'Asia/Manila'));
            $tx->update(['archived_at' => now()]);
            $this->travelTo(CarbonImmutable::parse('2026-11-13 10:00', 'Asia/Manila'));
        }

        return $tx;
    }

    public function test_a_non_admin_sees_only_their_own_expenses_and_sales(): void
    {
        $this->daily($this->sam, 'income', 1000, '2026-11-02');
        $this->daily($this->sam, 'expense', 300, '2026-10-15');
        $this->daily($this->admin, 'expense', 5000, '2026-11-03');      // the admin's: not Sam's

        $this->sale($this->sam, $this->sam, 900, 600);                  // Sam's sale: +300
        $this->sale($this->admin, $this->sam, 500, 400, '2026-10-20');  // added by the admin, sold by Sam: +100
        $this->sale($this->sam, $this->admin, 2000, 1000);              // added by Sam, sold by the admin: not Sam's
        $this->sale($this->sam, null, 700, 100);                        // not sold yet

        Sanctum::actingAs($this->sam);
        $s = $this->getJson('/api/v1/master/dashboard')->assertOk()->json();

        $this->assertSame('own', $s['scope']);
        $this->assertEquals(400, $s['business_profit']);
        $this->assertEquals(700, $s['daily_net']);
        $this->assertEquals(1100, $s['overall_profit']);
        $this->assertEquals(2, $s['sales_count']);
        $this->assertEquals(1, $s['monthly_sales_count']);
        $this->assertEquals(300, $s['monthly_business_profit']);
        $this->assertEquals(1000, $s['monthly_daily_net']);
        // Nothing of the business's: no wallets, gold or listed accounts
        foreach (['balance_php_total', 'balance_usd_total', 'gold_stash', 'total_price', 'kks_gold', 'account_count'] as $shared) {
            $this->assertArrayNotHasKey($shared, $s);
        }

        $months = collect($this->getJson('/api/v1/master/dashboard/trend')->assertOk()->json('months'))->keyBy('month');
        $this->assertEquals(300, $months['2026-11']['business_profit']);
        $this->assertEquals(100, $months['2026-10']['business_profit']);
        $this->assertEquals(1000, $months['2026-11']['daily_income']);
        $this->assertEquals(0, $months['2026-11']['daily_expense']);
        $this->assertEquals(300, $months['2026-10']['daily_expense']);
        $this->assertEquals(0, $months['2026-11']['php_balance']);
    }

    public function test_an_admin_still_sees_the_whole_business(): void
    {
        $this->sale($this->sam, $this->sam, 900, 600);
        $this->sale($this->admin, $this->admin, 2000, 1000);

        Sanctum::actingAs($this->admin);
        $s = $this->getJson('/api/v1/master/dashboard')->assertOk()->assertJsonPath('scope', 'everyone')->json();
        $this->assertEquals(1300, $s['business_profit']);
        $this->assertArrayHasKey('balance_php_total', $s);
    }
}
