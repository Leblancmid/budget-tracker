<?php

namespace Tests\Feature;

use App\Models\BalanceAccount;
use App\Models\Category;
use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Everything done in the app (except viewing) shows on the Logs page, sign-ins included. */
class LogCoverageTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['email' => 'mikey@example.com']);
    }

    /** The Logs page's entries of one type, newest first. */
    private function logs(?string $type = null): array
    {
        Sanctum::actingAs($this->admin);

        return collect($this->getJson('/api/v1/logs')->assertOk()->json('data'))
            ->when($type, fn ($c) => $c->where('type', $type))->values()->all();
    }

    private function descriptions(string $type): array
    {
        return array_column($this->logs($type), 'description');
    }

    public function test_signing_in_and_out_is_logged_with_the_device(): void
    {
        $token = $this->withHeaders(['User-Agent' => 'iPhone Safari'])
            ->postJson('/api/v1/auth/login', ['email' => 'mikey@example.com', 'password' => 'password'])->assertOk()->json('token');
        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();

        $in = $this->logs('signed_in')[0];
        $this->assertSame('access', $in['module']);
        $this->assertSame($this->admin->id, $in['user_id']);
        $this->assertSame('iPhone Safari', $in['user_agent']);
        $this->assertSame(['Signed out'], $this->descriptions('signed_out'));
    }

    public function test_a_failed_sign_in_names_the_email_but_never_the_password_or_the_user(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'mikey@example.com', 'password' => 'hunter2-wrong'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['email' => 'nobody@example.com', 'password' => 'x'])->assertUnprocessable();

        $failed = $this->logs('sign_in_failed');
        $this->assertEqualsCanonicalizing(['Failed sign-in: nobody@example.com (no such account)', 'Failed sign-in: mikey@example.com'], array_column($failed, 'description'));
        $this->assertSame([null, null], array_column($failed, 'user_id'));
        // Shown under the person whose email was tried, when that account exists
        $this->assertEqualsCanonicalizing([$this->admin->id, null], array_column($failed, 'about_user_id'));
        $this->assertStringNotContainsString('hunter2', json_encode($failed));
    }

    public function test_being_locked_out_is_logged(): void
    {
        config(['auth.login_throttle.max_attempts' => 1]);
        $this->postJson('/api/v1/auth/login', ['email' => 'mikey@example.com', 'password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['email' => 'mikey@example.com', 'password' => 'wrong'])->assertStatus(429);

        $this->assertSame(['Blocked sign-in (too many attempts): mikey@example.com'], $this->descriptions('locked_out'));
    }

    public function test_categories_are_logged_when_added_edited_and_removed(): void
    {
        Sanctum::actingAs($this->admin);
        $id = $this->postJson('/api/v1/categories', ['name' => 'Snacks', 'type' => 'expense'])->assertCreated()->json('id');
        $this->putJson("/api/v1/categories/{$id}", ['name' => 'Snacks & drinks', 'type' => 'expense'])->assertOk();
        $this->deleteJson("/api/v1/categories/{$id}")->assertOk();

        $this->assertContains('Category: Snacks (expense)', $this->descriptions('added'));
        $edit = collect($this->logs('edited'))->firstWhere('description', 'Category: Snacks & drinks (expense)');
        $this->assertEquals(['before' => 'Snacks', 'after' => 'Snacks & drinks'], $edit['changes']['name']);
        $this->assertContains('Removed: Category: Snacks & drinks (expense)', $this->descriptions('removed'));
    }

    public function test_budgets_and_wallets_are_logged(): void
    {
        Sanctum::actingAs($this->admin);
        $food = Category::create(['user_id' => $this->admin->id, 'name' => 'Food', 'type' => 'expense']);
        $this->postJson('/api/v1/budgets', ['category_id' => $food->id, 'amount' => 5000, 'month' => 11, 'year' => 2026])->assertCreated();
        BalanceAccount::create(['code' => 'TONIK', 'name' => 'Tonik', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'wallet']);

        $added = $this->descriptions('added');
        $this->assertContains('Budget: Food, Nov 2026', $added);
        $this->assertContains('Wallet: Tonik (PHP)', $added);
    }

    public function test_reordering_wallets_is_one_line_not_one_per_wallet(): void
    {
        Sanctum::actingAs($this->admin);
        $ids = BalanceAccount::orderBy('id')->pluck('id')->reverse()->values()->all();
        $this->postJson('/api/v1/master/balance-accounts/reorder', ['ids' => $ids])->assertOk();

        $this->assertSame(['Reordered wallets'], array_column(array_filter($this->logs('edited'), fn ($l) => $l['module'] === 'balance'), 'description'));
    }

    public function test_account_details_are_logged_but_adding_one_stays_on_its_sale(): void
    {
        Sanctum::actingAs($this->admin);
        $id = RucoyAccount::create(['description' => 'Leblanc 600 Dist', 'email' => 'a@x.com'])->id;
        // Edited later (another request): a fresh copy, as the app would load it
        RucoyAccount::find($id)->update(['email' => 'b@x.com']);

        $this->assertNotContains('Account: Leblanc 600 Dist', $this->descriptions('added'));
        $edit = collect($this->logs('edited'))->firstWhere('description', 'Account: Leblanc 600 Dist');
        $this->assertEquals(['before' => 'a@x.com', 'after' => 'b@x.com'], $edit['changes']['email']);
    }

    public function test_undo_and_redo_are_logged(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/v1/categories', ['name' => 'Snacks', 'type' => 'expense'])->assertCreated();
        $op = $this->getJson('/api/v1/master/operations')->json('data.0');

        $this->postJson("/api/v1/master/operations/{$op['id']}/undo")->assertOk();
        $this->postJson("/api/v1/master/operations/{$op['id']}/redo")->assertOk();

        $this->assertSame(['Undid: ' . $op['label']], $this->descriptions('undone'));
        $this->assertSame(['Redid: ' . $op['label']], $this->descriptions('redone'));
    }

    public function test_new_recurring_entries_show(): void
    {
        Sanctum::actingAs($this->admin);
        $rent = Category::create(['user_id' => $this->admin->id, 'name' => 'Rent', 'type' => 'expense']);
        $this->postJson('/api/v1/recurring-entries', [
            'category_id' => $rent->id, 'type' => 'expense', 'amount' => 7000, 'description' => 'Rent',
            'frequency' => 'monthly', 'next_date' => '2099-12-01',
        ])->assertCreated();

        $this->assertContains('Recurring (monthly): Rent', $this->descriptions('added'));
    }

    public function test_website_gold_rates_are_logged(): void
    {
        Sanctum::actingAs($this->admin);
        $this->putJson('/api/v1/business/website-gold', ['rates' => [['method' => 'Binance', 'currency' => 'USD', 'per_kk' => 0.21]], 'min_order_kk' => 100])->assertOk();

        $this->assertNotEmpty(array_filter($this->logs(), fn ($l) => str_starts_with((string) $l['description'], 'Website: ')));
    }
}
