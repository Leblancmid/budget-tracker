<?php

namespace Tests\Feature;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\Category;
use App\Models\RecurringEntry;
use App\Models\RucoyAccount;
use App\Models\Transaction;
use App\Models\User;
use App\Services\BalanceInterest;
use App\Services\BusinessBrief;
use App\Services\RecurringEntries;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Recurring entries, bank check, weekly brief and price guide. */
class AutomationFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $bills;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
        BalanceAccount::firstOrCreate(['code' => 'GCASH'], ['name' => 'GCash', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'smartphone']);
        $this->bills = Category::create(['user_id' => $this->user->id, 'name' => 'Bills', 'type' => 'expense', 'color' => '#f00', 'icon' => 'receipt']);
    }

    private function today(): string
    {
        return CarbonImmutable::now(BalanceInterest::ZONE)->format('Y-m-d');
    }

    private function balance(string $code): float
    {
        return BalanceInterest::balanceAt($code, '2999-12-31');
    }

    // ── Recurring entries ──────────────────────────────────────────

    public function test_a_recurring_entry_due_today_posts_right_away_and_moves_to_next_month(): void
    {
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'add', 'amount' => 5000, 'date' => '2026-01-01']);
        $today = CarbonImmutable::now(BalanceInterest::ZONE)->startOfDay();

        $res = $this->postJson('/api/v1/recurring-entries', [
            'category_id' => $this->bills->id, 'type' => 'expense', 'amount' => 1499, 'description' => 'Internet',
            'balance_account' => 'GCASH', 'frequency' => 'monthly', 'next_date' => $today->format('Y-m-d'),
        ])->assertCreated();

        $tx = Transaction::where('recurring_entry_id', $res->json('id'))->sole();
        $this->assertSame('Internet', $tx->description);
        $this->assertEquals(5000 - 1499, $this->balance('GCASH'));
        $this->assertSame(RecurringEntries::after($today, 'monthly', $today->day)->format('Y-m-d'), $res->json('next_date'));
    }

    public function test_missed_dates_are_caught_up_and_monthly_keeps_the_31st(): void
    {
        $entry = RecurringEntry::create([
            'user_id' => $this->user->id, 'category_id' => $this->bills->id, 'type' => 'expense', 'amount' => 100,
            'frequency' => 'monthly', 'day_of_month' => 31, 'next_date' => '2026-01-31',
        ]);

        $posted = RecurringEntries::postDue(CarbonImmutable::parse('2026-04-15', BalanceInterest::ZONE));

        $this->assertSame(3, $posted);
        $this->assertSame(['2026-01-31', '2026-02-28', '2026-03-31'],
            Transaction::where('recurring_entry_id', $entry->id)->orderBy('date')->pluck('date')->map->format('Y-m-d')->all());
        $this->assertSame('2026-04-30', $entry->fresh()->next_date->format('Y-m-d'));

        // Running again the same day posts nothing new
        $this->assertSame(0, RecurringEntries::postDue(CarbonImmutable::parse('2026-04-15', BalanceInterest::ZONE)));
    }

    public function test_paused_entries_do_not_post(): void
    {
        RecurringEntry::create([
            'user_id' => $this->user->id, 'category_id' => $this->bills->id, 'type' => 'expense', 'amount' => 100,
            'frequency' => 'weekly', 'next_date' => '2026-01-01', 'active' => false,
        ]);

        $this->assertSame(0, RecurringEntries::postDue(CarbonImmutable::parse('2026-02-01', BalanceInterest::ZONE)));
    }

    public function test_recurring_entries_are_private_and_validated(): void
    {
        $other = User::factory()->create();
        $theirs = RecurringEntry::create([
            'user_id' => $other->id, 'category_id' => $this->bills->id, 'type' => 'expense', 'amount' => 100,
            'frequency' => 'weekly', 'next_date' => '2099-01-01',
        ]);

        $this->getJson('/api/v1/recurring-entries')->assertOk()->assertJsonCount(0, 'data');
        $this->putJson("/api/v1/recurring-entries/{$theirs->id}", ['amount' => 1])->assertForbidden();
        $this->deleteJson("/api/v1/recurring-entries/{$theirs->id}")->assertForbidden();

        $this->postJson('/api/v1/recurring-entries', [
            'category_id' => $this->bills->id, 'type' => 'expense', 'amount' => 0, 'frequency' => 'yearly', 'next_date' => '01/02/2026',
        ])->assertStatus(422)->assertJsonValidationErrors(['amount', 'frequency', 'next_date']);
    }

    public function test_daily_only_users_can_use_recurring_entries(): void
    {
        $daily = User::factory()->create(['role' => 'daily_only']);
        Sanctum::actingAs($daily);
        $cat = Category::create(['user_id' => $daily->id, 'name' => 'Rent', 'type' => 'expense', 'color' => '#000', 'icon' => 'home']);

        $this->postJson('/api/v1/recurring-entries', [
            'category_id' => $cat->id, 'type' => 'expense', 'amount' => 8000, 'frequency' => 'monthly', 'next_date' => '2099-01-05',
        ])->assertCreated();
    }

    // ── Bank check ─────────────────────────────────────────────────

    public function test_bank_check_records_the_difference_and_the_check_date(): void
    {
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'add', 'amount' => 1000, 'date' => '2026-01-01']);
        $gcash = BalanceAccount::where('code', 'GCASH')->sole();

        $this->postJson("/api/v1/master/balance-accounts/{$gcash->id}/check", ['actual' => 1021.92])
            ->assertOk()->assertJsonPath('difference', 21.92)
            ->assertJsonPath('account.checked_at', $this->today());
        $this->assertEquals(1021.92, $this->balance('GCASH'));
        $this->assertDatabaseHas('balance_entries', ['account' => 'GCASH', 'kind' => 'adjustment', 'type' => 'add', 'amount' => 21.92]);

        // Lower than recorded: deducts; equal: no entry
        $this->postJson("/api/v1/master/balance-accounts/{$gcash->id}/check", ['actual' => 1000])->assertJsonPath('difference', -21.92);
        $this->assertEquals(1000, $this->balance('GCASH'));
        $this->postJson("/api/v1/master/balance-accounts/{$gcash->id}/check", ['actual' => 1000])->assertJsonPath('entry', null);
        $this->assertSame(2, BalanceEntry::where('kind', 'adjustment')->count());
    }

    public function test_bank_check_is_validated_and_admin_only(): void
    {
        $gcash = BalanceAccount::where('code', 'GCASH')->sole();
        $this->postJson("/api/v1/master/balance-accounts/{$gcash->id}/check", ['actual' => 'abc'])->assertStatus(422);

        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->postJson("/api/v1/master/balance-accounts/{$gcash->id}/check", ['actual' => 5])->assertForbidden();
    }

    // ── Weekly brief ───────────────────────────────────────────────

    public function test_brief_flags_slow_listings_overdue_payments_and_negative_wallets(): void
    {
        // Sold one account in 10 days → anything listed 15+ days is slow
        $sold = RucoyAccount::create(['description' => 'Leblanc 600 Dist', 'email' => 'a@x.com', 'listed_at' => now()->subDays(20)]);
        $sold->forceFill(['archived_at' => now()->subDays(10)])->save();
        BusinessTransaction::create(['type' => 'account', 'account_id' => $sold->id, 'price_php' => 10000, 'cost_php' => 7000, 'amount' => 3000, 'date' => '2026-01-01', 'archived_at' => now()->subDays(2)]);

        RucoyAccount::create(['description' => 'Leblanc 640 Dist', 'email' => 'b@x.com', 'listed_at' => now()->subDays(30)]);
        RucoyAccount::create(['description' => 'Fresh one', 'email' => 'c@x.com', 'listed_at' => now()->subDays(2),
            'payment_status' => 'not_paid', 'payment_date' => now()->subDays(3)->format('Y-m-d')]);
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'sell', 'amount' => 50, 'date' => '2026-01-01']);

        $brief = $this->getJson('/api/v1/business/brief')->assertOk()->json();

        $keys = collect($brief['insights'])->pluck('key');
        $this->assertTrue($keys->contains(fn ($k) => str_starts_with($k, 'slow_listing:')));
        $this->assertTrue($keys->contains(fn ($k) => str_starts_with($k, 'overdue:')));
        $this->assertTrue($keys->contains('negative:GCASH'));
        $this->assertSame(3000.0, (float) $brief['summary']['profit']);
        $this->assertSame(1, $brief['summary']['accounts_sold']);
        // Problems come first
        $this->assertSame('bad', $brief['insights'][0]['level']);
    }

    public function test_brief_says_when_nothing_sold(): void
    {
        $brief = BusinessBrief::build();

        $this->assertSame('No sales in the last 7 days', collect($brief['insights'])->firstWhere('key', 'profit')['title']);
    }

    // ── Price guide ────────────────────────────────────────────────

    public function test_price_guide_compares_with_the_nearest_sold_accounts_of_the_same_class(): void
    {
        foreach ([[630, 'Dist', 20000, 14000], [640, 'Dist', 24000, 16000], [645, 'Dist', 26000, 18000], [640, 'Magic', 90000, 10000], [400, 'Dist', 3000, 2000]] as $i => [$lvl, $cls, $price, $cost]) {
            $a = RucoyAccount::create(['description' => "Leblanc {$lvl} {$cls}", 'email' => "s{$i}@x.com", 'listed_at' => now()->subDays(20)]);
            $a->forceFill(['archived_at' => now()->subDays(10)])->save();
            BusinessTransaction::create(['type' => 'account', 'account_id' => $a->id, 'price_php' => $price, 'cost_php' => $cost, 'amount' => 1, 'date' => '2026-01-01', 'archived_at' => now()]);
        }

        $guide = $this->getJson('/api/v1/business/price-guide?level=638&class=distance')->assertOk()->json('account');

        $this->assertSame([640, 645, 630], array_column($guide['comparables'], 'level'));
        $this->assertEquals(24000, $guide['price_php']);
        $this->assertSame(10, $guide['level_range']);
        $this->assertNotNull($guide['max_buy_php']);
        $this->assertLessThan(24000, $guide['max_buy_php']);

        $this->getJson('/api/v1/business/price-guide?class=tank')->assertStatus(422);
    }

    public function test_price_guide_gold_suggests_a_max_buy_rate_from_your_usual_spread(): void
    {
        foreach (range(1, 5) as $i) {
            BusinessTransaction::create(['type' => 'gold', 'price_gold' => 100_000_000, 'cost_gold' => 100_000_000, 'price_rate' => 0.20, 'cost_rate' => 0.18,
                'php_rate' => 60, 'price_php' => 1200, 'cost_php' => 1080, 'amount' => 120, 'date' => '2026-01-01', 'archived_at' => now()->subDays($i)]);
        }

        $gold = $this->getJson('/api/v1/business/price-guide')->assertOk()->json('gold');

        $this->assertEquals(0.2, $gold['recent_sell_rate']);
        $this->assertEquals(10, $gold['usual_spread']);
        $this->assertEquals(0.18, $gold['max_buy_rate']);
    }
}
