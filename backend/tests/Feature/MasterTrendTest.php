<?php

namespace Tests\Feature;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\Category;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Master → Overview charts ("today" is Tue 10 Nov 2026, Manila): 12 Manila months, Dec 2025 – Nov 2026. */
class MasterTrendTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
        Sanctum::actingAs($this->admin);
        $this->travelTo(CarbonImmutable::parse('2026-11-10 10:00', 'Asia/Manila'));
        // Only the test's own wallets (a migration seeds the defaults)
        BalanceAccount::query()->delete();
        BalanceAccount::create(['code' => 'GCASH', 'name' => 'GCash', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'smartphone']);
        BalanceAccount::create(['code' => 'PAYPAL', 'name' => 'PayPal', 'currency' => 'USD', 'color' => 'blue', 'icon' => 'wallet']);
    }

    /** @return array<string, array> the months keyed by "Y-m" */
    private function trend(): array
    {
        $months = $this->getJson('/api/v1/master/dashboard/trend')->assertOk()->json('months');

        return collect($months)->keyBy('month')->all();
    }

    /** A sale marked sold at this Manila time. */
    private function sold(string $manilaTime, float $price, float $cost): void
    {
        $tx = BusinessTransaction::create(['type' => 'gold', 'amount' => 1, 'date' => '2026-10-01', 'price_php' => $price, 'cost_php' => $cost]);
        $tx->forceFill(['archived_at' => CarbonImmutable::parse($manilaTime, 'Asia/Manila')->utc()])->saveQuietly();
    }

    private function at(string $manilaTime, callable $create): void
    {
        $this->travelTo(CarbonImmutable::parse($manilaTime, 'Asia/Manila'));
        $create();
        $this->travelTo(CarbonImmutable::parse('2026-11-10 10:00', 'Asia/Manila'));
    }

    public function test_it_returns_the_last_12_manila_months_ending_this_month(): void
    {
        $months = array_keys($this->trend());

        $this->assertCount(12, $months);
        $this->assertSame('2025-12', $months[0]);
        $this->assertSame('2026-11', end($months));
    }

    public function test_sales_count_in_the_manila_month_they_were_sold(): void
    {
        $this->sold('2026-10-31 20:00', 1000, 600);  // Oct 31 in Manila (and UTC)
        $this->sold('2026-11-01 02:00', 500, 200);   // Nov 1 in Manila, still Oct 31 in UTC
        $this->sold('2025-11-20 12:00', 9000, 1000); // before the window

        $t = $this->trend();
        $this->assertSame(400.0, (float) $t['2026-10']['business_profit']);
        $this->assertSame(300.0, (float) $t['2026-11']['business_profit']);
        $this->assertSame(0.0, (float) $t['2025-12']['business_profit']);
    }

    public function test_daily_income_and_expenses_are_personal_only(): void
    {
        $food = Category::create(['user_id' => $this->admin->id, 'name' => 'Food', 'type' => 'expense']);
        $pay = Category::create(['user_id' => $this->admin->id, 'name' => 'Salary', 'type' => 'income']);
        Transaction::create(['user_id' => $this->admin->id, 'category_id' => $food->id, 'type' => 'expense', 'amount' => 250, 'date' => '2026-11-03']);
        Transaction::create(['user_id' => $this->admin->id, 'category_id' => $pay->id, 'type' => 'income', 'amount' => 20000, 'date' => '2026-10-15']);
        Transaction::create(['user_id' => $this->admin->id, 'category_id' => $food->id, 'type' => 'expense', 'amount' => 999, 'date' => '2026-11-03', 'scope' => 'business']);

        $t = $this->trend();
        $this->assertSame(250.0, (float) $t['2026-11']['daily_expense']);
        $this->assertSame(20000.0, (float) $t['2026-10']['daily_income']);
        $this->assertSame(0.0, (float) $t['2026-11']['daily_income']);
    }

    public function test_balances_and_gold_carry_forward_from_before_the_window(): void
    {
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'add', 'amount' => 1000, 'date' => '2025-06-01']);
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'sell', 'amount' => 300, 'date' => '2026-09-10']);
        BalanceEntry::create(['account' => 'PAYPAL', 'type' => 'add', 'amount' => 50, 'date' => '2026-11-02']);
        $this->at('2025-05-01 09:00', fn () => Gold::create(['amount' => 100_000_000]));
        $this->at('2026-10-05 09:00', fn () => Gold::create(['amount' => -40_000_000]));

        $t = $this->trend();
        $this->assertSame(1000.0, (float) $t['2025-12']['php_balance']);
        $this->assertSame(1000.0, (float) $t['2026-08']['php_balance']);
        $this->assertSame(700.0, (float) $t['2026-09']['php_balance']);
        $this->assertSame(700.0, (float) $t['2026-11']['php_balance']);
        $this->assertSame(0.0, (float) $t['2026-10']['usd_balance']);
        $this->assertSame(50.0, (float) $t['2026-11']['usd_balance']);
        $this->assertSame(100_000_000.0, (float) $t['2026-09']['gold_stash']);
        $this->assertSame(60_000_000.0, (float) $t['2026-10']['gold_stash']);
    }

    public function test_this_months_holdings_match_the_overview_totals(): void
    {
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'add', 'amount' => 1234.5, 'date' => '2026-11-09']);
        Gold::create(['amount' => 5_000_000]);
        RucoyAccount::create(['description' => 'Leblanc 600 Dist', 'email' => 'a@x.com', 'cost' => 300_000_000]);

        $now = collect($this->trend())->last();
        $stats = $this->getJson('/api/v1/master/dashboard')->json();
        $this->assertEquals($stats['balance_php_total'], $now['php_balance']);
        $this->assertEquals($stats['gold_stash'], $now['gold_stash']);
        $this->assertEquals($stats['total_price'], $now['account_gold']);
    }

    public function test_accounts_count_only_while_they_were_in_stock(): void
    {
        $this->at('2026-08-20 09:00', function () {
            $a = RucoyAccount::create(['description' => 'Leblanc 500 Dist', 'email' => 'a@x.com', 'cost' => 200_000_000]);
            $a->forceFill(['archived_at' => CarbonImmutable::parse('2026-10-15 12:00', 'Asia/Manila')->utc()])->saveQuietly();
        });
        $this->at('2026-10-20 09:00', function () {
            $cash = RucoyAccount::create(['description' => 'Cash deal', 'email' => 'b@x.com', 'deal_type' => 'cash']);
            BusinessTransaction::create(['type' => 'account', 'account_id' => $cash->id, 'amount' => 1, 'date' => '2026-10-20', 'cost_php' => 5000]);
        });

        $t = $this->trend();
        $this->assertSame(0.0, (float) $t['2026-07']['account_gold']);
        $this->assertSame(200_000_000.0, (float) $t['2026-08']['account_gold']);
        $this->assertSame(200_000_000.0, (float) $t['2026-09']['account_gold']);
        $this->assertSame(0.0, (float) $t['2026-10']['account_gold']);
        $this->assertSame(0.0, (float) $t['2026-09']['account_cash_php']);
        $this->assertSame(5000.0, (float) $t['2026-10']['account_cash_php']);
    }

    public function test_daily_only_users_cannot_see_it(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));

        $this->getJson('/api/v1/master/dashboard/trend')->assertForbidden();
    }
}
