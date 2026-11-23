<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** The monthly profit goal: set it, and see progress and pace on the Business stats page. */
class ProfitGoalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Nov 10 (of 30 days): an even pace to ₱30,000 is ₱10,000 by today
        $this->travelTo(CarbonImmutable::parse('2026-11-10 12:00', 'Asia/Manila'));
        Sanctum::actingAs(User::factory()->create(['role' => 'trader']));
    }

    private function soldFor(float $profit, string $on): void
    {
        BusinessTransaction::create(['type' => 'account', 'description' => 'Sold', 'price_php' => $profit + 1000, 'cost_php' => 1000, 'profit_php' => $profit, 'amount' => 1, 'date' => $on])
            ->forceFill(['archived_at' => CarbonImmutable::parse($on . ' 12:00', 'Asia/Manila')])->save();
    }

    private function goal(int $month = 11, int $year = 2026): ?array
    {
        return $this->getJson("/api/v1/business/dashboard?month={$month}&year={$year}")->assertOk()->json('goal');
    }

    public function test_no_goal_means_nothing_shown(): void
    {
        $this->assertNull($this->goal());
    }

    public function test_progress_and_pace_this_month(): void
    {
        $this->putJson('/api/v1/business/goal', ['goal_php' => 30000])->assertOk()->assertJsonPath('goal_php', 30000);

        $this->soldFor(8000, '2026-11-05');
        $g = $this->goal();
        $this->assertSame(['behind', 26.7, 10000, 21], [$g['status'], $g['percent'], (int) $g['expected_php'], $g['days_left']]);
        $this->assertEqualsWithDelta(22000 / 21, $g['needed_per_day'], 0.01); // ₱1,047.62 a day to make it

        $this->soldFor(4000, '2026-11-09');
        $this->assertSame('on_pace', $this->goal()['status']);

        $this->soldFor(20000, '2026-11-10');
        $this->assertSame(['reached', 106.7], [$this->goal()['status'], $this->goal()['percent']]);
    }

    public function test_past_and_future_months(): void
    {
        $this->putJson('/api/v1/business/goal', ['goal_php' => 30000])->assertOk();
        $this->soldFor(12000, '2026-10-15');

        $this->assertEquals(['missed', 40], [$this->goal(10)['status'], $this->goal(10)['percent']]);
        $this->assertSame('upcoming', $this->goal(12)['status']);
        $this->assertNull($this->goal(10)['needed_per_day']);
    }

    public function test_the_goal_can_be_changed_and_removed_and_is_validated(): void
    {
        $this->putJson('/api/v1/business/goal', ['goal_php' => 0])->assertStatus(422)->assertJsonValidationErrors('goal_php');
        $this->putJson('/api/v1/business/goal', ['goal_php' => 'lots'])->assertStatus(422);
        $this->putJson('/api/v1/business/goal', [])->assertStatus(422);

        $this->putJson('/api/v1/business/goal', ['goal_php' => 25000])->assertOk();
        $this->putJson('/api/v1/business/goal', ['goal_php' => null])->assertOk()->assertJsonPath('goal_php', null);
        $this->assertNull($this->goal());
        $this->assertDatabaseHas('activity_logs', ['description' => 'Monthly profit goal: ₱25,000.00 → none']);
    }

    public function test_only_traders_set_it(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->putJson('/api/v1/business/goal', ['goal_php' => 1000])->assertForbidden();
    }
}
