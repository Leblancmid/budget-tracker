<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function login(array $overrides = [])
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => 'mikey@example.com', 'password' => 'correct-horse', ...$overrides,
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();
        User::factory()->create(['email' => 'mikey@example.com', 'password' => 'correct-horse']);
    }

    public function test_a_normal_login_lasts_a_working_day(): void
    {
        $this->travelTo(now()->startOfMinute());

        $res = $this->login()->assertOk()
            ->assertJsonStructure(['token', 'expires_at', 'remember', 'user' => ['id', 'name', 'email', 'role']])
            ->assertJsonPath('remember', false);

        $this->assertStringStartsWith('budget_', explode('|', $res->json('token'))[1]);
        $token = PersonalAccessToken::firstOrFail();
        $this->assertEquals(now()->addHours(12), $token->expires_at);
        $this->assertSame(now()->addHours(12)->toIso8601String(), $res->json('expires_at'));
    }

    public function test_remember_me_lasts_thirty_days(): void
    {
        $this->travelTo(now()->startOfMinute());

        $this->login(['remember' => true])->assertOk()->assertJsonPath('remember', true);

        $this->assertEquals(now()->addDays(30), PersonalAccessToken::firstOrFail()->expires_at);
    }

    public function test_tokens_stop_working_once_they_expire(): void
    {
        $token = $this->login()->json('token');

        $this->withToken($token)->getJson('/api/v1/dashboard')->assertOk();

        $this->travel(13)->hours();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/dashboard')->assertUnauthorized();
    }

    public function test_tokens_issued_without_an_expiry_are_capped_at_thirty_days(): void
    {
        // Tokens from before per-token expiry existed have expires_at = null
        $legacy = User::firstOrFail()->createToken('legacy')->plainTextToken;

        $this->travel(31)->days();
        $this->withToken($legacy)->getJson('/api/v1/dashboard')->assertUnauthorized();
    }

    public function test_wrong_password_and_unknown_email_get_the_same_answer(): void
    {
        $wrongPassword = $this->login(['password' => 'nope'])->assertStatus(422)->json();
        $unknownEmail  = $this->login(['email' => 'nobody@example.com'])->assertStatus(422)->json();

        $this->assertSame(['The provided credentials are incorrect.'], $wrongPassword['errors']['email']);
        $this->assertSame($wrongPassword, $unknownEmail);
    }

    public function test_surrounding_spaces_in_the_email_are_ignored(): void
    {
        $this->login(['email' => '  mikey@example.com '])->assertOk();
    }

    public function test_repeated_failures_lock_the_account_out_briefly(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->login(['password' => 'nope'])->assertStatus(422);
        }

        // Even the right password is refused while locked out
        $this->login()->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJsonPath('message', fn ($m) => str_starts_with($m, 'Too many login attempts.'));

        $this->travel(61)->seconds();
        $this->login()->assertOk();
    }

    public function test_a_successful_login_resets_the_failure_count(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $this->login(['password' => 'nope']);
        }
        $this->login()->assertOk();

        for ($i = 0; $i < 4; $i++) {
            $this->login(['password' => 'nope'])->assertStatus(422);
        }
    }

    public function test_login_cleans_up_this_users_expired_tokens(): void
    {
        $user = User::firstOrFail();
        $user->createToken('old', ['*'], now()->subDay());
        $user->createToken('still valid', ['*'], now()->addDay());

        $this->login()->assertOk();

        $this->assertSame(['still valid', 'Symfony'], $user->tokens()->orderBy('id')->pluck('name')->all());
    }

    public function test_logout_revokes_only_this_device(): void
    {
        $phone  = $this->login()->json('token');
        $laptop = $this->login()->json('token');

        $this->withToken($phone)->postJson('/api/v1/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();

        $this->withToken($phone)->getJson('/api/v1/dashboard')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($laptop)->getJson('/api/v1/dashboard')->assertOk();
    }

    public function test_logout_all_revokes_every_device(): void
    {
        $phone  = $this->login()->json('token');
        $laptop = $this->login()->json('token');

        $this->withToken($phone)->postJson('/api/v1/auth/logout-all')->assertOk();
        $this->app['auth']->forgetGuards();

        $this->withToken($laptop)->getJson('/api/v1/dashboard')->assertUnauthorized();
        $this->assertSame(0, PersonalAccessToken::count());
    }

    public function test_api_responses_carry_security_headers(): void
    {
        $this->login()->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_login_input_is_bounded(): void
    {
        $this->login(['email' => str_repeat('a', 250) . '@example.com'])->assertStatus(422)->assertJsonValidationErrors('email');
        $this->login(['password' => str_repeat('x', 300)])->assertStatus(422)->assertJsonValidationErrors('password');
        $this->login(['remember' => 'yes please'])->assertStatus(422)->assertJsonValidationErrors('remember');
    }
}
