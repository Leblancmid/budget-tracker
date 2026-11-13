<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** An admin's view of one person: devices, failed sign-ins, recent activity, signing them out. */
class UserDetailTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $ben;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->ben = User::factory()->create(['name' => 'Ben', 'email' => 'ben@example.com', 'role' => 'trader', 'password' => 'Ben-pass-123']);
    }

    private function benSignsIn(string $agent): void
    {
        $this->app['auth']->forgetGuards();
        $this->withHeaders(['User-Agent' => $agent])->postJson('/api/v1/auth/login', ['email' => 'ben@example.com', 'password' => 'Ben-pass-123'])->assertOk();
    }

    public function test_an_admin_sees_ones_devices_failed_sign_ins_and_activity(): void
    {
        $this->benSignsIn('Phone Safari');
        $this->benSignsIn('Laptop Chrome');
        $this->postJson('/api/v1/auth/login', ['email' => 'ben@example.com', 'password' => 'wrong'])->assertUnprocessable();

        Sanctum::actingAs($this->admin);
        $d = $this->getJson("/api/v1/users/{$this->ben->id}")->assertOk()->json();

        $this->assertSame('Ben', $d['user']['name']);
        $this->assertEqualsCanonicalizing(['Phone Safari', 'Laptop Chrome'], array_column($d['sessions'], 'device'));
        $this->assertSame(1, $d['failed_sign_ins']['last_30_days']);
        $this->assertSame('Failed sign-in: ben@example.com', $d['failed_sign_ins']['recent'][0]['description']);
        $this->assertSame(['Signed in', 'Signed in'], array_column($d['activity'], 'description'));
    }

    public function test_an_admin_signs_someone_out_of_one_device_or_everywhere(): void
    {
        $this->benSignsIn('Phone Safari');
        $this->benSignsIn('Laptop Chrome');
        $phone = $this->ben->tokens()->where('name', 'Phone Safari')->value('id');

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/v1/users/{$this->ben->id}/sessions/{$phone}")->assertOk();
        $this->assertSame(['Laptop Chrome'], $this->ben->tokens()->pluck('name')->all());

        $this->postJson("/api/v1/users/{$this->ben->id}/sign-out-everywhere")->assertOk()->assertJsonPath('message', 'Ben was signed out of 1 device.');
        $this->assertSame(0, $this->ben->tokens()->count());
        $this->assertNull($this->ben->fresh()->deactivated_at, 'the account stays on');
    }

    public function test_only_admins_and_never_on_yourself(): void
    {
        $token = $this->admin->createToken('Admin laptop')->accessToken->id;
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/v1/users/{$this->admin->id}/sign-out-everywhere")->assertForbidden();
        $this->deleteJson("/api/v1/users/{$this->admin->id}/sessions/{$token}")->assertForbidden();
        // Another user's device id under Ben's address isn't found
        $this->deleteJson("/api/v1/users/{$this->ben->id}/sessions/{$token}")->assertNotFound();

        Sanctum::actingAs($this->ben);
        $this->getJson("/api/v1/users/{$this->admin->id}")->assertForbidden();
        $this->postJson("/api/v1/users/{$this->admin->id}/sign-out-everywhere")->assertForbidden();
    }
}
