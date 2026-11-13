<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** People are told (the bell) when an admin changes their account; never about their own doing. */
class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $ben;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['name' => 'Ann', 'role' => 'admin']);
        $this->ben = User::factory()->create(['name' => 'Ben', 'email' => 'ben@example.com', 'role' => 'daily_only']);
    }

    private function bell(User $u): array
    {
        Sanctum::actingAs($u);

        return $this->getJson('/api/v1/notifications')->assertOk()->json();
    }

    public function test_access_details_password_and_reactivation_are_each_told(): void
    {
        Sanctum::actingAs($this->admin);
        // A second apart, so newest-first has one right order
        $this->patchJson("/api/v1/users/{$this->ben->id}", ['role' => 'trader'])->assertOk();
        $this->travel(1)->seconds();
        $this->patchJson("/api/v1/users/{$this->ben->id}", ['email' => 'benny@example.com'])->assertOk();
        $this->travel(1)->seconds();
        $this->putJson("/api/v1/users/{$this->ben->id}/password", ['password' => 'Reset-by-ann-1'])->assertOk();
        $this->postJson("/api/v1/users/{$this->ben->id}/deactivate")->assertOk();
        $this->travel(1)->seconds();
        $this->postJson("/api/v1/users/{$this->ben->id}/reactivate")->assertOk();

        $bell = $this->bell($this->ben);
        $this->assertSame(4, $bell['unread']);
        $this->assertSame(['reactivated', 'password', 'details', 'access'], array_column($bell['data'], 'kind'));
        $access = $bell['data'][3];
        $this->assertSame('Your access changed', $access['title']);
        $this->assertSame("You're now Trader. You can open: Daily Expenses, Trading and Storefront.", $access['body']);
        $this->assertSame('Ann', $access['by']);
        $this->assertSame('You now sign in with benny@example.com.', $bell['data'][2]['body']);
    }

    public function test_nothing_is_told_when_nothing_changed_or_about_your_own_doing(): void
    {
        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/v1/users/{$this->ben->id}", ['role' => 'daily_only', 'name' => 'Ben'])->assertOk();
        $this->patchJson("/api/v1/users/{$this->admin->id}", ['name' => 'Annie'])->assertOk();
        Sanctum::actingAs($this->ben);
        $this->putJson('/api/v1/profile/password', ['current_password' => 'password', 'password' => 'Ben-own-pass-1', 'password_confirmation' => 'Ben-own-pass-1'])->assertOk();

        $this->assertSame(0, $this->bell($this->ben)['unread']);
        $this->assertSame(0, $this->bell($this->admin)['unread']);
    }

    public function test_marking_read_and_only_your_own(): void
    {
        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/v1/users/{$this->ben->id}", ['role' => 'trader'])->assertOk();
        $this->patchJson("/api/v1/users/{$this->ben->id}", ['name' => 'Benjamin'])->assertOk();

        $bell = $this->bell($this->ben);
        $first = $bell['data'][0]['id'];

        // The admin can't read Ben's
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/v1/notifications/{$first}/read")->assertNotFound();

        Sanctum::actingAs($this->ben);
        $this->postJson("/api/v1/notifications/{$first}/read")->assertOk()->assertJsonPath('unread', 1);
        $this->postJson('/api/v1/notifications/read-all')->assertOk()->assertJsonPath('unread', 0);
        $this->assertNotNull($this->bell($this->ben)['data'][1]['read_at']);
        $this->getJson('/api/v1/master/operations')->assertForbidden(); // (Ben has no Master File; nothing to undo)
    }
}
