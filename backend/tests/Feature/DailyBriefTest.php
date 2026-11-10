<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Category;
use App\Models\RecurringEntry;
use App\Models\Transaction;
use App\Models\User;
use App\Services\DailyBrief;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** The Daily Expenses weekly brief (Tue 10 Nov 2026 as "today": the week is Nov 4–10). */
class DailyBriefTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private CarbonImmutable $today;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
        $this->today = CarbonImmutable::parse('2026-11-10', 'Asia/Manila');
    }

    private function category(string $name, string $type = 'expense', ?User $user = null): Category
    {
        return Category::create(['user_id' => ($user ?? $this->user)->id, 'name' => $name, 'type' => $type]);
    }

    private function spend(Category $c, float $amount, string $date, array $extra = []): Transaction
    {
        return Transaction::create(['user_id' => $c->user_id, 'category_id' => $c->id, 'type' => $c->type, 'amount' => $amount, 'date' => $date, ...$extra]);
    }

    private function brief(): array
    {
        return DailyBrief::build($this->user->id, $this->today);
    }

    private function insight(string $key): ?array
    {
        return collect($this->brief()['insights'])->firstWhere('key', $key);
    }

    public function test_spending_compares_the_last_7_days_and_names_the_top_categories(): void
    {
        $food = $this->category('Food');
        $rent = $this->category('Rent');
        $this->spend($food, 300, '2026-11-09');
        $this->spend($rent, 1000, '2026-11-05');
        $this->spend($food, 400, '2026-11-01'); // the week before

        $brief = $this->brief();
        $this->assertSame(['spent' => 1300.0, 'prev_spent' => 400.0], array_intersect_key($brief['summary'], ['spent' => 0, 'prev_spent' => 0]));

        $s = $this->insight('spending');
        $this->assertSame('warn', $s['level']);
        $this->assertSame('₱1,300 spent in the last 7 days, up ₱900 (225%) from the week before', $s['title']);
        $this->assertSame('Most went to Rent (₱1,000) and Food (₱300).', $s['detail']);
    }

    public function test_spending_less_than_last_week_is_good_news(): void
    {
        $food = $this->category('Food');
        $this->spend($food, 100, '2026-11-08');
        $this->spend($food, 500, '2026-11-02');

        $this->assertSame('good', $this->insight('spending')['level']);
    }

    public function test_budgets_that_are_over_or_heading_over(): void
    {
        $food = $this->category('Food');
        $fun = $this->category('Fun');
        $bus = $this->category('Transport');
        foreach ([[$food, 1000], [$fun, 2000], [$bus, 3000]] as [$c, $amount]) {
            Budget::create(['user_id' => $this->user->id, 'category_id' => $c->id, 'amount' => $amount, 'month' => 11, 'year' => 2026]);
        }
        $this->spend($food, 1200, '2026-11-03');
        $this->spend($fun, 900, '2026-11-02'); // ₱90/day by Nov 10 → about ₱2,700 by month end
        $this->spend($bus, 100, '2026-11-02');

        $over = $this->insight('over:' . $food->id);
        $this->assertSame(['bad', 'Food is over budget'], [$over['level'], $over['title']]);
        $this->assertSame('₱1,200 spent of ₱1,000 (120%), with 21 days left in November.', $over['detail']);

        $pace = $this->insight('pace:' . $fun->id);
        $this->assertSame('warn', $pace['level']);
        $this->assertSame('₱900 of ₱2,000 spent by Nov 10. At this pace it runs out around Nov 23; ₱52 a day keeps it on budget.', $pace['detail']);

        $this->assertNull($this->insight('pace:' . $bus->id));
        // What's left of all budgets over the 21 days left: (6000 − 2200) / 21
        $this->assertEquals(round(3800 / 21, 2), $this->brief()['summary']['safe_per_day']);
    }

    public function test_spending_without_a_budget(): void
    {
        $food = $this->category('Food');
        $others = $this->category('Others');
        $this->spend($food, 1000, '2026-11-03');
        $this->spend($others, 3000, '2026-11-04');

        $this->assertSame('No budgets set for November', $this->insight('no_budgets')['title']);

        Budget::create(['user_id' => $this->user->id, 'category_id' => $food->id, 'amount' => 5000, 'month' => 11, 'year' => 2026]);
        $u = $this->insight('unbudgeted');
        $this->assertSame('Others has no budget: ₱3,000 this month', $u['title']);
        $this->assertStringContainsString('75% of your spending', $u['detail']);
        $this->assertStringContainsString('clearer categories', $u['detail']);
    }

    public function test_an_expense_far_above_the_usual_is_flagged(): void
    {
        $food = $this->category('Food');
        foreach (['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'] as $d) {
            $this->spend($food, 200, $d);
        }
        $big = $this->spend($food, 1500, '2026-11-06', ['description' => 'Birthday dinner']);
        $this->spend($food, 500, '2026-11-07'); // below ₱1,000: never "big"

        $b = $this->insight('big:' . $big->id);
        $this->assertSame('Big expense: ₱1,500 on Food', $b['title']);
        $this->assertSame('"Birthday dinner" on Nov 6, about 8× your usual Food spend (₱200).', $b['detail']);
        $this->assertCount(1, collect($this->brief()['insights'])->filter(fn ($i) => str_starts_with($i['key'], 'big:')));
    }

    public function test_recurring_entries_due_this_week(): void
    {
        $rent = $this->category('Rent');
        RecurringEntry::create(['user_id' => $this->user->id, 'category_id' => $rent->id, 'type' => 'expense', 'amount' => 14000,
            'description' => 'Rent', 'frequency' => 'monthly', 'day_of_month' => 12, 'next_date' => '2026-11-12', 'active' => true]);
        RecurringEntry::create(['user_id' => $this->user->id, 'category_id' => $rent->id, 'type' => 'expense', 'amount' => 999,
            'description' => 'Paused', 'frequency' => 'monthly', 'next_date' => '2026-11-12', 'active' => false]);

        $u = $this->insight('upcoming');
        $this->assertSame('1 recurring entry posts this week (₱14,000 out)', $u['title']);
        $this->assertSame('Rent ₱14,000 on Nov 12.', $u['detail']);
    }

    public function test_a_gap_in_logging_and_missing_income(): void
    {
        $food = $this->category('Food');
        $salary = $this->category('Salary', 'income');
        $this->spend($salary, 20000, '2026-10-15');
        $this->spend($food, 100, '2026-11-05');

        $this->assertSame('Nothing logged for 5 days', $this->insight('gap')['title']);
        $this->assertSame('No income logged in November yet', $this->insight('no_income')['title']);

        $this->spend($salary, 20000, '2026-11-10');
        $this->assertNull($this->insight('gap'));
        $this->assertNull($this->insight('no_income'));
    }

    public function test_only_your_own_personal_entries_count(): void
    {
        $other = User::factory()->create();
        $theirs = $this->category('Food', 'expense', $other);
        $this->spend($theirs, 5000, '2026-11-09');
        $mine = $this->category('Food');
        $this->spend($mine, 4000, '2026-11-09', ['scope' => 'business']); // business-tagged: left out
        $this->spend($mine, 100, '2026-11-09');

        $this->assertSame(100.0, $this->brief()['summary']['spent']);
        $this->assertSame(5000.0, DailyBrief::build($other->id, $this->today)['summary']['spent']);
    }

    public function test_every_signed_in_user_gets_their_own_brief(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->getJson('/api/v1/dashboard/brief')->assertOk()
            ->assertJsonStructure(['from', 'to', 'week', 'summary' => ['spent', 'prev_spent', 'income', 'month_spent', 'month_budget', 'safe_per_day', 'days_left'], 'insights'])
            ->assertJsonPath('summary.spent', 0);

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/dashboard/brief')->assertUnauthorized();
    }
}
