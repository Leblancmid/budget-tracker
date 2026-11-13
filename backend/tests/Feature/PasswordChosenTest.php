<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** A password an admin chose has to be replaced by the person before they can use the app. */
class PasswordChosenTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    private function signIn(string $email, string $password): string
    {
        $this->app['auth']->forgetGuards();

        return $this->postJson('/api/v1/auth/login', ['email' => $email, 'password' => $password])->assertOk()->json('token');
    }

    public function test_a_new_user_must_choose_their_own_password_first(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/v1/users', ['name' => 'Cara', 'email' => 'cara@example.com', 'role' => 'trader', 'password' => 'Admin-picked-1'])
            ->assertCreated()->assertJsonPath('user.must_change_password', true);

        $token = $this->signIn('cara@example.com', 'Admin-picked-1');
        $this->withToken($token)->getJson('/api/v1/profile')->assertOk()->assertJsonPath('user.must_change_password', true);
        $this->withToken($token)->getJson('/api/v1/dashboard')->assertForbidden()->assertJsonPath('code', 'password_change_required');
        $this->withToken($token)->getJson('/api/v1/business/dashboard')->assertForbidden()->assertJsonPath('code', 'password_change_required');

        $this->withToken($token)->putJson('/api/v1/profile/password', [
            'current_password' => 'Admin-picked-1', 'password' => 'Cara-own-pass-2', 'password_confirmation' => 'Cara-own-pass-2',
        ])->assertOk();

        $this->assertFalse(User::where('email', 'cara@example.com')->value('must_change_password'));
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/dashboard')->assertOk();
        $this->withToken($token)->getJson('/api/v1/profile')->assertJsonPath('user.must_change_password', false);
    }

    public function test_a_password_an_admin_sets_must_be_replaced_too_but_signing_out_still_works(): void
    {
        $ben = User::factory()->create(['email' => 'ben@example.com', 'role' => 'daily_only', 'password' => 'Ben-own-pass-1']);
        $this->getJson('/api/v1/dashboard')->assertUnauthorized();

        Sanctum::actingAs($this->admin);
        $this->putJson("/api/v1/users/{$ben->id}/password", ['password' => 'Reset-by-admin-2'])->assertOk();
        $this->assertTrue($ben->fresh()->must_change_password);

        $token = $this->signIn('ben@example.com', 'Reset-by-admin-2');
        $this->withToken($token)->getJson('/api/v1/transactions')->assertForbidden();
        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
    }

    public function test_someone_who_chose_their_own_password_is_not_blocked(): void
    {
        Sanctum::actingAs($this->admin);
        $this->getJson('/api/v1/users')->assertOk();
        $this->assertFalse((bool) $this->admin->fresh()->must_change_password);
    }
}
