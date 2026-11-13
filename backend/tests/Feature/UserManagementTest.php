<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Admins add users, edit them, set passwords, and turn accounts off and on. */
class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $member;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin  = User::factory()->create(['name' => 'Admin Ann', 'email' => 'ann@example.com', 'role' => 'admin']);
        $this->member = User::factory()->create(['name' => 'Ben', 'email' => 'ben@example.com', 'role' => 'daily_only', 'password' => 'Ben-password-1']);
    }

    public function test_only_admins_manage_users(): void
    {
        $this->getJson('/api/v1/users')->assertUnauthorized();

        Sanctum::actingAs($this->member);
        $this->getJson('/api/v1/users')->assertForbidden();
        $this->postJson('/api/v1/users', ['name' => 'X', 'email' => 'x@example.com', 'role' => 'admin', 'password' => 'Strong-pass-1'])->assertForbidden();
        $this->patchJson("/api/v1/users/{$this->member->id}", ['role' => 'admin'])->assertForbidden();
        $this->postJson("/api/v1/users/{$this->admin->id}/deactivate")->assertForbidden();
        $this->putJson("/api/v1/users/{$this->admin->id}/password", ['password' => 'Strong-pass-1'])->assertForbidden();

        $this->assertSame('daily_only', $this->member->fresh()->role);
        $this->assertNull($this->admin->fresh()->deactivated_at);
    }

    public function test_the_list_is_paginated_searchable_and_filterable(): void
    {
        User::factory()->count(12)->create(['role' => 'daily_only']);
        $this->member->forceFill(['deactivated_at' => now()])->save();
        Sanctum::actingAs($this->admin);

        $page = $this->getJson('/api/v1/users')->assertOk();
        $page->assertJsonPath('total', 14)->assertJsonPath('last_page', 2)->assertJsonCount(10, 'data')
            ->assertJsonPath('counts', ['all' => 14, 'admin' => 1, 'daily_only' => 12, 'deactivated' => 1])
            ->assertJsonMissingPath('data.0.password');
        $this->assertSame('Ben', collect($this->getJson('/api/v1/users?page=2')->json('data'))->last()['name'], 'deactivated users are listed last');

        $this->assertSame(['ann@example.com'], array_column($this->getJson('/api/v1/users?search=ANN@')->json('data'), 'email'));
        $this->assertSame(['ann@example.com'], array_column($this->getJson('/api/v1/users?role=admin')->json('data'), 'email'));
        $this->assertSame(['ben@example.com'], array_column($this->getJson('/api/v1/users?status=deactivated')->json('data'), 'email'));
        $this->assertTrue(collect($this->getJson('/api/v1/users?role=admin')->json('data'))->first()['is_self']);
        $this->getJson('/api/v1/users?role=owner')->assertUnprocessable();
    }

    public function test_an_admin_adds_a_user_who_can_then_sign_in(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/v1/users', ['name' => ' Cara ', 'email' => 'Cara@Example.com', 'role' => 'daily_only', 'password' => 'Cara-start-1'])
            ->assertCreated()->assertJsonPath('user.name', 'Cara')->assertJsonPath('user.email', 'cara@example.com');

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/auth/login', ['email' => 'cara@example.com', 'password' => 'Cara-start-1'])->assertOk()
            ->assertJsonPath('user.role', 'daily_only')->assertJsonPath('user.avatar_url', null);
        $this->assertSame(1, ActivityLog::where('type', 'added')->where('description', 'User: Cara (cara@example.com)')->count());
    }

    public function test_adding_a_user_is_validated(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/v1/users', [])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'role', 'password']);
        $this->postJson('/api/v1/users', ['name' => 'X', 'email' => 'BEN@example.com', 'role' => 'owner', 'password' => 'weak'])
            ->assertUnprocessable()->assertJsonValidationErrors(['email', 'role', 'password']);
    }

    public function test_an_admin_edits_name_email_and_role_partially(): void
    {
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/v1/users/{$this->member->id}", ['role' => 'admin'])->assertOk()
            ->assertJsonPath('user.role', 'admin')->assertJsonPath('user.name', 'Ben');
        $this->patchJson("/api/v1/users/{$this->member->id}", ['email' => 'ann@example.com'])->assertUnprocessable()->assertJsonValidationErrors('email');

        $edit = ActivityLog::where('type', 'edited')->where('loggable_id', $this->member->id)->sole();
        $this->assertEquals(['before' => 'daily_only', 'after' => 'admin'], $edit->changes['role']);
    }

    public function test_nobody_changes_their_own_role_or_turns_themselves_off(): void
    {
        Sanctum::actingAs($this->admin);

        $this->patchJson("/api/v1/users/{$this->admin->id}", ['role' => 'daily_only'])->assertForbidden();
        $this->postJson("/api/v1/users/{$this->admin->id}/deactivate")->assertForbidden();
        $this->putJson("/api/v1/users/{$this->admin->id}/password", ['password' => 'Strong-pass-1'])->assertForbidden();
        // Your own name, or your unchanged role sent back, is fine
        $this->patchJson("/api/v1/users/{$this->admin->id}", ['name' => 'Ann', 'role' => 'admin'])->assertOk();

        $this->assertSame('admin', $this->admin->fresh()->role);
        $this->assertNull($this->admin->fresh()->deactivated_at);
    }

    public function test_a_deactivated_user_is_signed_out_and_cannot_sign_in_until_turned_back_on(): void
    {
        $token = $this->postJson('/api/v1/auth/login', ['email' => 'ben@example.com', 'password' => 'Ben-password-1'])->json('token');
        $category = Category::create(['user_id' => $this->member->id, 'name' => 'Food', 'type' => 'expense']);
        Transaction::create(['user_id' => $this->member->id, 'category_id' => $category->id, 'type' => 'expense', 'amount' => 120, 'date' => '2026-11-13']);

        Sanctum::actingAs($this->admin);
        $this->postJson("/api/v1/users/{$this->member->id}/deactivate")->assertOk()->assertJsonPath('user.deactivated_at', fn ($v) => $v !== null);
        $this->assertSame(0, $this->member->tokens()->count());
        $this->assertSame(1, Transaction::where('user_id', $this->member->id)->count(), 'their data stays');

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/dashboard')->assertUnauthorized();
        $this->postJson('/api/v1/auth/login', ['email' => 'ben@example.com', 'password' => 'Ben-password-1'])
            ->assertUnprocessable()->assertJsonPath('errors.email.0', 'This account has been deactivated. Ask an admin to turn it back on.');
        // A wrong password still gets the usual answer, so the message never confirms an account to a stranger
        $this->postJson('/api/v1/auth/login', ['email' => 'ben@example.com', 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonPath('errors.email.0', 'The provided credentials are incorrect.');

        Sanctum::actingAs($this->admin);
        $this->postJson("/api/v1/users/{$this->member->id}/reactivate")->assertOk()->assertJsonPath('user.deactivated_at', null);
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/auth/login', ['email' => 'ben@example.com', 'password' => 'Ben-password-1'])->assertOk();

        $this->assertSame(['Deactivated user: Ben', 'Reactivated user: Ben'],
            ActivityLog::where('type', 'edited')->where('module', 'access')->orderBy('id')->pluck('description')->all());
    }

    public function test_an_admin_sets_a_new_password_and_the_user_is_signed_out_everywhere(): void
    {
        $this->member->createToken('Phone');
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/v1/users/{$this->member->id}/password", ['password' => 'weak'])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->putJson("/api/v1/users/{$this->member->id}/password", ['password' => 'Fresh-start-9'])->assertOk();

        $this->assertTrue(Hash::check('Fresh-start-9', $this->member->fresh()->password));
        $this->assertSame(0, $this->member->tokens()->count());
        $this->assertSame(1, ActivityLog::where('description', 'Set a new password for Ben')->count());
        $this->assertStringNotContainsString('Fresh-start-9', ActivityLog::all()->toJson());
    }

    public function test_daily_only_users_can_reach_their_profile_but_not_the_user_list(): void
    {
        Sanctum::actingAs($this->member);

        $this->getJson('/api/v1/profile')->assertOk();
        $this->getJson('/api/v1/users')->assertForbidden();
    }
}
