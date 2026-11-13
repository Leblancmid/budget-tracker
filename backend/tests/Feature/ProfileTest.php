<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Your own profile: name, email, picture, password and signed-in devices. */
class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->user = User::factory()->create(['name' => 'Mikey', 'email' => 'mikey@example.com', 'role' => 'daily_only', 'password' => 'Old-password-1']);
    }

    /** A real token (not Sanctum::actingAs), so "this device" can be told apart. */
    private function signIn(string $agent = 'Laptop Chrome'): string
    {
        return $this->withHeaders(['User-Agent' => $agent])
            ->postJson('/api/v1/auth/login', ['email' => 'mikey@example.com', 'password' => 'Old-password-1'])
            ->assertOk()->json('token');
    }

    public function test_guests_get_401(): void
    {
        $this->getJson('/api/v1/profile')->assertUnauthorized();
        $this->patchJson('/api/v1/profile', ['name' => 'X'])->assertUnauthorized();
    }

    public function test_the_profile_shows_the_user_and_their_devices(): void
    {
        $this->signIn('Phone Safari');
        $token = $this->signIn('Laptop Chrome');
        $this->app['auth']->forgetGuards();

        $res = $this->withToken($token)->getJson('/api/v1/profile')->assertOk();

        $res->assertJsonPath('user.email', 'mikey@example.com')
            ->assertJsonPath('user.role', 'daily_only')
            ->assertJsonPath('user.avatar_url', null)
            ->assertJsonMissingPath('user.password');
        $sessions = collect($res->json('sessions'));
        $this->assertCount(2, $sessions);
        $this->assertSame('Laptop Chrome', $sessions->firstWhere('current', true)['device']);
    }

    public function test_name_and_email_can_be_changed_one_at_a_time(): void
    {
        Sanctum::actingAs($this->user);

        $this->patchJson('/api/v1/profile', ['name' => '  Michael  '])->assertOk()
            ->assertJsonPath('user.name', 'Michael')->assertJsonPath('user.email', 'mikey@example.com');
        $this->patchJson('/api/v1/profile', ['email' => 'NEW@Example.com'])->assertOk()
            ->assertJsonPath('user.email', 'new@example.com')->assertJsonPath('user.name', 'Michael');

        $edit = ActivityLog::where('type', 'edited')->where('loggable_type', User::class)->latest('id')->first();
        $this->assertEquals(['before' => 'mikey@example.com', 'after' => 'new@example.com'], $edit->changes['email']);
    }

    public function test_profile_validation(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        Sanctum::actingAs($this->user);

        $this->patchJson('/api/v1/profile', ['name' => '', 'email' => 'not-an-email'])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email']);
        $this->patchJson('/api/v1/profile', ['email' => 'taken@example.com'])->assertUnprocessable()->assertJsonValidationErrors('email');
        // Sending your own unchanged email back is fine
        $this->patchJson('/api/v1/profile', ['email' => 'mikey@example.com'])->assertOk();
    }

    public function test_role_cannot_be_changed_from_the_profile(): void
    {
        Sanctum::actingAs($this->user);

        $this->patchJson('/api/v1/profile', ['role' => 'admin'])->assertOk();
        $this->assertSame('daily_only', $this->user->fresh()->role);
    }

    public function test_a_profile_picture_is_stored_under_a_generated_name_and_replaced(): void
    {
        Sanctum::actingAs($this->user);

        $first = $this->postJson('/api/v1/profile/avatar', ['avatar' => UploadedFile::fake()->image('../../evil.php.png', 300, 300)])
            ->assertOk()->json('user.avatar_url');
        $path = $this->user->fresh()->avatar_path;
        $this->assertStringStartsWith('avatars/', $path);
        $this->assertStringNotContainsString('evil', $path);
        $this->assertStringEndsWith($path, $first);
        Storage::disk('public')->assertExists($path);

        $this->postJson('/api/v1/profile/avatar', ['avatar' => UploadedFile::fake()->image('me.webp', 512, 512)])->assertOk();
        Storage::disk('public')->assertMissing($path);

        $this->deleteJson('/api/v1/profile/avatar')->assertOk()->assertJsonPath('user.avatar_url', null);
        $this->assertSame([], Storage::disk('public')->allFiles('avatars'));
        $this->assertSame(['Changed profile picture: Mikey', 'Changed profile picture: Mikey', 'Removed profile picture: Mikey'],
            ActivityLog::where('module', 'access')->where('type', 'edited')->orderBy('id')->pluck('description')->all());
    }

    public function test_a_profile_picture_must_be_a_small_image(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/v1/profile/avatar', ['avatar' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')])
            ->assertUnprocessable()->assertJsonValidationErrors('avatar');
        $this->postJson('/api/v1/profile/avatar', ['avatar' => UploadedFile::fake()->image('big.jpg', 800, 800)->size(3000)])
            ->assertUnprocessable()->assertJsonValidationErrors('avatar');
        $this->postJson('/api/v1/profile/avatar', ['avatar' => UploadedFile::fake()->image('tiny.png', 20, 20)])
            ->assertUnprocessable()->assertJsonValidationErrors('avatar');
        $this->assertNull($this->user->fresh()->avatar_path);
    }

    public function test_changing_the_password_keeps_this_device_and_signs_out_the_others(): void
    {
        $other = $this->signIn('Phone Safari');
        $token = $this->signIn('Laptop Chrome');
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->putJson('/api/v1/profile/password', [
            'current_password' => 'Old-password-1', 'password' => 'New-password-2', 'password_confirmation' => 'New-password-2',
        ])->assertOk();

        $this->assertTrue(Hash::check('New-password-2', $this->user->fresh()->password));
        $this->assertSame(1, $this->user->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->withToken($other)->getJson('/api/v1/profile')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/profile')->assertOk();

        $log = ActivityLog::where('description', 'Changed own password')->sole();
        $this->assertNull($log->changes);
        $this->assertStringNotContainsString('New-password-2', ActivityLog::all()->toJson());
    }

    public function test_password_rules(): void
    {
        Sanctum::actingAs($this->user);
        $send = fn (array $data) => $this->putJson('/api/v1/profile/password', $data);

        $send(['current_password' => 'wrong', 'password' => 'New-password-2', 'password_confirmation' => 'New-password-2'])
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $send(['current_password' => 'Old-password-1', 'password' => 'short1A', 'password_confirmation' => 'short1A'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $send(['current_password' => 'Old-password-1', 'password' => 'alllowercase123', 'password_confirmation' => 'alllowercase123'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $send(['current_password' => 'Old-password-1', 'password' => 'New-password-2', 'password_confirmation' => 'Different-3'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('Old-password-1', $this->user->fresh()->password));
    }

    public function test_another_device_can_be_signed_out_but_not_someone_elses(): void
    {
        $this->signIn('Phone Safari');
        $token = $this->signIn('Laptop Chrome');
        $phone = $this->user->tokens()->where('name', 'Phone Safari')->value('id');
        $current = $this->user->tokens()->where('name', 'Laptop Chrome')->value('id');
        $stranger = User::factory()->create()->createToken('Their phone')->accessToken->id;
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->deleteJson("/api/v1/profile/sessions/{$stranger}")->assertNotFound();
        $this->withToken($token)->deleteJson("/api/v1/profile/sessions/{$current}")->assertUnprocessable();
        $this->withToken($token)->deleteJson("/api/v1/profile/sessions/{$phone}")->assertOk();

        $this->assertSame(['Laptop Chrome'], $this->user->tokens()->pluck('name')->all());
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $stranger]);
        $this->assertSame(1, ActivityLog::where('description', 'Signed out a device: Phone Safari')->count());
    }
}
