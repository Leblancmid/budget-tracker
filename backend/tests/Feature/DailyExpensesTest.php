<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DailyExpensesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function category(string $type = 'income'): Category
    {
        return Category::create(['user_id' => $this->user->id, 'name' => ucfirst($type), 'type' => $type]);
    }

    private function gcash(): BalanceAccount
    {
        $this->postJson('/api/v1/master/balance-accounts', [
            'name' => 'GCash', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'wallet',
        ])->assertCreated()->assertJsonPath('code', 'GCASH');

        return BalanceAccount::where('code', 'GCASH')->firstOrFail();
    }

    public function test_login_and_logout(): void
    {
        $user = User::factory()->create(['password' => 'secret123']);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertStatus(422)->assertJsonValidationErrors('email');

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);

        $this->postJson('/api/v1/auth/logout')->assertOk()->assertJson(['message' => 'Logged out.']);
    }

    public function test_category_crud_and_ownership(): void
    {
        $id = $this->postJson('/api/v1/categories', ['name' => 'Food', 'type' => 'expense'])
            ->assertCreated()->json('id');

        $this->putJson("/api/v1/categories/{$id}", ['name' => 'Groceries'])
            ->assertOk()->assertJsonPath('name', 'Groceries');

        $other = Category::create(['user_id' => User::factory()->create()->id, 'name' => 'X', 'type' => 'expense']);
        $this->getJson("/api/v1/categories/{$other->id}")->assertForbidden();
        $this->putJson("/api/v1/categories/{$other->id}", ['name' => 'Y'])->assertForbidden();
        $this->deleteJson("/api/v1/categories/{$other->id}")->assertForbidden();

        Transaction::create(['user_id' => $this->user->id, 'category_id' => $id, 'type' => 'expense', 'amount' => 5, 'date' => now()]);
        $this->deleteJson("/api/v1/categories/{$id}")->assertStatus(422);
    }

    public function test_transaction_keeps_its_balance_entry_in_sync(): void
    {
        $this->gcash();
        $income  = $this->category('income');
        $expense = $this->category('expense');

        $id = $this->postJson('/api/v1/transactions', [
            'category_id' => $income->id, 'type' => 'income', 'amount' => 1000,
            'date' => '2026-10-01', 'balance_account' => 'GCASH',
        ])->assertCreated()->assertJsonPath('balance_entry.account', 'GCASH')->json('id');

        $entry = BalanceEntry::where('transaction_id', $id)->firstOrFail();
        $this->assertSame('add', $entry->type);
        $this->assertEquals(1000, $entry->amount);
        $this->assertSame('Income', $entry->description); // falls back to the category name

        $accounts = collect($this->getJson('/api/v1/master/balance-accounts')->assertOk()->json());
        $this->assertEquals(1000, $accounts->firstWhere('code', 'GCASH')['balance']);

        // Entries owned by a transaction can't be changed from Balance
        $this->putJson("/api/v1/master/balance-entries/{$entry->id}", [
            'account' => 'GCASH', 'type' => 'add', 'amount' => 1, 'date' => '2026-10-01',
        ])->assertStatus(422);
        $this->deleteJson("/api/v1/master/balance-entries/{$entry->id}")->assertStatus(422);

        // Switching to an expense deducts instead; omitting balance_account keeps the link
        $this->putJson("/api/v1/transactions/{$id}", ['category_id' => $expense->id, 'type' => 'expense', 'amount' => 250])
            ->assertOk();
        $entry->refresh();
        $this->assertSame('sell', $entry->type);
        $this->assertEquals(250, $entry->amount);

        // Clearing the account removes the entry
        $this->putJson("/api/v1/transactions/{$id}", ['balance_account' => null])->assertOk();
        $this->assertDatabaseMissing('balance_entries', ['transaction_id' => $id]);

        $this->putJson("/api/v1/transactions/{$id}", ['balance_account' => 'GCASH'])->assertOk();
        $this->deleteJson("/api/v1/transactions/{$id}")->assertOk();
        $this->assertDatabaseMissing('balance_entries', ['transaction_id' => $id]);
    }

    public function test_transaction_ownership_and_filters(): void
    {
        $cat = $this->category('expense');
        Transaction::create(['user_id' => $this->user->id, 'category_id' => $cat->id, 'type' => 'expense', 'amount' => 10, 'description' => 'coffee', 'date' => '2026-10-02']);
        Transaction::create(['user_id' => $this->user->id, 'category_id' => $cat->id, 'type' => 'expense', 'scope' => 'business', 'amount' => 20, 'description' => 'ads', 'date' => '2026-10-03']);

        $this->getJson('/api/v1/transactions?search=cof')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/v1/transactions?scope=business')->assertOk()->assertJsonPath('data.0.description', 'ads');
        $this->getJson('/api/v1/transactions?balance_account=none')->assertOk()->assertJsonPath('total', 2);

        $foreign = Transaction::create(['user_id' => User::factory()->create()->id, 'category_id' => $cat->id, 'type' => 'expense', 'amount' => 1, 'date' => now()]);
        $this->getJson("/api/v1/transactions/{$foreign->id}")->assertForbidden();
        $this->deleteJson("/api/v1/transactions/{$foreign->id}")->assertForbidden();
    }

    public function test_dashboard_leaves_business_scope_out_of_daily_totals(): void
    {
        $income = $this->category('income');
        $this->postJson('/api/v1/transactions', ['category_id' => $income->id, 'type' => 'income', 'amount' => 500, 'date' => '2026-10-05'])->assertCreated();
        $this->postJson('/api/v1/transactions', ['category_id' => $income->id, 'type' => 'income', 'scope' => 'business', 'amount' => 1000, 'date' => '2026-10-05'])->assertCreated();

        $this->getJson('/api/v1/dashboard?month=10&year=2026')->assertOk()
            ->assertJsonPath('total_income', 500)
            ->assertJsonPath('business_income', 1000)
            ->assertJsonPath('business_count', 1);
    }

    public function test_budgets_report_spending(): void
    {
        $food = $this->category('expense');
        $id = $this->postJson('/api/v1/budgets', ['category_id' => $food->id, 'amount' => 1000, 'month' => 10, 'year' => 2026])
            ->assertCreated()->json('id');
        $this->postJson('/api/v1/budgets', ['category_id' => $food->id, 'amount' => 5, 'month' => 10, 'year' => 2026])
            ->assertStatus(422)->assertJsonValidationErrors('category_id');

        Transaction::create(['user_id' => $this->user->id, 'category_id' => $food->id, 'type' => 'expense', 'amount' => 250, 'date' => '2026-10-09']);

        $this->getJson('/api/v1/budgets?month=10&year=2026')->assertOk()
            ->assertJsonPath('0.spent', 250)
            ->assertJsonPath('0.remaining', 750)
            ->assertJsonPath('0.percentage', 25);

        $this->putJson("/api/v1/budgets/{$id}", ['amount' => 2000])->assertOk()->assertJsonPath('amount', '2000.00');
        $this->deleteJson("/api/v1/budgets/{$id}")->assertOk();
    }

    public function test_edits_are_logged_with_before_and_after(): void
    {
        $cat = $this->category('expense');
        $id = $this->postJson('/api/v1/transactions', ['category_id' => $cat->id, 'type' => 'expense', 'amount' => 100, 'description' => 'Lunch', 'date' => '2026-10-01'])
            ->json('id');

        $this->assertDatabaseHas('activity_logs', ['loggable_type' => Transaction::class, 'loggable_id' => $id, 'type' => 'expense', 'module' => 'daily']);

        $this->putJson("/api/v1/transactions/{$id}", ['amount' => 150])->assertOk();

        $log = ActivityLog::where('loggable_id', $id)->where('type', 'edited')->firstOrFail();
        $changes = $log->getAttribute('changes');
        $this->assertEquals(100, $changes['amount']['before']);
        $this->assertEquals(150, $changes['amount']['after']);

        $this->getJson('/api/v1/logs')->assertOk()->assertJsonFragment(['type' => 'edited', 'module' => 'daily']);
    }

    public function test_balance_accounts_manage_codes_order_and_deletion(): void
    {
        $this->gcash();
        $second = $this->postJson('/api/v1/master/balance-accounts', ['name' => 'GCash', 'currency' => 'PHP', 'color' => 'green', 'icon' => 'wallet'])
            ->assertCreated()->assertJsonPath('code', 'GCASH_2')->json('id');
        $first = BalanceAccount::where('code', 'GCASH')->value('id');

        $this->postJson('/api/v1/master/balance-accounts/reorder', ['ids' => [$second, $first]])->assertOk();
        $this->assertSame(1, BalanceAccount::find($second)->sort_order);
        $this->assertSame(2, BalanceAccount::find($first)->sort_order);

        $this->putJson("/api/v1/master/balance-accounts/{$second}", ['name' => 'Maya', 'hidden' => true])
            ->assertOk()->assertJsonPath('code', 'GCASH_2')->assertJsonPath('name', 'Maya');
        $this->assertNotNull(BalanceAccount::find($second)->hidden_at);

        $this->postJson('/api/v1/master/balance-entries', ['account' => 'GCASH', 'type' => 'add', 'amount' => 10, 'date' => '2026-10-01'])->assertCreated();
        $this->deleteJson("/api/v1/master/balance-accounts/{$first}")->assertStatus(422);
        $this->deleteJson("/api/v1/master/balance-accounts/{$second}")->assertOk();
    }
}
