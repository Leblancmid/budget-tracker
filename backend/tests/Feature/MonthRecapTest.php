<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\User;
use App\Services\PhoneAlerts;
use App\Services\ProfitGoal;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** On the 1st, one alert saying how last month went. */
class MonthRecapTest extends TestCase
{
    use RefreshDatabase;

    private User $trader;

    protected function setUp(): void
    {
        parent::setUp();
        $this->trader = User::factory()->create(['role' => 'trader']);
        config(['services.webpush.public_key' => null, 'listing.site_token' => null]);
        PhoneAlerts::$sender = fn ($devices) => $devices->count();
    }

    protected function tearDown(): void
    {
        PhoneAlerts::$sender = null;
        parent::tearDown();
    }

    private function sale(string $type, float $profit, string $soldOn): void
    {
        BusinessTransaction::create(['type' => $type, 'description' => "{$type} sale", 'price_php' => $profit + 1000, 'cost_php' => 1000, 'amount' => 1, 'date' => $soldOn])
            ->forceFill(['archived_at' => CarbonImmutable::parse($soldOn . ' 12:00')])->save();
    }

    private function recaps(): array
    {
        return $this->trader->fresh()->notifications()->get()->map(fn ($n) => [$n->data['title'], $n->data['body']])
            ->filter(fn ($r) => str_contains($r[0], 'profit'))->values()->all();
    }

    public function test_the_first_of_the_month_recaps_the_month_before(): void
    {
        ProfitGoal::set(5000);
        $this->sale('account', 3000, '2026-11-05');
        $this->sale('account', 2500, '2026-11-20');
        $this->sale('gold', 400, '2026-11-25');
        $this->sale('account', 9999, '2026-12-01'); // December: not in November's recap
        // Bought 90 days before, still unsold
        BusinessTransaction::create(['type' => 'account', 'description' => 'Old one', 'cost_php' => 3100, 'amount' => 1, 'date' => '2026-09-01']);

        $this->artisan('business:alerts', ['--date' => '2026-11-30'])->assertSuccessful(); // not the 1st: no recap
        $this->assertSame([], $this->recaps());

        $this->artisan('business:alerts', ['--date' => '2026-12-01'])->assertSuccessful();
        $this->artisan('business:alerts', ['--date' => '2026-12-01'])->assertSuccessful(); // once
        $this->assertSame([[
            'November: ₱5,900 profit (goal reached ✓)',
            '2 accounts and 1 gold trade sold. ₱3,100 has been in stock over 2 months: worth selling cheaper?',
        ]], $this->recaps());
    }

    public function test_a_missed_goal_shows_how_close_and_a_quiet_month_says_so(): void
    {
        ProfitGoal::set(10000);
        $this->sale('account', 4000, '2026-10-10');

        $this->artisan('business:alerts', ['--date' => '2026-11-01'])->assertSuccessful();
        $this->assertSame([['October: ₱4,000 profit (40% of your goal)', '1 account and 0 gold trades sold.']], $this->recaps());
    }

    public function test_nothing_sold_and_nothing_in_stock_sends_nothing(): void
    {
        $this->artisan('business:alerts', ['--date' => '2026-11-01'])->assertSuccessful();
        $this->assertSame([], $this->recaps());
    }
}
