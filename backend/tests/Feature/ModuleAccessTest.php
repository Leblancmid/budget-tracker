<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\BalanceAccount;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Who can open which part of the app: admins everything, traders Trading (Business and Rucoy),
 * daily-only users their own Daily Expenses, and per-person modules on top of a role.
 */
class ModuleAccessTest extends TestCase
{
    use RefreshDatabase;

    /** One endpoint per area, and the module it belongs to */
    private const AREAS = [
        'trading' => ['/api/v1/business/dashboard', '/api/v1/rucoy/dashboard', '/api/v1/reports/business?period=month'],
        'wallets' => ['/api/v1/master/balance-entries'],
        'master'  => ['/api/v1/master/dashboard', '/api/v1/logs', '/api/v1/master/operations'],
    ];

    private function make(string $role, ?array $modules = null): User
    {
        return User::factory()->create(['role' => $role, 'modules' => $modules]);
    }

    /** @return array<string, bool> area => could open it */
    private function reach(User $user): array
    {
        Sanctum::actingAs($user);
        $out = [];
        foreach (self::AREAS as $module => $urls) {
            $statuses = array_map(fn ($u) => $this->getJson($u)->status(), $urls);
            $out[$module] = ! in_array(403, $statuses, true);
            // A part of an area is never open while the rest is closed
            $this->assertTrue(count(array_unique(array_map(fn ($s) => $s === 403, $statuses))) === 1, "{$module}: " . implode(',', $statuses));
        }
        $out['users'] = $this->getJson('/api/v1/users')->status() !== 403;
        $out['daily'] = $this->getJson('/api/v1/transactions')->status() !== 403;

        return $out;
    }

    public function test_each_role_opens_its_own_parts(): void
    {
        $this->assertSame(['trading' => true, 'wallets' => true, 'master' => true, 'users' => true, 'daily' => true], $this->reach($this->make('admin')));
        $this->assertSame(['trading' => true, 'wallets' => false, 'master' => false, 'users' => false, 'daily' => true], $this->reach($this->make('trader')));
        $this->assertSame(['trading' => false, 'wallets' => false, 'master' => false, 'users' => false, 'daily' => true], $this->reach($this->make('daily_only')));
    }

    public function test_modules_picked_for_a_person_replace_their_roles(): void
    {
        $this->assertSame(['trading' => true, 'wallets' => true, 'master' => false, 'users' => false, 'daily' => true],
            $this->reach($this->make('trader', ['daily', 'trading', 'wallets'])));
        $this->assertSame(['trading' => false, 'wallets' => false, 'master' => true, 'users' => false, 'daily' => true],
            $this->reach($this->make('daily_only', ['master'])));
        // Modules never give user management: that stays with the Admin role
        $this->assertFalse($this->reach($this->make('trader', User::MODULES))['users']);
    }

    public function test_trading_can_list_wallets_for_sales_but_not_change_them(): void
    {
        Sanctum::actingAs($this->make('trader'));

        $this->getJson('/api/v1/master/balance-accounts')->assertOk();
        $this->postJson('/api/v1/master/balance-accounts', ['name' => 'X', 'currency' => 'PHP'])->assertForbidden();
        $this->postJson('/api/v1/master/balance-entries', [])->assertForbidden();

        Sanctum::actingAs($this->make('daily_only'));
        $this->getJson('/api/v1/master/balance-accounts')->assertForbidden();
    }

    public function test_a_daily_entry_links_a_wallet_only_with_wallets_and_counts_as_business_only_with_trading(): void
    {
        $wallet = BalanceAccount::where('currency', 'PHP')->value('code') ?? BalanceAccount::create(['code' => 'GCASH', 'name' => 'GCash', 'currency' => 'PHP'])->code;
        $entry = fn (User $u, array $extra) => [
            'category_id' => Category::create(['user_id' => $u->id, 'name' => 'Food', 'type' => 'expense'])->id,
            'type' => 'expense', 'amount' => 50, 'date' => '2026-11-13', ...$extra,
        ];

        $daily = $this->make('daily_only');
        Sanctum::actingAs($daily);
        $this->postJson('/api/v1/transactions', $entry($daily, ['balance_account' => $wallet]))->assertUnprocessable()->assertJsonValidationErrors('balance_account');
        $this->postJson('/api/v1/transactions', $entry($daily, ['scope' => 'business']))->assertUnprocessable()->assertJsonValidationErrors('scope');
        $this->postJson('/api/v1/transactions', $entry($daily, ['balance_account' => null, 'scope' => 'personal']))->assertCreated();

        $trader = $this->make('trader');
        Sanctum::actingAs($trader);
        $this->postJson('/api/v1/transactions', $entry($trader, ['scope' => 'business']))->assertCreated();
        $this->postJson('/api/v1/transactions', $entry($trader, ['balance_account' => $wallet]))->assertUnprocessable();

        $withWallets = $this->make('daily_only', ['wallets']);
        Sanctum::actingAs($withWallets);
        $this->postJson('/api/v1/transactions', $entry($withWallets, ['balance_account' => $wallet]))->assertCreated();
    }

    public function test_admins_set_roles_and_modules_and_a_preset_pick_follows_the_role(): void
    {
        $admin = $this->make('admin');
        Sanctum::actingAs($admin);

        $sam = $this->postJson('/api/v1/users', ['name' => 'Sam', 'email' => 'sam@example.com', 'role' => 'trader', 'password' => 'Strong-pass-1'])
            ->assertCreated()->assertJsonPath('user.modules', ['daily', 'trading'])->json('user.id');
        $this->assertNull(User::find($sam)->modules, 'the preset is not stored, so it follows the role');

        $this->patchJson("/api/v1/users/{$sam}", ['modules' => ['trading', 'wallets']])->assertOk()->assertJsonPath('user.modules', ['daily', 'trading', 'wallets']);
        $this->assertSame(['daily', 'trading', 'wallets'], User::find($sam)->modules);

        // A new role without a pick goes back to that role's preset
        $this->patchJson("/api/v1/users/{$sam}", ['role' => 'daily_only'])->assertOk()->assertJsonPath('user.modules', ['daily']);
        // Admins always have everything, whatever is sent
        $this->patchJson("/api/v1/users/{$sam}", ['role' => 'admin', 'modules' => ['daily']])->assertOk()->assertJsonPath('user.modules', User::MODULES);

        $this->postJson('/api/v1/users', ['name' => 'X', 'email' => 'x@example.com', 'role' => 'trader', 'password' => 'Strong-pass-1', 'modules' => ['everything']])
            ->assertUnprocessable()->assertJsonValidationErrors('modules.0');
        $this->assertSame(1, ActivityLog::where('type', 'edited')->where('loggable_id', $sam)->whereNotNull('changes->modules')->count());
    }

    public function test_nobody_changes_their_own_modules(): void
    {
        $admin = $this->make('admin');
        Sanctum::actingAs($admin);
        $this->patchJson("/api/v1/users/{$admin->id}", ['modules' => ['daily']])->assertForbidden();
    }

    public function test_the_signed_in_user_is_told_their_modules(): void
    {
        Sanctum::actingAs($this->make('trader', ['daily', 'trading', 'master']));
        $this->getJson('/api/v1/profile')->assertOk()->assertJsonPath('user.modules', ['daily', 'trading', 'master']);
    }
}
